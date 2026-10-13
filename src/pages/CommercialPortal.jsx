import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Building2, ShieldCheck, CircleX, Clock, Ban, Plus, Pencil, Archive, RotateCcw, FileText, Shield, MessageCircle, SlidersHorizontal, FilterX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Field, inputClass, Pagination, QueryState } from '@/components/recruitment-ui.jsx'
import { archiveClient, changeClientStatus, clientStatuses, commercialIndicators, loadClients, maskCnpj } from '@/lib/commercialStore.js'
import { maskPhone } from '@/lib/inputMasks.js'
import { dateOnly } from '@/lib/recruitmentWorkflow.js'
import ClientForm from '@/pages/commercial/ClientForm.jsx'
import Proposals from '@/pages/commercial/Proposals.jsx'

const initialFilters={company:'',tradeName:'',contact:'',cnpj:'',status:'todos',archived:false,page:0}
const colors={ativo:'border-t-emerald-500',inativo:'border-t-rose-500',pendente:'border-t-amber-400',bloqueado:'border-t-slate-600'}
const stats=[
  {key:'total',label:'Total de clientes',status:'todos',icon:Building2,color:'bg-sky-50 text-sky-700'},
  {key:'ativos',label:'Ativos',status:'ativo',icon:ShieldCheck,color:'bg-emerald-50 text-emerald-700'},
  {key:'inativos',label:'Inativos',status:'inativo',icon:CircleX,color:'bg-rose-50 text-rose-700'},
  {key:'pendentes',label:'Pendentes',status:'pendente',icon:Clock,color:'bg-amber-50 text-amber-700'},
  {key:'bloqueados',label:'Bloqueados',status:'bloqueado',icon:Ban,color:'bg-slate-100 text-slate-700'},
]

