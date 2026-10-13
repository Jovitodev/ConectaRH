import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, FileText, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Field, inputClass, Pagination, QueryState } from '@/components/recruitment-ui.jsx'
import CommercialOptionField from '@/components/CommercialOptionField.jsx'
import { loadProposals, proposalIndicators, proposalStatuses, proposalTypes, saveProposal } from '@/lib/commercialStore.js'
import { maskPhone } from '@/lib/inputMasks.js'
import { dateOnly, todayInSaoPaulo } from '@/lib/recruitmentWorkflow.js'

function ProposalForm({ client, type, proposal, onClose, onSaved }) {
  const [form,setForm]=useState(()=>({contact:proposal.solicitante||client.solicitante||'',email:proposal.email||client.email_contato||'',phone:maskPhone(proposal.telefone||client.telefone),sentDate:proposal.data_envio||todayInSaoPaulo(),originId:String(proposal.origem_id||''),status:proposal.status||'aguardando',rate:proposal.taxa_percentual??'',cancellationRate:proposal.cancelamento_percentual??'',dueDays:proposal.vencimento_dias??'',replacementDays:proposal.reposicao_dias??'',description:proposal.descricao||'',value:proposal.valor??''}))
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const set=(key,value)=>setForm(current=>({...current,[key]:value}))
  const submit=async(event)=>{
    event.preventDefault();setBusy(true);setError('')
    try {await saveProposal(client.id,type,proposal.id,form);toast.success('Proposta salva. Nenhuma mensagem foi enviada.');onSaved()} catch(cause){setError(cause.message)} finally {setBusy(false)}
  }
  return <Dialog open onOpenChange={open=>!open&&!busy&&onClose()}><DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{proposal.id ? `Editar proposta #${proposal.id}` : 'Nova proposta'} · {proposalTypes[type]}</DialogTitle><DialogDescription>{client.nome} · Registro comercial. Salvar não envia e-mail nem cria cobrança.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2">
    <Field label="Solicitante *"><Input required maxLength={200} value={form.contact} onChange={event=>set('contact',event.target.value)} /></Field>
    <Field label="E-mail *"><Input required type="email" maxLength={254} value={form.email} onChange={event=>set('email',event.target.value)} /></Field>
    <Field label="Telefone *"><Input required type="tel" value={form.phone} onChange={event=>set('phone',maskPhone(event.target.value))} /></Field>
    <Field label="Data do envio (informada) *"><Input required type="date" value={form.sentDate} onChange={event=>set('sentDate',event.target.value)} /></Field>
    <Field label="Status *"><select className={inputClass} value={form.status} onChange={event=>set('status',event.target.value)}>{Object.entries(proposalStatuses).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></Field>
    {type==='rs' ? <><CommercialOptionField type="origem" label="Como encontrou a Serhum *" value={form.originId} onChange={value=>set('originId',value)} />
      <Field label="Taxa (%) *"><Input required type="number" min={0} max={100} step="0.01" value={form.rate} onChange={event=>set('rate',event.target.value)} /></Field>
      <Field label="Taxa de cancelamento (%) *"><Input required type="number" min={0} max={100} step="0.01" value={form.cancellationRate} onChange={event=>set('cancellationRate',event.target.value)} /></Field>
      <Field label="Vencimento (dias) *"><Input required type="number" min={0} step={1} value={form.dueDays} onChange={event=>set('dueDays',event.target.value)} /></Field>
      <Field label="Reposição (dias) *"><Input required type="number" min={0} step={1} value={form.replacementDays} onChange={event=>set('replacementDays',event.target.value)} /></Field>
    </> : <><Field label="Valor (R$) *"><Input required type="number" min={0} step="0.01" value={form.value} onChange={event=>set('value',event.target.value)} /></Field><div className="sm:col-span-2"><Field label="Descrição *"><Textarea required minLength={3} maxLength={10000} rows={5} value={form.description} onChange={event=>set('description',event.target.value)} /></Field></div></>}
  </div>{error&&<p role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}<DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancelar</Button><Button disabled={busy}>{busy ? 'Salvando...' : 'Salvar proposta'}</Button></DialogFooter></form></DialogContent></Dialog>
}

export default function Proposals({ client, initialType='rs', onClose }) {
  const [type,setType]=useState(initialType)
  const [status,setStatus]=useState('todos')
  const [page,setPage]=useState(0)
  const [data,setData]=useState({rows:[],count:0})
  const [metrics,setMetrics]=useState(null)
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(true)
  const [editor,setEditor]=useState(null)
  const [revision,setRevision]=useState(0)
  useEffect(()=>{
    let active=true;setLoading(true);setError('')
    Promise.all([loadProposals({companyId:client.id,type,page,status}),proposalIndicators(client.id,type)]).then(([result,counts])=>{if(active){setData(result);setMetrics(counts)}}).catch(cause=>{if(active)setError(cause.message)}).finally(()=>{if(active)setLoading(false)})
    return ()=>{active=false}
  },[client.id,type,page,status,revision])
  return <Dialog open onOpenChange={open=>!open&&!editor&&onClose()}><DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto"><DialogHeader><DialogTitle>Propostas · {client.nome}</DialogTitle><DialogDescription>Acompanhe as propostas de cada serviço e seus resultados.</DialogDescription></DialogHeader>
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2">{Object.entries(proposalTypes).map(([value,label])=><Button key={value} variant={type===value ? 'default' : 'outline'} onClick={()=>{setType(value);setStatus('todos');setPage(0);setMetrics(null)}}>{label}</Button>)}</div><Button disabled={!!client.excluido_em} onClick={()=>setEditor({})}><Plus className="h-4 w-4" /> Nova proposta</Button></div>
    {client.excluido_em&&<p className="text-sm text-muted-foreground">Restaure o cliente para criar ou editar propostas. O histórico permanece disponível.</p>}
    <div className="grid gap-3 sm:grid-cols-3">{[['fechado','Fechado','text-emerald-700 bg-emerald-50'],['aguardando','Aguardando','text-amber-700 bg-amber-50'],['nao_fechado','Não fechado','text-rose-700 bg-rose-50']].map(([key,label,color])=><button key={key} className={`rounded-xl border p-4 text-left ${status===key ? 'ring-2 ring-primary' : ''}`} onClick={()=>{setStatus(key);setPage(0)}}><span className={`mb-2 inline-block rounded-lg px-2 py-1 text-xs ${color}`}>{label}</span><p className="font-poppins text-2xl font-semibold">{loading ? '…' : metrics?.[key]??'—'}</p></button>)}</div>
    <div className="flex justify-between gap-3 text-sm"><span className="text-muted-foreground">{proposalTypes[type]}</span><Button size="sm" variant="ghost" onClick={()=>{setStatus('todos');setPage(0)}}>Ver todos os status</Button></div>
    <QueryState loading={loading} error={error} empty={false}>{data.rows.length ? <div className="space-y-3">{data.rows.map(row=><Card key={row.id} className="space-y-3 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><strong className="text-sm">Proposta #{row.id}</strong><span className="ml-3 text-xs text-muted-foreground">{dateOnly(row.data_envio)}</span></div><div className="flex gap-2"><Badge variant="secondary">{proposalStatuses[row.status]}</Badge><Button size="sm" variant="outline" disabled={!!client.excluido_em} onClick={()=>setEditor(row)}><Pencil className="h-3.5 w-3.5" /> Editar</Button></div></div><p className="text-sm">{row.solicitante} · {row.email}</p>{type==='rs' ? <div className="grid gap-2 text-sm sm:grid-cols-4"><p>Taxa: {Number(row.taxa_percentual).toLocaleString('pt-BR')}%</p><p>Cancelamento: {Number(row.cancelamento_percentual).toLocaleString('pt-BR')}%</p><p>Vencimento: {row.vencimento_dias} dias</p><p>Reposição: {row.reposicao_dias} dias</p></div> : <><p className="font-semibold text-primary">{Number(row.valor).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</p><p className="whitespace-pre-wrap text-sm">{row.descricao}</p></>}</Card>)}</div> : <div className="rounded-xl border border-dashed p-10 text-center"><FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><p className="text-sm text-muted-foreground">Nenhuma proposta encontrada para este cliente nesta seleção.</p></div>}</QueryState>
    <Pagination page={page} total={data.count} onChange={setPage} />
    {editor&&<ProposalForm key={editor.id||'new'} client={client} type={type} proposal={editor} onClose={()=>setEditor(null)} onSaved={()=>{setEditor(null);setRevision(current=>current+1)}} />}
  </DialogContent></Dialog>
}
