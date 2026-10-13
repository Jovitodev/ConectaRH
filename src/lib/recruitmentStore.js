import { supabase } from './supabase.js'
import { getCandidateRecord, loadCandidateResume } from './candidateStore.js'
import { sectors } from '@/data/mockData.js'

function result({ data, error }) {
  if (error) throw error
  return data
}

export const RECRUITMENT_PAGE_SIZE = 12

function pageResult({ data, count, error }) {
  if (error) throw error
  return { rows: data || [], count: count || 0 }
}

const pageRange = (page) => [page * RECRUITMENT_PAGE_SIZE, (page + 1) * RECRUITMENT_PAGE_SIZE - 1]

export async function loadCompanies() {
  return result(await supabase.from('empresas').select('id,nome').eq('ativa', true).order('nome'))
}

export async function loadRecruitmentAreas() {
  return result(await supabase.from('areas').select('id,nome').order('nome'))
}

export async function loadOwnedVacancies(page = 0, filter = 'todas') {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Sessão expirada. Entre novamente.')
  const [start, end] = pageRange(page)
  let response
  if (filter === 'sem_feedback') {
    const matching = pageResult(await supabase.from('vagas_resumo_fase1').select('vaga_id', { count: 'exact' }).gt('sem_feedback', 0).order('vaga_id', { ascending: false }).range(start, end))
    if (!matching.rows.length) return { rows: [], count: matching.count }
    const rows = result(await supabase.from('vagas').select('*,empresas(nome)').eq('responsavel_auth_user_id', user.id).in('id', matching.rows.map((item) => item.vaga_id)).order('id', { ascending: false }))
    response = { rows, count: matching.count }
  } else {
    let query = supabase.from('vagas').select('*,empresas(nome)', { count: 'exact' }).eq('responsavel_auth_user_id', user.id)
    if (filter === 'mais_80_dias') query = query.lt('publicada_em', new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString())
    response = pageResult(await query.order('created_at', { ascending: false }).range(start, end))
  }
  if (!response.rows.length) return response
  const summaries = result(await supabase.from('vagas_resumo_fase1').select('vaga_id,candidaturas,sem_feedback').in('vaga_id', response.rows.map((row) => row.id)))
  const byId = new Map(summaries.map((row) => [row.vaga_id, row]))
  return { ...response, rows: response.rows.map((row) => ({ ...row, summary: byId.get(row.id) || { candidaturas: 0, sem_feedback: 0 } })) }
}

export async function loadPublicVacancies(page = 0) {
  const [start, end] = pageRange(page)
  return pageResult(await supabase.from('vagas').select('*,empresas(nome)', { count: 'exact' }).eq('status', 'ativa').eq('visibilidade', 'publica').order('publicada_em', { ascending: false }).range(start, end))
}

export async function loadOwnedVacancy(id) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Sessão expirada. Entre novamente.')
  return result(await supabase.from('vagas').select('*,empresas(nome)').eq('id', id).eq('responsavel_auth_user_id', user.id).single())
}

export async function createVacancy(form) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user || user.app_metadata?.role !== 'colaborador') throw new Error('Entre como colaborador para criar vagas.')
  return result(await supabase.from('vagas').insert({
    empresa_id: Number(form.companyId), responsavel_auth_user_id: user.id, titulo: form.title.trim(), departamento: form.department || null,
    descricao: form.description || null, cidade_id: form.cityId, estado_id: form.stateId,
    localidade_texto: `${form.city}, ${form.state}`, modalidade: form.model, contrato: form.type,
    salario_min: form.salaryMinValue, salario_max: form.salaryMaxValue,
    requisitos: form.requirements.filter(Boolean), beneficios: form.benefits.filter(Boolean), areas: form.areas,
    etapas_iniciais: form.pipeline.filter(Boolean), visibilidade: form.visibility,
    status: form.published ? 'ativa' : 'rascunho', inscricoes_inicio: form.applicationStart, inscricoes_fim: form.applicationEnd,
    publicada_em: form.published ? new Date().toISOString() : null,
  }).select('*').single())
}

export async function updateVacancyStatus(id, status) {
  const current = await loadOwnedVacancy(id)
  const changes = { status, updated_at: new Date().toISOString() }
  if (status === 'ativa' && !current.publicada_em) changes.publicada_em = new Date().toISOString()
  return result(await supabase.from('vagas').update(changes).eq('id', id).eq('responsavel_auth_user_id', current.responsavel_auth_user_id).select('id,status,publicada_em').single())
}

export async function duplicateOwnedVacancy(id) {
  const current = await loadOwnedVacancy(id)
  const columns = ['empresa_id','responsavel_auth_user_id','departamento','descricao','cidade_id','estado_id','localidade_texto','modalidade','contrato','salario_min','salario_max','requisitos','beneficios','areas','etapas_iniciais','visibilidade','inscricoes_inicio','inscricoes_fim']
  const payload = Object.fromEntries(columns.map((key) => [key,current[key]]))
  return result(await supabase.from('vagas').insert({ ...payload,titulo:`${current.titulo} (cópia)`,status:'rascunho',publicada_em:null }).select('id,codigo').single())
}

