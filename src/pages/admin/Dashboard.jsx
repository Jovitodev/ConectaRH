import { useEffect, useState } from 'react'
import { Briefcase, Users, MessageSquare, CalendarClock, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/admin-ui.jsx'
import { QueryState } from '@/components/recruitment-ui.jsx'
import { dateTime, interviewDirectory, recruitmentMetrics, todayInSaoPaulo } from '@/lib/recruitmentWorkflow.js'

export default function Dashboard({ onNavigate, onVacancies, onAgenda, onOpen }) {
  const [metrics,setMetrics]=useState(null)
  const [interviews,setInterviews]=useState([])
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(true)
  useEffect(() => {
    let active=true
    Promise.all([recruitmentMetrics(),interviewDirectory({date:todayInSaoPaulo(),status:'agendada'})]).then(([counts,agenda])=>{if(active){setMetrics(counts);setInterviews(agenda.rows)}}).catch((cause)=>{if(active)setError(cause.message)}).finally(()=>{if(active)setLoading(false)})
    return ()=>{active=false}
  },[])
  const cards=metrics ? [
    {label:'Vagas publicadas',value:metrics.active,icon:Briefcase,click:()=>onVacancies('todas','ativa')},
    {label:'Candidaturas',value:metrics.applications,icon:Users,click:()=>onNavigate('candidates')},
    {label:'Vagas sem feedback enviado',value:metrics.noFeedback,icon:MessageSquare,click:()=>onVacancies('sem_feedback','todas')},
    {label:'Entrevistas hoje',value:metrics.interviews,icon:CalendarClock,click:()=>onAgenda(todayInSaoPaulo())},
    {label:'Publicadas há mais de 80 dias',value:metrics.old,icon:Clock,click:()=>onVacancies('mais_80_dias','ativa')},
  ] : []
  return <div className="space-y-6"><PageHeader title="Painel de recrutamento" description="Acompanhe as vagas e os processos atribuídos a você."><Button onClick={()=>onNavigate('vacancy-create')}>Criar vaga</Button></PageHeader><QueryState loading={loading} error={error}><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{cards.map(({label,value,icon:Icon,click})=><button key={label} className="rounded-xl border bg-card p-5 text-left shadow-sm transition hover:border-primary focus-visible:ring-2 focus-visible:ring-ring" onClick={click}><Icon className="mb-3 h-5 w-5 text-primary" /><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-poppins text-3xl font-semibold">{value}</p><p className="mt-3 text-xs text-primary">Ver registros →</p></button>)}</div><div className="grid gap-5 lg:grid-cols-2"><Card className="space-y-4 p-5"><div className="flex items-center justify-between"><h2 className="font-poppins font-semibold">Entrevistas do dia</h2><Button size="sm" variant="ghost" onClick={()=>onAgenda(todayInSaoPaulo())}>Ver agenda</Button></div><p className="text-xs text-muted-foreground">Dia de São Paulo. Cada horário abaixo está no fuso do agendamento.</p>{interviews.length ? interviews.map((row)=><button key={row.id} onClick={()=>onOpen(row.candidaturas.vaga_id)} className="block w-full rounded-lg border p-3 text-left text-sm hover:border-primary"><strong>{row.candidaturas.nome_candidato}</strong><p>{row.candidaturas.vaga_titulo}</p><p className="text-xs text-muted-foreground">{dateTime(row.inicio,row.fuso)} · {row.fuso}</p></button>) : <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhuma entrevista agendada para hoje.</p>}</Card><Card className="space-y-4 p-5"><h2 className="font-poppins font-semibold">Acompanhamento de feedback</h2><p className="text-sm text-muted-foreground">Anotações internas e mensagens pendentes não comprovam envio ao candidato. A integração de e-mail ainda precisa ser configurada.</p><Button variant="outline" onClick={()=>onVacancies('sem_feedback','todas')}>Ver vagas com pendências</Button><h3 className="pt-2 text-sm font-semibold">Processos antigos</h3><p className="text-sm text-muted-foreground">Revise as vagas publicadas há mais de 80 dias com base na data original.</p><Button variant="outline" onClick={()=>onVacancies('mais_80_dias','ativa')}>Ver vagas antigas</Button></Card></div></QueryState></div>
}
