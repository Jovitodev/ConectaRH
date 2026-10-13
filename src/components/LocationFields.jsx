import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loadStates, searchCities } from '@/lib/locations.js'

export default function LocationFields({ value, onChange, idPrefix = 'location' }) {
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [searching, setSearching] = useState(false)
  useEffect(() => {
    let active = true
    loadStates().then((items) => { if (active) setStates(items) }).catch((error) => toast.error('Não foi possível carregar estados: ' + error.message))
    return () => { active = false }
  }, [])
  useEffect(() => {
    if (value.stateId || !value.state || !states.length) return
    const match = states.find((state) => state.sigla === value.state || state.nome.toLowerCase() === value.state.toLowerCase())
    if (match) onChange({ stateId: match.id, state: match.sigla })
  }, [states, value.stateId, value.state, onChange])
  useEffect(() => {
    if (!value.stateId || !value.city || value.cityId) return
    let active = true
    searchCities(value.stateId, value.city).then((items) => {
      if (!active) return
      const match = items.find((city) => city.nome.toLowerCase() === value.city.toLowerCase())
      if (match) onChange({ cityId: match.id, city: match.nome })
    }).catch(() => {})
    return () => { active = false }
  }, [value.stateId, value.city, value.cityId, onChange])
  useEffect(() => {
    if (!value.stateId || value.city.trim().length < 2 || value.cityId) { setCities([]); setSearching(false); return }
    let active = true
    setSearching(true)
    const timer = setTimeout(() => {
      searchCities(value.stateId, value.city).then((items) => { if (active) setCities(items) })
        .catch((error) => { if (active) toast.error('Não foi possível buscar cidades: ' + error.message) })
        .finally(() => { if (active) setSearching(false) })
    }, 250)
    return () => { active = false; clearTimeout(timer) }
  }, [value.stateId, value.city, value.cityId])
  return <>
    <div className="space-y-1.5"><Label htmlFor={`${idPrefix}-state`}>Estado</Label><select id={`${idPrefix}-state`} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={value.stateId || ''} onChange={(event) => {
      const selected = states.find((state) => state.id === Number(event.target.value))
      onChange({ stateId: selected?.id || null, state: selected?.sigla || '', cityId: null, city: '' })
    }}><option value="">Selecione o estado</option>{states.map((state) => <option key={state.id} value={state.id}>{state.nome} ({state.sigla})</option>)}</select></div>
    <div className="relative space-y-1.5"><Label htmlFor={`${idPrefix}-city`}>Cidade</Label><Input id={`${idPrefix}-city`} autoComplete="off" value={value.city} disabled={!value.stateId} onChange={(event) => onChange({ city: event.target.value, cityId: null })} placeholder={value.stateId ? 'Digite ao menos 2 letras' : 'Selecione o estado primeiro'} />{searching && <p className="text-xs text-muted-foreground">Buscando cidades...</p>}{cities.length > 0 && <div role="listbox" aria-label="Sugestões de cidades" className="absolute z-20 max-h-52 w-full overflow-auto rounded-md border bg-background shadow-lg">{cities.map((city) => <button key={city.id} type="button" role="option" aria-selected={false} className="block w-full px-3 py-2 text-left text-sm hover:bg-muted focus:bg-muted" onClick={() => { onChange({ city: city.nome, cityId: city.id }); setCities([]) }}>{city.nome}</button>)}</div>}{value.city && !value.cityId && !searching && <p className="text-xs text-amber-700">Selecione uma cidade da lista para usar o cadastro padronizado.</p>}</div>
  </>
}
