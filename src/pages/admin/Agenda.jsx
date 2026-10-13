import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/admin-ui.jsx'
import { Field, inputClass, Pagination, QueryState } from '@/components/recruitment-ui.jsx'
import { changeInterviewStatus, dateTime, interviewDirectory } from '@/lib/recruitmentWorkflow.js'

export default function Agenda({ initialDate='', onOpen }) {
  const [date,setDate]=useState(initialDate)
  const [status,setStatus]=useState(initialDate ? 'agendada' : 'todas')
  const [page,setPage]=useState(0)
  const [data,setData]=useState({rows:[],count:0})
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  const [revision,setRevision]=useState(0)
  const [confirmation,setConfirmation]=useState(null)
  useEffect(() => {
    let active=true;setLoading(true);setError('')
    interviewDirectory({date,status,page}).then((result) => {if(active)setData(result)}).catch((cause) => {if(active)setError(cause.message)}).finally(() => {if(active)setLoading(false)})
    return () => {active=false}
  },[date,status,page,revision])
  const change = async () => {
    setBusy(true)
    try {await changeInterviewStatus(confirmation.id,confirmation.status);setRevision((value)=>value+1);setConfirmation(null);toast.success('Entrevista atualizada.')} catch(cause){toast.error(cause.message)} finally{setBusy(false)}
  }
  return <div className="space-y-5"><PageHeader title="Agenda de entrevistas" description="Agendamentos das suas vagas. Para agendar, abra a ficha de uma candidatura." /><Card className="grid gap-3 p-4 sm:grid-cols-3"><Field label="Data (horário de São Paulo)"><Input type="date" value={date} onChange={(event) => {setDate(event.target.value);setPage(0)}} /></Field><Field label="Status"><select className={inputClass} value={status} onChange={(event) => {setStatus(event.target.value);setPage(0)}}><option value="todas">Todas</option><option value="agendada">Agendada</option><option value="concluida">Concluída</option><option value="cancelada">Cancelada</option></select></Field><div className="flex items-end"><Button variant="outline" onClick={() => {setDate('');setStatus('todas');setPage(0)}}>Limpar filtros</Button></div></Card>
    {confirmation && <Card role="alertdialog" aria-label="Confirmar atualização de entrevista" className="space-y-3 border-primary p-4"><p className="text-sm">Confirmar entrevista como {confirmation.status==='cancelada' ? 'cancelada' : 'concluída'}? Nenhuma mensagem será enviada.</p><div className="flex gap-2"><Button disabled={busy} onClick={change}>Confirmar</Button><Button disabled={busy} variant="outline" onClick={()=>setConfirmation(null)}>Voltar</Button></div></Card>}
    <QueryState loading={loading} error={error} empty={!data.rows.length}><div className="space-y-3">{data.rows.map((row) => <Card key={row.id} className="flex flex-col justify-between gap-4 p-5 sm:flex-row"><div className="space-y-1 text-sm"><h2 className="font-semibold">{row.candidaturas.nome_candidato}</h2><p>{row.candidaturas.vaga_titulo}</p><p>{dateTime(row.inicio,row.fuso)} · {row.fuso} · {row.duracao_minutos} min</p><p>{row.entrevistador} · {row.modalidade} · {row.status}</p><p className="break-all text-muted-foreground">{row.local_ou_link}</p><p className="whitespace-pre-wrap">{row.observacoes}</p></div><div className="flex flex-wrap items-start gap-2"><Button size="sm" variant="outline" onClick={() => onOpen(row.candidaturas.vaga_id)}>Ver candidaturas</Button>{row.status==='agendada' && <><Button size="sm" variant="outline" disabled={busy} onClick={() => setConfirmation({id:row.id,status:'concluida'})}>Concluir</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => setConfirmation({id:row.id,status:'cancelada'})}>Cancelar</Button></>}</div></Card>)}</div></QueryState><Pagination page={page} total={data.count} onChange={setPage} />
  </div>
}
