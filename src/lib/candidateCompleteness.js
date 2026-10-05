import { supabase } from './supabase.js'
import { getCandidateRecord, loadCandidateResume } from './candidateStore.js'
import { loadAreas } from './candidateExtras.js'

export function checkCandidateCompleteness(user, resume, selectedAreaIds) {
  const missing = []
  if (!user.name?.trim() || !user.cpf || !user.birthDate || !user.email || !user.phone) missing.push(['perfil', 'Complete seus dados pessoais', 'Preencha os dados que faltam em Meu Perfil.', 'profile'])
  if (!user.title?.trim() || !user.stateId || !user.cityId) missing.push(['curriculo', 'Seu currículo ainda não está completo', 'Informe cargo atual, estado e cidade em Dados profissionais.', 'resume:professional'])
  if (!selectedAreaIds.length) missing.push(['areas', 'Informe sua área de interesse', 'Selecione pelo menos uma área de interesse no currículo.', 'resume:areas'])
  if (!resume.experiences?.length) missing.push(['experiencias', 'Adicione uma experiência profissional', 'Complete a seção Experiências Profissionais.', 'resume:experiences'])
  if (!resume.education?.length) missing.push(['formacao', 'Falta preencher sua formação', 'Complete a seção Formação Acadêmica & Cursos.', 'resume:education'])
  if (!resume.skills?.length) missing.push(['habilidades', 'Adicione pelo menos uma habilidade', 'Complete a seção Habilidades Técnicas.', 'resume:skills'])
  return missing.map(([chave, titulo, mensagem, destino]) => ({ chave, titulo, mensagem, destino, tipo: 'preenchimento_pendente' }))
}

export async function syncCandidateCompleteness() {
  const [{ candidato }, loaded, { selectedIds }] = await Promise.all([getCandidateRecord(), loadCandidateResume(), loadAreas()])
  const pending = checkCandidateCompleteness(loaded.user, loaded.resume, selectedIds)
  const keys = new Set(pending.map((item) => item.chave))
  const { data: existing, error } = await supabase.from('notificacoes').select('id,chave,ativa').eq('candidato_id', candidato.id).not('chave', 'is', null)
  if (error) throw error
  for (const item of pending) {
    const found = existing.find((row) => row.chave === item.chave)
    if (!found) {
      const { error: insertError } = await supabase.from('notificacoes').insert({ ...item, candidato_id: candidato.id })
      if (insertError && insertError.code !== '23505') throw insertError
    } else if (!found.ativa) {
      const { error: updateError } = await supabase.from('notificacoes').update({ ativa: true, lida: false }).eq('id', found.id)
      if (updateError) throw updateError
    }
  }
  const resolved = existing.filter((row) => row.ativa && !keys.has(row.chave)).map((row) => row.id)
  if (resolved.length) {
    const { error: updateError } = await supabase.from('notificacoes').update({ ativa: false }).in('id', resolved)
    if (updateError) throw updateError
  }
}
