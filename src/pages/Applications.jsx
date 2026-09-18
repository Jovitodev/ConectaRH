import { useMemo, useState } from 'react'
import { Briefcase, Building2, MapPin, CalendarDays, FileCheck2, ChevronLeft, ArrowRight, CircleDollarSign, History } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DataTable } from '@/components/ui/data-table'
import DynamicPipelineBar from '@/components/DynamicPipelineBar.jsx'
import ActiveProcess from './ActiveProcess.jsx'
import { sectors } from '@/data/mockData.js'

const sectorBadgeVariant = {
  saude: 'info',
  financas: 'finance',
  comercial: 'sales',
  marketing: 'warning',
  logistica: 'success',
}

export default function Applications({ applications, jobs, jobStepsList, updateApp, setStep }) {
  const [managingId, setManagingId] = useState(null)

  const getJob = (jobId) => jobs.find((j) => j.id === jobId)
  const enriched = applications.map((app) => ({ ...app, job: getJob(app.jobId) })).filter((a) => a.job)

  const metrics = useMemo(
    () => [
      { label: 'Candidaturas ativas', value: enriched.length, icon: Briefcase },
      { label: 'Em análise', value: enriched.filter((a) => a.status === 'Em andamento').length, icon: FileCheck2 },
      { label: 'Entrevistas', value: enriched.reduce((s, a) => s + (a.interviews?.length ?? 0), 0), icon: CalendarDays },
      { label: 'Salário médio', value: 'R$ 9k', icon: CircleDollarSign },
    ],
    [enriched],
  )

  const columns = useMemo(
    () => [
      {
        accessorKey: 'job',
        header: 'Vaga',
        cell: ({ row }) => {
          const { job } = row.original
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary/15 text-xs font-bold text-primary">
                  {job.company.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-poppins text-sm font-semibold">{job.title}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" /> {job.company} · {job.location}
                </p>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'job.sector',
        header: 'Setor',
        cell: ({ row }) => (
          <Badge variant={sectorBadgeVariant[row.original.job.sector]}>
            {sectors.find((s) => s.id === row.original.job.sector)?.label}
          </Badge>
        ),
      },
      {
        accessorKey: 'progress',
        header: 'Progresso',
        cell: ({ row }) => {
          const app = row.original
          return (
            <div className="min-w-[180px]">
              <DynamicPipelineBar totalSteps={app.job.pipeline.totalSteps} currentStep={app.currentStep} steps={jobStepsList(app.jobId)} />
            </div>
          )
        },
      },
      {
        accessorKey: 'pending',
        header: 'Tarefas',
        cell: ({ row }) => {
          const pending = row.original.tasks?.filter((t) => t.status === 'pending').length ?? 0
          return pending > 0 ? <Badge variant="warning">{pending} pendente(s)</Badge> : <Badge variant="success">Em dia</Badge>
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant="info">
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button size="sm" onClick={() => setManagingId(row.original.id)}>
            Gerenciar <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [jobStepsList],
  )

  if (managingId) {
    const app = applications.find((a) => a.id === managingId)
    const job = getJob(app?.jobId)
    if (app && job) {
      return (
        <div className="w-full">
          <Button variant="ghost" size="sm" onClick={() => setManagingId(null)} className="mb-4">
            <ChevronLeft className="h-4 w-4" /> Voltar às minhas candidaturas
          </Button>
          <ActiveProcess
            applications={applications}
            jobs={jobs}
            activeAppId={managingId}
            setActiveAppId={setManagingId}
            updateApp={updateApp}
            setStep={setStep}
          />
          <Card className="mt-6">
            <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Histórico da candidatura</CardTitle><p className="text-sm text-muted-foreground">Registro das principais movimentações deste processo.</p></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(app.history || []).slice().reverse().map((item) => <div key={item.id} className="relative pl-6"><span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-primary" /><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleString('pt-BR')} · {item.description}</p></div>)}
                {!app.history?.length && <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Métricas-chave */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <Card key={m.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
                <Icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="font-poppins text-2xl font-bold">{m.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Minhas Candidaturas</CardTitle>
          <p className="text-sm text-muted-foreground">
            Acompanhe o progresso por etapas de cada processo seletivo.
          </p>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={enriched}
            emptyMessage="Você ainda não se candidatou a nenhuma vaga."
          />
        </CardContent>
      </Card>
    </div>
  )
}
