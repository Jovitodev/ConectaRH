import { readFile } from 'node:fs/promises'

const { states, cities } = JSON.parse(await readFile(new URL('../supabase/reference/ibge-localidades-2026-10-05.json', import.meta.url), 'utf8'))
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`
const batch = Number(process.argv[2])
const size = 250
if (!Number.isInteger(batch) || batch < 0 || batch > Math.ceil(cities.length / size)) throw new Error('Lote inválido.')
if (batch === 0) {
  console.log(`insert into public.estados(id,nome,sigla) values ${states.map((state) => `(${state.id},${quote(state.nome)},${quote(state.sigla)})`).join(',')} on conflict (id) do update set nome=excluded.nome,sigla=excluded.sigla;`)
} else {
  const selected = cities.slice((batch - 1) * size, batch * size)
  console.log(`insert into public.cidades(id,estado_id,nome) values ${selected.map((city) => `(${city.id},${city.estado_id},${quote(city.nome)})`).join(',')} on conflict (id) do update set estado_id=excluded.estado_id,nome=excluded.nome;`)
}
