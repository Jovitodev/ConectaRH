import { Briefcase, Users, CalendarClock, TrendingUp, ArrowUpRight, Clock3, Target, UserCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { PageHeader, StatCard, SectionHeader } from '@/components/admin-ui.jsx'
import { adminJobs, interviews, adminCandidates, candidateSourceData } from '@/data/adminData.js'

const sourceColors = {
  'Portal ConectaRH': 'bg-sky-500',
  LinkedIn: 'bg-indigo-400',
  Indicação: 'bg-emerald-500',
  Parceiros: 'bg-amber-500',
  Outros: 'bg-slate-400',
}

const upcomingInterviews = interviews
  .filter((i) => i.status === 'agendada')
  .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

export default function Dashboard({ onNavigate }) {
  const activeJobs = adminJobs.filter((j) => j.status === 'ativa')
  const totalCandidates = adminCandidates.length
  const todayInterviews = upcomingInterviews.filter((i) => i.date === '2026-08-25').length
  const totalSource = candidateSourceData.reduce((acc, s) => acc + s.value, 0)

  const conversion = 12.4
  const avgHireDays = 28

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral da operação de recrutamento e seleção."
      >
        <div className="flex items-center gap-2">
          <Badge variant="success">Operação saudável</Badge>
          <Button onClick={() => onNavigate('vacancy-create')}>
            <Briefcase className="h-4 w-4" /> Nova Vaga
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Vagas Ativas"
          value={activeJobs.length}
          description={`${activeJobs.reduce((a, j) => a + j.candidates, 0)} candidaturas no total`}
          icon={Briefcase}
          accent="text-sky-700 bg-sky-50"
        />
        <StatCard
          title="Candidatos na Base"
          value={totalCandidates}
          description="+18 novos nos últimos 7 dias"
          icon={Users}
          accent="text-indigo-700 bg-indigo-50"
        />
        <StatCard
          title="Entrevistas Hoje"
          value={todayInterviews}
          description={`${upcomingInterviews.length} agendadas nos próximos dias`}
          icon={CalendarClock}
          accent="text-emerald-700 bg-emerald-50"
        />
        <StatCard
          title="Conversão do Funil"
          value={`${conversion}%`}
          description="Candidatos aprovados até proposta"
          icon={TrendingUp}
          accent="text-amber-700 bg-amber-50"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Métricas de RH</CardTitle>
              <CardDescription>Acompanhe a saúde dos seus processos seletivos.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock3 className="h-4 w-4" />
                  <span className="text-sm">Tempo médio de contratação</span>
                </div>
                <p className="mt-2 font-poppins text-2xl font-semibold">{avgHireDays} dias</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-emerald-500">
                  <ArrowUpRight className="h-3 w-3" /> 12% melhor que o trimestre anterior
                </div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span className="text-sm">Taxa de conversão do funil</span>
                </div>
                <p className="mt-2 font-poppins text-2xl font-semibold">{conversion}%</p>
                <Progress value={conversion} className="mt-3" />
                <p className="mt-1 text-xs text-muted-foreground">Meta: 15%</p>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">Performance por etapa do funil</span>
                <span className="text-xs text-muted-foreground">média das vagas ativas</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Triagem', value: 100, count: '210 recebidos' },
                  { label: 'Teste', value: 64, count: '134 encaminhados' },
                  { label: 'Entrevista RH', value: 42, count: '88 entrevistados' },
                  { label: 'Entrevista Gestor', value: 26, count: '54 em avanço' },
                  { label: 'Proposta', value: 12, count: '26 propostas enviadas' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 text-sm text-muted-foreground">{s.label}</span>
                    <Progress value={s.value} className="h-2" />
                    <span className="w-32 shrink-0 text-right text-xs text-muted-foreground">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Origem dos Candidatos</CardTitle>
              <CardDescription>De onde vêm os talentos da base.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {candidateSourceData.map((s) => (
                <div key={s.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="font-medium">{Math.round((s.value / totalSource) * 100)}%</span>
                  </div>
                  <Progress value={(s.value / totalSource) * 100} className="h-2" indicatorClassName={s.color} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximas Entrevistas</CardTitle>
              <CardDescription>Agenda mais próxima.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingInterviews.slice(0, 4).map((i) => (
                <div key={i.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <span className="text-[10px] font-semibold uppercase leading-none">{i.date.slice(8, 10)}</span>
                    <span className="text-xs font-bold">{i.time}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.candidate}</p>
                    <p className="truncate text-xs text-muted-foreground">{i.job}</p>
                  </div>
                  <Badge variant="info">{i.type.split(' ')[1] || i.type}</Badge>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => onNavigate('agenda')}>
                Ver agenda completa
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <SectionHeader
            title="Vagas em Destaque"
            description="Processos com maior volume de candidaturas."
            action={
              <Button variant="outline" size="sm" onClick={() => onNavigate('vacancies')}>
                Ver todas
              </Button>
            }
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {activeJobs.slice(0, 4).map((job) => (
            <div key={job.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                  {job.code.replace('VAG-', '#')}
                </div>
                <div>
                  <p className="font-medium">{job.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.company} · {job.location} · {job.type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" /> {job.candidates} candidatos
                </span>
                <Badge variant="success">{job.status}</Badge>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('vacancy-edit')}>
                  Gerenciar
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