export async function updateOwnedVacancy(id, form) {
  const current = await loadOwnedVacancy(id)
  const nextStatus = form.status
  const changes = {
    empresa_id: Number(form.companyId), titulo: form.title.trim(), departamento: form.department || null,
    descricao: form.description || null, cidade_id: form.cityId, estado_id: form.stateId,
    localidade_texto: `${form.city}, ${form.state}`, modalidade: form.model, contrato: form.type,
    salario_min: form.salaryMinValue, salario_max: form.salaryMaxValue,
    requisitos: form.requirements.filter(Boolean), beneficios: form.benefits.filter(Boolean),
    areas: form.areas, etapas_iniciais: form.pipeline.filter(Boolean),
    visibilidade: form.visibility, status: nextStatus,
    inscricoes_inicio: form.applicationStart, inscricoes_fim: form.applicationEnd,
    updated_at: new Date().toISOString(),
  }
  if (nextStatus === 'ativa' && !current.publicada_em) changes.publicada_em = new Date().toISOString()
  return result(await supabase.from('vagas').update(changes).eq('id', id).eq('responsavel_auth_user_id', current.responsavel_auth_user_id).select('*').single())
}

export function toPublicJob(row) {
  return {
    id: `db-${row.id}`, code: row.codigo, title: row.titulo, company: row.empresas?.nome || '',
    sector: sectors.find((sector) => sector.label === row.areas?.[0])?.id || '', areas: row.areas || [],
    location: row.localidade_texto || '', model: row.modalidade || '', type: row.contrato || '',
    salary: row.salario_min && row.salario_max ? `R$ ${Number(row.salario_min).toLocaleString('pt-BR')} a R$ ${Number(row.salario_max).toLocaleString('pt-BR')}` : 'A combinar',
    salaryMin: Number(row.salario_min || 0), salaryMax: Number(row.salario_max || 0),
    description: row.descricao || '', requirements: row.requisitos || [], benefits: row.beneficios || [],
    applicationStart: row.inscricoes_inicio, applicationEnd: row.inscricoes_fim,
    postedAt: new Date(row.publicada_em || row.created_at).toLocaleDateString('pt-BR'),
    pipeline: { steps: row.etapas_iniciais?.length ? row.etapas_iniciais : ['Triagem curricular'], totalSteps: row.etapas_iniciais?.length || 1 },
  }
}

export function toApplicationJob(row) {
  return {
    id: `db-${row.vaga_id}`, title: row.vaga_titulo, company: row.vaga_empresa,
    location: row.vaga_localidade || '', model: row.vaga_modalidade || '', type: row.vaga_contrato || '',
    areas: row.vaga_areas || [], sector: sectors.find((sector) => sector.label === row.vaga_areas?.[0])?.id || '',
    status: row.vaga_status, visibility: row.vaga_visibilidade,
    salary: row.vaga_salario_min && row.vaga_salario_max ? `R$ ${Number(row.vaga_salario_min).toLocaleString('pt-BR')} a R$ ${Number(row.vaga_salario_max).toLocaleString('pt-BR')}` : 'A combinar',
    pipeline: { steps: row.vaga_etapas?.length ? row.vaga_etapas : ['Triagem curricular'], totalSteps: row.vaga_etapas?.length || 1 },
  }
}

export async function applyToVacancy(vagaId) {
  const [{ usuario, candidato }, snapshot] = await Promise.all([getCandidateRecord(), loadCandidateResume()])
  const { user, resume } = snapshot
  const areaRows = result(await supabase.from('candidato_areas').select('areas(nome)').eq('candidato_id', candidato.id))
  return result(await supabase.from('candidaturas').insert({
    vaga_id: vagaId, candidato_id: candidato.id, usuario_id: usuario.id, candidato_auth_user_id: usuario.auth_user_id,
    nome_candidato: usuario.nome, email_candidato: usuario.email, cidade_candidato: user.city || null,
    estado_candidato: user.state || null,
    escolaridade: resume.education?.[0]?.educationLevel || null,
    experiencias_resumo: (resume.experiences || []).map(({ role, company, period, description }) => ({ role, company, period, description })),
    habilidades: (resume.skills || []).map(({ name }) => name),
    idiomas_resumo: (resume.languages || []).map(({ name, level }) => ({ name, level })),
    areas: areaRows.map((row) => row.areas?.nome).filter(Boolean),
  }).select('id,vaga_id,aplicada_em,status,etapa_atual').single())
}

export async function loadMyApplications(page = 0) {
  const [start, end] = pageRange(page)
  return pageResult(await supabase.from('candidaturas').select('id,vaga_id,aplicada_em,status,etapa_atual,vaga_titulo,vaga_empresa,vaga_localidade,vaga_modalidade,vaga_contrato,vaga_areas,vaga_etapas,vaga_status,vaga_visibilidade,vaga_salario_min,vaga_salario_max', { count: 'exact' }).order('aplicada_em', { ascending: false }).range(start, end))
}

export async function loadAppliedVacancyIds(vagaIds) {
  if (!vagaIds.length) return []
  return result(await supabase.from('candidaturas').select('vaga_id').in('vaga_id', vagaIds)).map((row) => row.vaga_id)
}

export async function loadVacancyApplications(vagaId, page = 0) {
  const [start, end] = pageRange(page)
  return pageResult(await supabase.from('candidaturas').select('*,feedbacks(id,etapa,canal,status,observacao,created_at)', { count: 'exact' }).eq('vaga_id', vagaId).order('aplicada_em', { ascending: false }).range(start, end))
}

export async function recordFeedback(candidaturaId, values) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Sessão expirada. Entre novamente.')
  return result(await supabase.from('feedbacks').insert({
    candidatura_id: candidaturaId, responsavel_auth_user_id: user.id,
    etapa: values.etapa || null, canal: 'manual', status: values.status,
    observacao: values.observacao || null,
  }).select('id').single())
}
