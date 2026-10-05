import { supabase } from './supabase.js'

let statesPromise

export function loadStates() {
  if (!statesPromise) {
    statesPromise = supabase.from('estados').select('id,nome,sigla').order('nome').then(({ data, error }) => {
      if (error) throw error
      return data
    }).catch((error) => { statesPromise = null; throw error })
  }
  return statesPromise
}

export async function searchCities(stateId, term, limit = 20) {
  if (!stateId || term.trim().length < 2) return []
  const safe = term.trim().replace(/[\\%_]/g, '\\$&')
  const { data, error } = await supabase.from('cidades').select('id,nome,estado_id')
    .eq('estado_id', stateId).ilike('nome', `${safe}%`).order('nome').limit(limit)
  if (error) throw error
  return data
}
