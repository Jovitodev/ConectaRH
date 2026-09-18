import { useState } from 'react'
import { Download, TrendingUp, TrendingDown, Clock3, Users, Briefcase, Target } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { PageHeader, StatCard } from '@/components/admin-ui.jsx'
import { adminJobs, candidateSourceData, adminCandidates, interviews } from '@/data/adminData.js'

const funnel = [
  { stage: 'Candidaturas recebidas', count: 908, rate: 100, bar: 'bg-slate-400' },
  { stage: 'Triagem aprovada', count: 581, rate: 64, bar: 'bg-sky-500' },
  { stage: 'Testes enviados', count: 381, rate: 42, bar: 'bg-indigo-400' },
  { stage: 'Entrevistas realizadas', count: 236, rate: 26, bar: 'bg-amber-500' },
  { stage: 'Propostas enviadas', count: 109, rate: 12, bar: 'bg-emerald-500' },
  { stage: 'Contratações', count: 47, rate: 5.2, bar: 'bg-emerald-600' },
]

const monthlyHires = [12, 18, 15, 24, 21, 30, 28, 35, 26, 40, 38, 47]

export default function Reports() {
  const [period, setPeriod] = useState('6m')

  const exportReport = () => {
    toast.success('Relatório exportado', { description: 'O arquivo Excel será gerado em instantes.' })
  }

  const kpis = [
    { label: 'Tempo médio de contratação', value: '28 dias', delta: -12, note: 'vs trimestre anterior', icon: Clock3, color: 'text-sky-700 bg-sky-50' },
    { label: 'Taxa de conversão do funil', value: '5,2%', delta: 0.8, note: 'vs mês anterior', icon: Target, color: 'text-emerald-700 bg-emerald-50' },
    { label: 'Vagas ativas', value: `${adminJobs.filter((j) => j.status === 'ativa').length}`, delta: 2, note: 'vs mês anterior', icon: Briefcase, color: 'text-indigo-700 bg-indigo-50' },
    { label: 'Candidatos na base', value: `${adminCandidates.length}`, delta: 18, note: 'novos nos últimos 30 dias', icon: Users, color: 'text-amber-700 bg-amber-50' },
  ]

  const maxHire = Math.max(...monthlyHires)
  const totalSource = candidateSourceData.reduce((a, s) => a + s.value, 0)
  const concluded = interviews.filter((i) => i.status === 'concluida').length
  const canceled = interviews.filter((i) => i.status === 'cancelada').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel de Relatórios Gerais"
        description="Métricas analíticas da operação de RH."
      >
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Período" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">Último mês</SelectItem>
            <SelectItem value="3m">Últimos 3 meses</SelectItem>
            <SelectItem value="6m">Últimos 6 meses</SelectItem>
            <SelectItem value="1y">Último ano</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportReport}>
          <Download className="h-4 w-4" /> Exportar
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <StatCard
            key={k.label}
            title={k.label}
            value={k.value}
            description={k.note}
            icon={k.icon}
            accent={k.color}
            footer={
              <span className={`mt-1 flex items-center gap-1 text-xs ${k.delta >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                {k.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {k.delta >= 0 ? '+' : ''}{k.delta}%
              </span>
            }
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Funil de Recrutamento</CardTitle>
            <CardDescription>Conversão em cada etapa dos processos seletivos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {funnel.map((f) => (
              <div key={f.stage}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{f.stage}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{f.count.toLocaleString('pt-BR')}</span>
                    <Badge variant="secondary">{f.rate}%</Badge>
                  </span>
                </div>
                <Progress value={f.rate} className="h-2.5" indicatorClassName={f.bar} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contratações por Mês</CardTitle>
            <CardDescription>Volume de contratações mensais no período.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-end gap-2">
              {monthlyHires.map((h, i) => (
                <div key={i} className="group flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">{h}</span>
                  <div
                    className="w-full rounded-t-md bg-primary/80 transition-colors group-hover:bg-primary"
                    style={{ height: `${(h / maxHire) * 100}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">M{i + 1}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Origem dos Candidatos</CardTitle>
            <CardDescription>Fontes de aquisição da base.</CardDescription>
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
            <CardTitle>Entrevistas</CardTitle>
            <CardDescription>Desempenho da agenda no período.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Concluídas', value: concluded, bar: 'bg-emerald-500', pct: (concluded / interviews.length) * 100 },
              { label: 'Canceladas', value: canceled, bar: 'bg-destructive', pct: (canceled / interviews.length) * 100 },
              { label: 'Agendadas', value: interviews.filter((i) => i.status === 'agendada').length, bar: 'bg-sky-500', pct: (interviews.filter((i) => i.status === 'agendada').length / interviews.length) * 100 },
            ].map((e) => (
              <div key={e.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{e.label}</span>
                  <span className="font-medium">{e.value}</span>
                </div>
                <Progress value={e.pct} className="h-2" indicatorClassName={e.bar} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Desempenho por Vaga</CardTitle>
            <CardDescription>Ranking das vagas por candidatos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {adminJobs
              .filter((j) => j.status === 'ativa')
              .sort((a, b) => b.candidates - a.candidates)
              .slice(0, 5)
              .map((j, i) => (
                <div key={j.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{j.title}</p>
                    <p className="text-xs text-muted-foreground">{j.code}</p>
                  </div>
                  <Badge variant="secondary">{j.candidates} candidatos</Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
