import { useEffect, useState } from 'react'
import { ArrowLeft, Search, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/admin-ui.jsx'
import { inputClass, Pagination, QueryState } from '@/components/recruitment-ui.jsx'
import { loadOwnedVacancy } from '@/lib/recruitmentStore.js'
import { applicationById, applicationDirectory, dateOnly, dateTime, statuses, vacancyStages, vacancyStatuses } from '@/lib/recruitmentWorkflow.js'
import { loadOperation } from '@/lib/vacancyOperations.js'
import ApplicationPanel from './ApplicationPanel.jsx'

export default function VacancyApplications({ vacancyId, onBack, kanban = false }) {
  const [cv,setCv]=useState('')
  const [reason,setReason]=useState('')
  const [vacancy, setVacancy] = useState(null)
  const [stages, setStages] = useState([])
  const [stage, setStage] = useState('todas')
  const [status, setStatus] = useState('todos')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState({ rows: [], count: 0 })
  const [selected, setSelected] = useState(null)
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stageError, setStageError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([loadOwnedVacancy(vacancyId),loadOperation(vacancyId)]).then(([row,operation]) => { if (active) {setVacancy(row);setCv(operation?.cv||'')} }).catch((cause) => { if (active) {setError(cause.message);setLoading(false)} })
    return () => { active = false }
  }, [vacancyId])
  useEffect(() => {
    let active = true; setStageError('')
    vacancyStages(vacancyId).then((rows) => { if(active) setStages(rows) }).catch((cause) => { if(active) setStageError(cause.message) })
    return () => { active = false }
  }, [vacancyId, revision])
  useEffect(() => {
    let active = true; setLoading(true); setError('')
    const timer = setTimeout(() => applicationDirectory(vacancyId,{page,search,stage,status,reason}).then((result) => { if(active) setData(result) }).catch((cause) => { if(active) setError(cause.message) }).finally(() => { if(active) setLoading(false) }),250)
    return () => { active=false;clearTimeout(timer) }
  }, [vacancyId,page,search,stage,status,reason,revision])
  const reload = async () => {
    if (selected) {
      // Relê a candidatura independentemente do filtro/página para preservar a ficha após mover ou reprovar.
      setSelected(await applicationById(selected.id,vacancyId))
    }
    setRevision((value) => value + 1)
  }
  const stageNames = [...new Set(['Triagem curricular',...(vacancy?.etapas_iniciais || []),...stages.map((row) => row.etapa_atual)])]
  const stageCount = (name) => stages.filter((row) => (name === 'todas' || row.etapa_atual === name) && (status === 'todos' || row.status === status)).reduce((sum,row) => sum + row.total,0)
  const setFilter = (setter,value) => {setPage(0);setter(value)}
  return <div className="space-y-5">
    <PageHeader title={vacancy?.titulo || 'Candidaturas da vaga'} description={vacancy ? `${vacancy.codigo} · ${vacancy.empresas?.nome || ''}` : 'Carregando vaga...'}><Button variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Voltar às vagas</Button></PageHeader>
    {vacancy && <Card className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-xs text-muted-foreground"><Badge variant="secondary">{vacancyStatuses[vacancy.status]}</Badge><span>Publicada em {dateOnly(vacancy.publicada_em)}</span><span>Inscrições: {dateOnly(vacancy.inscricoes_inicio)} a {dateOnly(vacancy.inscricoes_fim)}</span><span>{vacancy.localidade_texto} · {vacancy.modalidade}</span></Card>}
    <Card className="space-y-4 p-4"><div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Buscar candidaturas" placeholder="Buscar por nome ou e-mail" className="pl-9" value={search} onChange={(event) => setFilter(setSearch,event.target.value)} /></div><Input aria-label="Filtrar motivo interno" placeholder="Filtrar motivo interno" value={reason} onChange={event=>setFilter(setReason,event.target.value)}/><select aria-label="Status da candidatura" className={`${inputClass} sm:w-52`} value={status} onChange={(event) => setFilter(setStatus,event.target.value)}><option value="todos">Todos os status</option>{Object.entries(statuses).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <div className="flex gap-2 overflow-x-auto pb-2" aria-label="Etapas da vaga">{['todas',...stageNames].map((name) => <Button key={name} size="sm" variant={stage === name ? 'default' : 'outline'} className="h-auto min-w-32 shrink-0 flex-col items-start gap-2 p-3" onClick={() => setFilter(setStage,name)}>{name === 'todas' ? 'Todas' : name}{!stageError ? ` (${stageCount(name)})` : ''}</Button>)}</div>
      <p className="text-xs text-muted-foreground">{data.count} candidatura(s) nesta busca. Contagens das etapas consideram o status selecionado e toda a vaga.</p>
      {stageError && <p role="alert" className="text-xs text-destructive">{stageError}</p>}
    </Card>
    <QueryState loading={loading} error={error} empty={!data.rows.length}>
      {kanban ? <div className="flex gap-4 overflow-x-auto pb-4">{(stage === 'todas' ? stageNames : [stage]).map((name) => <section key={name} className="w-72 shrink-0 rounded-xl border bg-muted/20 p-3"><h2 className="mb-3 text-sm font-semibold">{name}</h2><div className="space-y-3">{data.rows.filter((row) => row.etapa_atual===name).map((app) => <button key={app.id} onClick={() => setSelected(app)} className="w-full space-y-2 rounded-lg border bg-card p-4 text-left shadow-sm hover:border-primary"><p className="text-sm font-semibold">{app.nome_candidato}</p><Badge variant="secondary">{statuses[app.status]}</Badge><p className="text-xs text-muted-foreground">{app.cidade_candidato}</p></button>)}</div></section>)}</div> : <Card className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="p-4">CV</th><th className="p-4">Candidatura</th><th className="p-4">Etapa</th><th className="p-4">Status</th><th className="p-4">Motivo</th><th className="p-4">Recebida em</th><th className="p-4"><span className="sr-only">Ações</span></th></tr></thead><tbody className="divide-y">{data.rows.map((app) => <tr key={app.id} className="hover:bg-muted/20"><td className="p-4 text-xs">{cv||vacancy?.codigo}</td><td className="p-4"><button className="text-left font-semibold hover:text-primary" onClick={() => setSelected(app)}>{app.nome_candidato}</button><p className="text-xs text-muted-foreground">{app.escolaridade || 'Escolaridade não informada'} · {[app.cidade_candidato,app.estado_candidato].filter(Boolean).join(', ')}</p></td><td className="p-4">{app.etapa_atual}</td><td className="p-4"><Badge variant="secondary">{statuses[app.status]}</Badge></td><td className="max-w-xs whitespace-pre-wrap break-words p-4 text-xs">{app.motivo_interno || 'Não informado'}</td><td className="p-4 text-xs">{dateTime(app.aplicada_em)}</td><td className="p-4"><Button size="sm" variant="outline" onClick={() => setSelected(app)}><UserRound className="h-4 w-4" /> Ficha</Button></td></tr>)}</tbody></table></Card>}
    </QueryState>
    {kanban && <p className="text-xs text-muted-foreground">O quadro mostra a página carregada. Use as abas para consultar uma etapa inteira com paginação. Abra uma ficha para movimentar a candidatura.</p>}
    <Pagination page={page} total={data.count} onChange={setPage} />
    {vacancy && <ApplicationPanel app={selected} vacancy={vacancy} items={data.rows} onClose={() => setSelected(null)} onSelect={setSelected} onChanged={reload} />}
  </div>
}
