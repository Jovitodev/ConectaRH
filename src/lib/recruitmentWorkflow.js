import { supabase } from './supabase.js'

export const PAGE_SIZE = 12
export const statuses = { em_andamento: 'Em andamento', aprovado: 'Aprovado', reprovado: 'Reprovado', contratado: 'Contratado', desistiu: 'Desistiu' }
export const vacancyStatuses = { ativa: 'Publicada', pausada: 'Pausada', encerrada: 'Encerrada', cancelada: 'Cancelada', rascunho: 'Rascunho' }
export const messageStatuses = { pendente: 'Pendente de envio', processamento: 'Em processamento', enviado: 'Enviada', falha: 'Falha no envio', entregue: 'Entrega confirmada' }
export const dateTime = (value, zone = 'America/Sao_Paulo') => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: zone }).format(new Date(value)) : 'Não informado'
export const dateOnly = (value) => value ? (value.length === 10 ? value.split('-').reverse().join('/') : new Date(value).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })) : 'Não informado'

export function checked(response) {
  if (response.error) {
    if (['PGRST205', 'PGRST202', '42P01', '42703'].includes(response.error.code)) throw new Error('A atualização do banco de recrutamento ainda precisa ser aplicada. Consulte a documentação da evolução de 13/10/2026.')
    throw response.error
  }
  return response.data
}
const paged = (response) => ({ rows: checked(response) || [], count: response.count || 0 })
const range = (query, page) => query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
// Escapa caracteres da sintaxe PostgREST; busca simples por palavras, sem operadores fornecidos pelo usuário.
export const searchText = (value) => String(value || '').replace(/[%_(),.\\"']/g, ' ').trim().slice(0, 150)

export async function currentStaff() {
  const { data, error } = await supabase.auth.getUser()
  if (error || data.user?.app_metadata?.role !== 'colaborador') throw new Error('Entre com um perfil de recrutamento autorizado.')
  return data.user
}

export async function vacancyDirectory({ page = 0, search = '', status = 'todas', filter = 'todas', order = 'recentes' } = {}) {
  const user = await currentStaff()
  let query = supabase.from('recrutamento_vagas').select('*', { count: 'exact' }).eq('responsavel_auth_user_id', user.id)
  const text = searchText(search)
  if (text) query = query.or(`titulo.ilike.%${text}%,codigo.ilike.%${text}%`)
  if (status !== 'todas') query = query.eq('status', status)
  if (filter === 'mais_80_dias') query = query.lt('publicada_em', new Date(Date.now() - 80 * 86400000).toISOString())
  if (filter === 'sem_feedback') query = query.gt('sem_feedback_enviado', 0)
  const column = order === 'titulo' ? 'titulo' : 'publicada_em'
  return paged(await range(query.order(column, { ascending: order !== 'recentes', nullsFirst: false }).order('id', { ascending: false }), page))
}

export async function vacancyStages(id) {
  return checked(await supabase.from('recrutamento_etapas').select('*').eq('vaga_id', id)) || []
}

export async function applicationDirectory(id, { page = 0, search = '', stage = 'todas', status = 'todos', reason = '' } = {}) {
  let query = supabase.from('recrutamento_candidaturas').select('*', { count: 'exact' }).eq('vaga_id', id)
  const text = searchText(search)
  if (text) query = query.or(`nome_candidato.ilike.%${text}%,email_candidato.ilike.%${text}%`)
  if (searchText(reason)) query = query.ilike('motivo_interno', '%' + searchText(reason) + '%')
  if (stage !== 'todas') query = query.eq('etapa_atual', stage)
  if (status !== 'todos') query = query.eq('status', status)
  return paged(await range(query.order('aplicada_em', { ascending: false }).order('id', { ascending: false }), page))
}

export async function applicationById(id, vacancyId) {
  return checked(await supabase.from('candidaturas').select('*').eq('id',id).eq('vaga_id',vacancyId).single())
}

export async function moveApplication(app, stage) {
  if (stage === app.etapa_atual) throw new Error('Esta já é a etapa atual.')
  checked(await supabase.from('candidaturas').update({ etapa_atual: stage }).eq('id', app.id).eq('etapa_atual', app.etapa_atual).eq('status', app.status).select('id').single())
}
export async function rejectApplication(app, reason) {
  if (!reason.trim()) throw new Error('Informe o motivo da reprovação.')
  checked(await supabase.rpc('reprovar_candidatura', { p_id: app.id, p_status_anterior: app.status, p_motivo: reason.trim() }))
}
export async function addRecord(appId, type, text) {
  const user = await currentStaff()
  return checked(await supabase.from('candidatura_registros').insert({ candidatura_id: appId, tipo: type, conteudo: text.trim(), autor_id: user.id, autor_nome: user.user_metadata?.name || user.email }).select('id').single())
}
export async function recordPendingMessage(app, subject, text) {
  const user = await currentStaff()
  return checked(await supabase.from('candidatura_mensagens').insert({ candidatura_id: app.id, autor_id: user.id, assunto: subject.trim(), conteudo: text.trim(), remetente: user.email, destinatario: app.email_candidato, status: 'pendente' }).select('id').single())
}
export async function applicationHistory(table, appId, page = 0) {
  if (!['candidatura_eventos','candidatura_registros','candidatura_mensagens','feedbacks'].includes(table)) throw new Error('Histórico inválido.')
  return paged(await range(supabase.from(table).select('*', { count: 'exact' }).eq('candidatura_id', appId).order('created_at', { ascending: false }).order('id', { ascending: false }), page))
}
export async function scheduleInterview(appId, form) {
  return checked(await supabase.rpc('agendar_entrevista', {
    p_candidatura_id: appId, p_inicio_local: form.start, p_fuso: form.zone, p_duracao: Number(form.duration),
    p_entrevistador: form.interviewer.trim(), p_modalidade: form.mode, p_local: form.location.trim(), p_observacoes: form.notes.trim(),
  }))
}
export async function interviewDirectory({ page = 0, appId, date = '', status = 'todas' } = {}) {
  let query = supabase.from('entrevistas').select('*,candidaturas!inner(nome_candidato,vaga_titulo,vaga_id)', { count: 'exact' })
  if (appId) query = query.eq('candidatura_id', appId)
  // Calendário operacional da equipe em São Paulo (UTC-03); fuso individual é exibido em cada entrevista.
  if (date) {
    const start = new Date(`${date}T00:00:00-03:00`)
    query = query.gte('inicio', start.toISOString()).lt('inicio', new Date(start.getTime() + 86400000).toISOString())
  }
  if (status !== 'todas') query = query.eq('status', status)
  return paged(await range(query.order('inicio').order('id'), page))
}
export async function changeInterviewStatus(id, status) {
  if (!['concluida','cancelada'].includes(status)) throw new Error('Status inválido.')
  checked(await supabase.from('entrevistas').update({ status, updated_at: new Date().toISOString() }).eq('id', id).eq('status', 'agendada').select('id').single())
}
export const todayInSaoPaulo = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

export async function recruitmentMetrics() {
  await currentStaff()
  const count = async (query) => { const response = await query; checked(response); return response.count || 0 }
  const before = new Date(Date.now() - 80 * 86400000).toISOString()
  const today = todayInSaoPaulo()
  const start = new Date(`${today}T00:00:00-03:00`)
  const [active, applications, noFeedback, old, interviews] = await Promise.all([
    count(supabase.from('recrutamento_vagas').select('id', { count: 'exact', head: true }).eq('status','ativa')),
    count(supabase.from('candidaturas').select('id', { count: 'exact', head: true })),
    count(supabase.from('recrutamento_vagas').select('id', { count: 'exact', head: true }).gt('sem_feedback_enviado',0)),
    count(supabase.from('recrutamento_vagas').select('id', { count: 'exact', head: true }).eq('status','ativa').lt('publicada_em',before)),
    count(supabase.from('entrevistas').select('id', { count: 'exact', head: true }).eq('status','agendada').gte('inicio',start.toISOString()).lt('inicio',new Date(start.getTime()+86400000).toISOString())),
  ])
  return { active, applications, noFeedback, old, interviews }
}
