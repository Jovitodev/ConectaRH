import { supabase } from './supabase.js'
import { getCandidateRecord } from './candidateStore.js'

function dataOrThrow({ data, error }) {
  if (error) throw error
  return data
}

export async function loadAreas() {
  const { candidato } = await getCandidateRecord()
  const [areas, selected] = await Promise.all([
    supabase.from('areas').select('id,nome').eq('ativa', true).order('nome'),
    supabase.from('candidato_areas').select('area_id').eq('candidato_id', candidato.id),
  ])
  return { areas: dataOrThrow(areas), selectedIds: dataOrThrow(selected).map((row) => row.area_id) }
}

export async function saveAreas(ids) {
  const { candidato } = await getCandidateRecord()
  const current = dataOrThrow(await supabase.from('candidato_areas').select('area_id').eq('candidato_id', candidato.id)).map((row) => row.area_id)
  const wanted = [...new Set(ids.map(Number))]
  const removed = current.filter((id) => !wanted.includes(id))
  const added = wanted.filter((id) => !current.includes(id))
  if (added.length) dataOrThrow(await supabase.from('candidato_areas').insert(added.map((area_id) => ({ candidato_id: candidato.id, area_id }))))
  if (removed.length) dataOrThrow(await supabase.from('candidato_areas').delete().eq('candidato_id', candidato.id).in('area_id', removed))
}

export async function loadNotifications() {
  const { candidato } = await getCandidateRecord()
  return dataOrThrow(await supabase.from('notificacoes').select('id,titulo,mensagem,tipo,lida,created_at').eq('candidato_id', candidato.id).order('created_at', { ascending: false }))
}

export async function markNotificationsRead(ids) {
  if (!ids.length) return
  const { candidato } = await getCandidateRecord()
  dataOrThrow(await supabase.from('notificacoes').update({ lida: true }).eq('candidato_id', candidato.id).in('id', ids))
}
