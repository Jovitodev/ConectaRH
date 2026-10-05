import { mkdir, writeFile } from 'node:fs/promises'

const root = new URL('../supabase/reference/', import.meta.url)
const base = 'https://servicodados.ibge.gov.br/api/v1/localidades'
const [statesResponse, citiesResponse] = await Promise.all([
  fetch(`${base}/estados`),
  fetch(`${base}/municipios`),
])
if (!statesResponse.ok || !citiesResponse.ok) throw new Error('Não foi possível consultar o catálogo do IBGE.')
const states = (await statesResponse.json()).map(({ id, nome, sigla }) => ({ id, nome, sigla })).sort((a, b) => a.id - b.id)
const cities = (await citiesResponse.json()).map((city) => ({
  id: city.id,
  estado_id: city.microrregiao?.mesorregiao?.UF?.id ?? city['regiao-imediata']?.['regiao-intermediaria']?.UF?.id,
  nome: city.nome,
})).sort((a, b) => a.id - b.id)
if (states.length !== 27 || cities.length < 5500 || cities.some((city) => !states.some((state) => state.id === city.estado_id))) {
  throw new Error('Catálogo incompleto ou com município sem UF.')
}
await mkdir(root, { recursive: true })
await writeFile(new URL('ibge-localidades-2026-10-05.json', root), JSON.stringify({ source: base, fetched_at: new Date().toISOString(), states, cities }))
console.log(`Salvos ${states.length} estados e ${cities.length} municípios.`)