export default function CommercialPortal({user,onLogout}) {
  const [filters,setFilters]=useState(initialFilters)
  const [data,setData]=useState({rows:[],count:0})
  const [metrics,setMetrics]=useState(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [metricsError,setMetricsError]=useState('')
  const [revision,setRevision]=useState(0)
  const [editor,setEditor]=useState(null)
  const [proposals,setProposals]=useState(null)
  const [action,setAction]=useState(null)
  const [nextStatus,setNextStatus]=useState('')
  const [busy,setBusy]=useState(false)
  useEffect(()=>{
    let active=true;setLoading(true);setError('')
    const timer=setTimeout(()=>loadClients(filters).then(result=>{if(active)setData(result)}).catch(cause=>{if(active)setError(cause.message)}).finally(()=>{if(active)setLoading(false)}),250)
    return ()=>{active=false;clearTimeout(timer)}
  },[filters,revision])
  useEffect(()=>{
    let active=true;setMetricsError('')
    commercialIndicators().then(result=>{if(active)setMetrics(result)}).catch(cause=>{if(active)setMetricsError(cause.message)})
    return ()=>{active=false}
  },[revision])
  const filter=(key,value)=>setFilters(current=>({...current,[key]:value,page:0}))
  const refresh=()=>setRevision(current=>current+1)
  const confirm=async()=>{
    setBusy(true)
    try {
      if(action.type==='status')await changeClientStatus(action.client.id,nextStatus)
      else await archiveClient(action.client.id,action.type==='archive')
      setAction(null);refresh();toast.success('Cliente atualizado.')
    } catch(cause){toast.error(cause.message)} finally{setBusy(false)}
  }
  return <main className="min-h-screen bg-background">
    <header className="border-b bg-card"><div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6"><div><p className="font-poppins text-xl font-bold">Conecta<span className="text-primary">RH</span></p><p className="text-xs text-muted-foreground">Área Comercial · Clientes e propostas</p></div><div className="flex items-center gap-3"><span className="hidden text-xs text-muted-foreground sm:block">{user.name}</span><Button variant="outline" onClick={onLogout}>Sair</Button></div></div></header>
    <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">{stats.map(({key,label,status,icon:Icon,color})=><button key={key} className={`flex items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition hover:border-primary ${!filters.archived&&filters.status===status ? 'ring-1 ring-primary/40' : ''}`} onClick={()=>setFilters({...initialFilters,status})}><span className={`rounded-xl p-3 ${color}`}><Icon className="h-5 w-5" /></span><div><p className="font-poppins text-2xl font-semibold">{metrics?.[key]??'—'}</p><p className="text-xs text-muted-foreground">{label}</p></div></button>)}</div>
      {metricsError&&<p role="alert" className="text-sm text-destructive">{metricsError}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-poppins text-2xl font-semibold">{filters.archived ? 'Clientes arquivados' : 'Clientes'}</h1><p className="text-sm text-muted-foreground">Empresas, contatos comerciais e propostas em um só lugar.</p></div><div className="flex gap-2"><Button variant="outline" onClick={()=>setFilters({...initialFilters,archived:!filters.archived})}>{filters.archived ? 'Ver clientes' : 'Arquivados'}</Button><Button onClick={()=>setEditor({})}><Plus className="h-4 w-4" /> Novo cliente</Button></div></div>
      <Card className="space-y-3 p-4"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_180px_auto]"><Field label="Empresa"><Input placeholder="Razão social" value={filters.company} onChange={event=>filter('company',event.target.value)} /></Field><Field label="Nome fantasia"><Input placeholder="Nome fantasia" value={filters.tradeName} onChange={event=>filter('tradeName',event.target.value)} /></Field><Field label="Solicitante"><Input placeholder="Nome do contato" value={filters.contact} onChange={event=>filter('contact',event.target.value)} /></Field><Field label="CNPJ"><Input placeholder="CNPJ" value={filters.cnpj} onChange={event=>filter('cnpj',event.target.value)} /></Field><Field label="Status"><select className={inputClass} value={filters.status} onChange={event=>filter('status',event.target.value)}><option value="todos">Todos</option>{Object.entries(clientStatuses).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></Field><div className="flex items-end"><Button variant="outline" aria-label="Limpar filtros" title="Limpar filtros" onClick={()=>setFilters({...initialFilters,archived:filters.archived})}><FilterX className="h-4 w-4" /><span className="xl:sr-only">Limpar</span></Button></div></div><p className="text-xs text-muted-foreground">{loading ? 'Consultando clientes…' : `${data.count} cliente(s) nesta seleção.`} Os indicadores acima consideram todos os clientes não arquivados.</p></Card>
      <QueryState loading={loading} error={error} empty={!data.rows.length}><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{data.rows.map(client=><Card key={client.id} className={`flex flex-col overflow-hidden border-t-4 ${colors[client.status]}`}>
        <div className="flex items-start gap-3 border-b bg-muted/20 p-4"><span className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-bold text-primary">{client.id}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold" title={client.nome}>{client.nome}</p><p className="mt-1 truncate text-xs text-muted-foreground">{client.nome_fantasia||'Nome fantasia não informado'}</p><p className="mt-1 text-xs text-muted-foreground">{client.cnpj ? maskCnpj(client.cnpj) : 'CNPJ não informado'}</p></div></div>
        <div className="flex-1 space-y-2 p-4 text-sm"><p className="truncate" title={client.solicitante}>{client.solicitante||'Solicitante não informado'}</p><p className="truncate text-muted-foreground" title={client.email_contato}>{client.email_contato||'E-mail não informado'}</p><p className="text-muted-foreground">{client.telefone ? maskPhone(client.telefone) : 'Telefone não informado'}</p><p className="text-muted-foreground">{[client.cidade,client.estado].filter(Boolean).join(', ')||'Localidade não informada'}</p>{(!client.cnpj||!client.negocio_id)&&<p className="text-xs text-amber-700">Cadastro a completar</p>}</div>
        <div className="space-y-3 border-t p-4"><div className="flex items-center justify-between gap-2"><Badge variant={client.status==='ativo' ? 'success' : 'secondary'}>{client.excluido_em ? 'Arquivado' : clientStatuses[client.status]}</Badge><span className="text-xs text-muted-foreground">{dateOnly(client.created_at)}</span></div><div className="flex flex-wrap gap-2">
          {client.telefone&&<Button variant="outline" size="icon" asChild><a href={`https://wa.me/55${client.telefone}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp de ${client.nome}`} title="WhatsApp"><MessageCircle className="h-4 w-4 text-emerald-600" /></a></Button>}
          <Button variant="outline" size="icon" aria-label={`Propostas R&S de ${client.nome}`} title="Propostas R&S" onClick={()=>setProposals({client,type:'rs'})}><FileText className="h-4 w-4 text-primary" /></Button>
          <Button variant="outline" size="icon" aria-label={`Propostas de Riscos Psicossociais de ${client.nome}`} title="Propostas de Riscos Psicossociais" onClick={()=>setProposals({client,type:'riscos_psicossociais'})}><Shield className="h-4 w-4 text-violet-600" /></Button>
          {!client.excluido_em ? <><Button variant="outline" size="icon" aria-label={`Alterar status de ${client.nome}`} title="Alterar status" onClick={()=>{setNextStatus(client.status);setAction({client,type:'status'})}}><SlidersHorizontal className="h-4 w-4" /></Button><Button variant="outline" size="icon" aria-label={`Editar ${client.nome}`} title="Editar cliente" onClick={()=>setEditor(client)}><Pencil className="h-4 w-4" /></Button><Button variant="outline" size="icon" aria-label={`Arquivar ${client.nome}`} title="Arquivar cliente" onClick={()=>setAction({client,type:'archive'})}><Archive className="h-4 w-4 text-rose-600" /></Button></> : <Button variant="outline" size="sm" onClick={()=>setAction({client,type:'restore'})}><RotateCcw className="h-4 w-4" /> Restaurar</Button>}
        </div></div>
      </Card>)}</div></QueryState>
      <Pagination page={filters.page} total={data.count} onChange={page=>setFilters(current=>({...current,page}))} />
    </div>
    {editor&&<ClientForm key={editor.id||'new'} client={editor} onClose={()=>setEditor(null)} onSaved={()=>{setEditor(null);setFilters(initialFilters);refresh()}} />}
    {proposals&&<Proposals client={proposals.client} initialType={proposals.type} onClose={()=>setProposals(null)} />}
    <Dialog open={!!action} onOpenChange={open=>!open&&!busy&&setAction(null)}><DialogContent><DialogHeader><DialogTitle>{action?.type==='status' ? 'Alterar status do cliente' : action?.type==='restore' ? 'Restaurar cliente?' : 'Arquivar cliente?'}</DialogTitle><DialogDescription>{action?.client.nome}. {action?.type==='archive' ? 'O cliente sairá da lista principal e da seleção de novas vagas. Suas vagas e propostas serão preservadas. Você poderá restaurá-lo em Arquivados.' : action?.type==='restore' ? 'O cliente voltará à lista principal com seu status anterior.' : 'Somente clientes ativos ficam disponíveis para selecionar em novas vagas. Vagas já existentes são preservadas.'}</DialogDescription></DialogHeader>{action?.type==='status'&&<Field label="Novo status"><select className={inputClass} value={nextStatus} onChange={event=>setNextStatus(event.target.value)}>{Object.entries(clientStatuses).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></Field>}<DialogFooter><Button variant="outline" disabled={busy} onClick={()=>setAction(null)}>Voltar</Button><Button disabled={busy||action?.type==='status'&&nextStatus===action?.client.status} onClick={confirm}>{busy ? 'Salvando...' : 'Confirmar'}</Button></DialogFooter></DialogContent></Dialog>
  </main>
}
