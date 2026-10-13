import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, inputClass } from '@/components/recruitment-ui.jsx'
import { createCommercialOption, loadCommercialOptions } from '@/lib/commercialStore.js'

export default function CommercialOptionField({ type, label, value, onChange }) {
  const [options,setOptions]=useState([])
  const [adding,setAdding]=useState(false)
  const [name,setName]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  useEffect(()=>{
    let active=true
    loadCommercialOptions(type).then(rows=>{if(active)setOptions(rows)}).catch(cause=>{if(active)setError(cause.message)})
    return ()=>{active=false}
  },[type])
  const add=async()=>{
    setBusy(true)
    try {const row=await createCommercialOption(type,name);setOptions(current=>[...current,row].sort((a,b)=>a.nome.localeCompare(b.nome)));onChange(String(row.id));setName('');setAdding(false);setError('');toast.success('Opção cadastrada.')} catch(cause){setError(cause.message)} finally {setBusy(false)}
  }
  return <div className="space-y-2"><Field label={label}><select className={inputClass} value={value} required onChange={event=>onChange(event.target.value)}><option value="">Selecione uma opção</option>{options.map(option=><option key={option.id} value={option.id}>{option.nome}</option>)}</select></Field>
    {!adding ? <Button type="button" variant="ghost" size="sm" onClick={()=>setAdding(true)}><Plus className="h-3.5 w-3.5" /> Cadastrar opção</Button> : <div className="flex gap-2"><Input aria-label={`Nova opção de ${label}`} placeholder="Nome da nova opção" maxLength={120} value={name} onChange={event=>setName(event.target.value)} /><Button type="button" disabled={busy||name.trim().length<2} onClick={add}>Adicionar</Button><Button type="button" size="icon" variant="ghost" aria-label="Cancelar nova opção" onClick={()=>setAdding(false)}><X className="h-4 w-4" /></Button></div>}
    {error&&<p role="alert" className="text-xs text-destructive">{error}</p>}
  </div>
}
