import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Search, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { inputClass, Pagination, QueryState } from '@/components/recruitment-ui.jsx'
import { dateOnly, vacancyDirectory, vacancyStatuses } from '@/lib/recruitmentWorkflow.js'
import { duplicateOwnedVacancy, updateVacancyStatus } from '@/lib/recruitmentStore.js'

export default function RealVacancies({ onEdit, onOpen, initialFilter = 'todas', initialStatus = 'todas' }) {
  const [options, setOptions] = useState({page:0,search:'',filter:initialFilter,status:initialStatus,order:'recentes'})
  const [data, setData] = useState({rows:[],count:0})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [action, setAction] = useState(null)
  const [busy, setBusy] = useState(false)
  const [revision, setRevision] = useState(0)
  const filter = (key,value) => setOptions((current) => ({...current,[key]:value,page:0}))
  useEffect(() => {setOptions((current) => ({...current,page:0,filter:initialFilter,status:initialStatus}))},[initialFilter,initialStatus])
  useEffect(() => {
    let active=true;setLoading(true);setError('')
    const timer=setTimeout(() => vacancyDirectory(options).then((result) => {if(active)setData(result)}).catch((cause) => {if(active)setError(cause.message)}).finally(() => {if(active)setLoading(false)}),250)
    return () => {active=false;clearTimeout(timer)}
  },[options,revision])
  const confirm = async () => {
    setBusy(true)
    try {
      if(action.type==='duplicate') await duplicateOwnedVacancy(action.vacancy.id)
      else await updateVacancyStatus(action.vacancy.id,action.type)
      setAction(null);setRevision((current) => current+1);toast.success('Alteração salva no Supabase.')
    } catch(cause) {toast.error(cause.message)} finally {setBusy(false)}
  }
  return <section className="space-y-4">
    <Card className="space-y-3 p-4"><div className="flex flex-col gap-3 xl:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" aria-label="Buscar vagas" placeholder="Buscar vaga por título ou código" value={options.search} onChange={(event) => filter('search',event.target.value)} /></div><div className="grid gap-2 sm:grid-cols-3 xl:w-[590px]"><select className={inputClass} aria-label="Status da vaga" value={options.status} onChange={(event) => filter('status',event.target.value)}><option value="todas">Todos os status</option>{Object.entries(vacancyStatuses).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><select className={inputClass} aria-label="Filtro de vagas" value={options.filter} onChange={(event) => filter('filter',event.target.value)}><option value="todas">Todas as vagas</option><option value="sem_feedback">Sem feedback enviado</option><option value="mais_80_dias">Mais de 80 dias</option></select><select className={inputClass} aria-label="Ordenar vagas" value={options.order} onChange={(event) => filter('order',event.target.value)}><option value="recentes">Publicação mais recente</option><option value="antigas">Publicação mais antiga</option><option value="titulo">Título A–Z</option></select></div></div><p className="text-xs text-muted-foreground">{data.count} vaga(s) atribuída(s) a você nesta seleção. Busca e filtros consultam todas as páginas.</p></Card>
    <QueryState loading={loading} error={error} empty={!data.rows.length}><Card className="overflow-x-auto"><table className="w-full min-w-[960px] text-left text-sm"><thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="p-4">Vaga e empresa</th><th className="p-4">Candidaturas</th><th className="p-4">Sem feedback enviado</th><th className="p-4">Informações</th><th className="p-4">Status</th><th className="p-4"><span className="sr-only">Ações</span></th></tr></thead><tbody className="divide-y">{data.rows.map((vacancy) => <tr key={vacancy.id} className="hover:bg-muted/20"><td className="p-4"><button className="text-left font-semibold hover:text-primary" onClick={() => onOpen(vacancy.id)}>{vacancy.titulo}</button><p className="mt-1 text-xs text-muted-foreground">{vacancy.codigo} · {vacancy.empresa_nome}</p><p className="text-xs text-muted-foreground">Responsável: você · {vacancy.localidade_texto}</p></td><td className="p-4"><Button size="sm" variant="ghost" onClick={() => onOpen(vacancy.id)}>{vacancy.candidaturas_total}</Button></td><td className="p-4">{vacancy.sem_feedback_enviado}</td><td className="space-y-1 p-4 text-xs text-muted-foreground"><p>Publicação: {dateOnly(vacancy.publicada_em)}</p><p>Inscrições: {dateOnly(vacancy.inscricoes_inicio)} a {dateOnly(vacancy.inscricoes_fim)}</p><p>{vacancy.modalidade} · {vacancy.contrato}</p></td><td className="p-4"><Badge variant={vacancy.status==='ativa' ? 'success' : 'secondary'}>{vacancyStatuses[vacancy.status]}</Badge></td><td className="p-4"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Ações de ${vacancy.codigo}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => onOpen(vacancy.id)}>Ver candidaturas</DropdownMenuItem><DropdownMenuItem onSelect={() => onEdit(vacancy.id)}>Editar vaga</DropdownMenuItem><DropdownMenuItem onSelect={() => setAction({vacancy,type:'duplicate'})}>Duplicar como rascunho</DropdownMenuItem>{vacancy.status==='ativa' ? <DropdownMenuItem onSelect={() => setAction({vacancy,type:'pausada'})}>Pausar publicação</DropdownMenuItem> : <DropdownMenuItem onSelect={() => setAction({vacancy,type:'ativa'})}>Publicar / reativar</DropdownMenuItem>}{vacancy.status!=='cancelada' && <DropdownMenuItem onSelect={() => setAction({vacancy,type:'cancelada'})}>Cancelar vaga</DropdownMenuItem>}{vacancy.status!=='encerrada' && <DropdownMenuItem onSelect={() => setAction({vacancy,type:'encerrada'})}>Encerrar vaga</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu></td></tr>)}</tbody></table></Card></QueryState>
    <Pagination page={options.page} total={data.count} onChange={(page) => setOptions((current) => ({...current,page}))} />
    <p className="text-xs text-muted-foreground">“Sem feedback enviado” considera candidaturas sem registro de envio. Anotações e mensagens pendentes não contam como envio.</p>
    <Dialog open={!!action} onOpenChange={(open) => !open && !busy && setAction(null)}><DialogContent><DialogHeader><DialogTitle>{action?.type==='duplicate' ? 'Duplicar como rascunho?' : action?.type==='cancelada' ? 'Cancelar vaga?' : action?.type==='encerrada' ? 'Encerrar vaga?' : action?.type==='pausada' ? 'Pausar publicação?' : 'Publicar ou reativar vaga?'}</DialogTitle><DialogDescription>{action?.vacancy.titulo}. {action?.type==='duplicate' ? 'Cria uma nova vaga com os mesmos campos e etapas, sem candidaturas e sem data de publicação. Revise os prazos antes de publicar.' : action?.type==='encerrada' || action?.type==='pausada' || action?.type==='cancelada' ? 'A vaga deixa da busca pública. As candidaturas e seu histórico são preservados. Nenhuma mensagem será enviada.' : 'Vagas com visibilidade pública aparecerão na busca. A publicação original será preservada. O período de inscrição continua valendo.'}</DialogDescription></DialogHeader><DialogFooter><Button disabled={busy} variant="outline" onClick={() => setAction(null)}>Voltar</Button><Button disabled={busy} onClick={confirm}>{busy ? 'Salvando...' : 'Confirmar'}</Button></DialogFooter></DialogContent></Dialog>
  </section>
}
