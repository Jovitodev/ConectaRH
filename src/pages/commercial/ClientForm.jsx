import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Field, inputClass } from '@/components/recruitment-ui.jsx'
import LocationFields from '@/components/LocationFields.jsx'
import CommercialOptionField from '@/components/CommercialOptionField.jsx'
import { clientStatuses, maskCep, maskCnpj, saveClient } from '@/lib/commercialStore.js'
import { maskPhone } from '@/lib/inputMasks.js'

export default function ClientForm({ client, onClose, onSaved }) {
  const [form,setForm]=useState(()=>({name:client.nome||'',tradeName:client.nome_fantasia||'',cnpj:maskCnpj(client.cnpj),contact:client.solicitante||'',businessId:String(client.negocio_id||''),phone:maskPhone(client.telefone),contactEmail:client.email_contato||'',billingEmail:client.email_faturamento||'',cep:maskCep(client.cep),state:client.estado||'',stateId:client.estado_id||null,city:client.cidade||'',cityId:client.cidade_id||null,address:client.endereco||'',status:client.status||'pendente'}))
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const set=(key,value)=>setForm(current=>({...current,[key]:value}))
  const locationChange=useCallback(patch=>setForm(current=>({...current,...patch})),[])
  const submit=async(event)=>{
    event.preventDefault();setBusy(true);setError('')
    try {await saveClient(client.id,form);toast.success('Cliente salvo e confirmado no banco.');onSaved()} catch(cause){setError(cause.message)} finally{setBusy(false)}
  }
  return <Dialog open onOpenChange={open=>!open&&!busy&&onClose()}><DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{client.id ? 'Editar cliente' : 'Novo cliente'}</DialogTitle><DialogDescription>Cadastre os dados da empresa e dos contatos comerciais. Os campos com * são obrigatórios.</DialogDescription></DialogHeader>
    <form onSubmit={submit} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2">
      <Field label="Razão social *"><Input required maxLength={200} value={form.name} onChange={event=>set('name',event.target.value)} /></Field>
      <Field label="Nome fantasia *"><Input required maxLength={200} value={form.tradeName} onChange={event=>set('tradeName',event.target.value)} /></Field>
      <Field label="CNPJ *"><Input required autoCapitalize="characters" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={event=>set('cnpj',maskCnpj(event.target.value))} /></Field>
      <Field label="Solicitante *"><Input required maxLength={200} value={form.contact} onChange={event=>set('contact',event.target.value)} /></Field>
      <CommercialOptionField type="negocio" label="Tipo de negócio *" value={form.businessId} onChange={value=>set('businessId',value)} />
      <Field label="Telefone com DDD *"><Input required type="tel" placeholder="(98) 99999-9999" value={form.phone} onChange={event=>set('phone',maskPhone(event.target.value))} /></Field>
      <Field label="E-mail de contato *"><Input required type="email" maxLength={254} value={form.contactEmail} onChange={event=>set('contactEmail',event.target.value)} /></Field>
      <Field label="E-mail de faturamento *"><Input required type="email" maxLength={254} value={form.billingEmail} onChange={event=>set('billingEmail',event.target.value)} /></Field>
      <Field label="CEP *"><Input required inputMode="numeric" placeholder="00000-000" value={form.cep} onChange={event=>set('cep',maskCep(event.target.value))} /></Field>
      <Field label="Status *"><select className={inputClass} value={form.status} onChange={event=>set('status',event.target.value)}>{Object.entries(clientStatuses).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></Field>
      <LocationFields value={form} onChange={locationChange} idPrefix="commercial-client" />
      <div className="sm:col-span-2"><Field label="Endereço *"><Input required maxLength={500} value={form.address} onChange={event=>set('address',event.target.value)} /></Field></div>
      <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Criado em: {client.created_at ? new Date(client.created_at).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}) : 'registrado automaticamente ao salvar'}. Somente clientes ativos e não arquivados ficam disponíveis para novas vagas.</p></div>
    </div>{error&&<p role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}<DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancelar</Button><Button disabled={busy}>{busy ? 'Salvando...' : 'Salvar cliente'}</Button></DialogFooter></form>
  </DialogContent></Dialog>
}
