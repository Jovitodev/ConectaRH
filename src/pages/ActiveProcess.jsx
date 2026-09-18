import { useState, useRef } from 'react'
import { toast } from 'sonner'
import {
  CalendarClock,
  CalendarCheck2,
  Video,
  Clock3,
  ClipboardList,
  FileText,
  UploadCloud,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Building2,
  MapPin,
  Banknote,
  MessageSquareText,
  Send,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import DynamicPipelineBar from '@/components/DynamicPipelineBar.jsx'
import { sectors } from '@/data/mockData.js'

const docStatusMap = {
  sent: { label: 'Enviado', variant: 'success', icon: CheckCircle2 },
  review: { label: 'Em Análise', variant: 'info', icon: Loader2 },
  pending: { label: 'Pendente', variant: 'warning', icon: AlertTriangle },
}

const interviewStatusMap = {
  confirmed: { label: 'Presença Confirmada', variant: 'success' },
  suggested: { label: 'Horário Sugerido', variant: 'info' },
  pending: { label: 'Aguardando Confirmação', variant: 'warning' },
}

const sectorBadgeVariant = {
  saude: 'info',
  financas: 'finance',
  comercial: 'sales',
  marketing: 'warning',
  logistica: 'success',
}

const requiredDocs = [
  { label: 'Certificados' },
  { label: 'Registro CRM / COREN / OAB' },
  { label: 'Comprovante de Residência' },
]

export default function ActiveProcess({ applications, jobs, activeAppId, setActiveAppId, updateApp, setStep }) {
  const app = applications.find((a) => a.id === activeAppId) || applications[0]
  const job = app ? jobs.find((j) => j.id === app.jobId) : null

  const [taskModal, setTaskModal] = useState(null)
  const [taskAnswers, setTaskAnswers] = useState({})
  const [salaryExpectation, setSalaryExpectation] = useState('')
  const fileInputRef = useRef(null)

  if (!app || !job) {
    return (
      <Card className="p-12 text-center">
        <p className="text-sm text-muted-foreground">Nenhum processo ativo no momento.</p>
      </Card>
    )
  }

  const steps = job.pipeline.steps
  const currentStepName = steps[app.currentStep] || ''

  const update = (updater) => updateApp(app.id, updater)

  const confirmPresence = (intId) => {
    update((a) => ({ ...a, interviews: a.interviews.map((i) => (i.id === intId ? { ...i, status: 'confirmed' } : i)) }))
    toast.success('Presença confirmada!', { description: 'Acesse a sala virtual no horário marcado.' })
  }

  const acceptSuggested = (intId) => {
    update((a) => ({ ...a, interviews: a.interviews.map((i) => (i.id === intId ? { ...i, status: 'confirmed' } : i)) }))
    toast.success('Horário aceito!', { description: 'O horário sugerido foi adicionado à sua agenda.' })
  }

  const requestReschedule = (intId) => {
    update((a) => ({ ...a, interviews: a.interviews.map((i) => (i.id === intId ? { ...i, status: 'pending' } : i)) }))
    toast.info('Reagendamento solicitado', { description: 'O recrutador proporá novos horários.' })
  }

  const submitTask = (task) => {
    update((a) => {
      const tasks = a.tasks.map((t) => (t.id === task.id ? { ...t, status: 'done' } : t))
      const extra = task.type === 'salary' ? { ...a, salaryExpectation } : {}
      return { ...a, ...extra, tasks }
    })
    setTaskModal(null)
    setTaskAnswers({})
    toast.success('Tarefa enviada!', { description: `"${task.title}" está em análise pela equipe.` })
    if (task.type !== 'salary') setStep(app.id, app.currentStep + 1)
  }

  const handleFiles = (files) => {
    files.forEach((f) => {
      const id = `up-${Date.now()}-${f.name}`
      update((a) => ({
        ...a,
        documents: [{ id, name: f.name, type: f.type.split('/')[1]?.toUpperCase() || 'Arquivo', status: 'review' }, ...a.documents],
      }))
      setTimeout(() => {
        update((a) => ({
          ...a,
          documents: a.documents.map((d) => (d.id === id ? { ...d, status: 'sent' } : d)),
        }))
      }, 1500)
    })
    toast.success('Arquivos enviados', { description: `${files.length} arquivo(s) adicionado(s) para validação.` })
  }

  return (
    <div className="w-full space-y-6">
      {/* Seletor + cabeçalho */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={app.id} onValueChange={setActiveAppId}>
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="Selecionar processo" />
          </SelectTrigger>
          <SelectContent>
            {applications.map((a) => {
              const j = jobs.find((x) => x.id === a.jobId)
              return j ? (
                <SelectItem key={a.id} value={a.id}>{j.title} — {j.company}</SelectItem>
              ) : null
            })}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant={sectorBadgeVariant[job.sector]}>{sectors.find((s) => s.id === job.sector)?.label}</Badge>
          <Badge variant="secondary">{job.model}</Badge>
        </div>
      </div>

      {/* Cabeçalho + pipeline */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-poppins text-xl font-semibold">{job.title}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" /> {job.company}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {job.location}
                </span>
                <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                  <Banknote className="h-4 w-4" /> {job.salary}
                </span>
              </div>
            </div>
            <div className="rounded-lg border bg-muted/50 px-3 py-2 text-right">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Etapa atual</p>
              <p className="text-sm font-semibold text-primary">{currentStepName}</p>
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <DynamicPipelineBar totalSteps={job.pipeline.totalSteps} currentStep={app.currentStep} steps={steps} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="w-full flex-wrap justify-start">
          <TabsTrigger value="schedule">Cronograma & Regras</TabsTrigger>
          <TabsTrigger value="interviews">Entrevistas ({app.interviews.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas ({app.tasks.filter((t) => t.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>

        {/* Cronograma & Regras */}
        <TabsContent value="schedule">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="h-4 w-4 text-primary" /> Regras da etapa atual
                </CardTitle>
                <CardDescription>{currentStepName}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  'Resposta única por questão; não é possível refazer após o envio.',
                  'Candidaturas incompletas podem ser desclassificadas.',
                  'Documentação deve estar válida e legível.',
                ].map((r, i) => (
                  <p key={i} className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /> {r}
                  </p>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock3 className="h-4 w-4 text-emerald-500" /> Prazos de feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Feedback do RH</span>
                  <Badge variant="success">até 5 dias úteis</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Resposta a solicitações</span>
                  <Badge variant="info">até 48h</Badge>
                </div>
                <Separator />
                <p className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> Prazos variam conforme a etapa e o setor da vaga.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Entrevistas */}
        <TabsContent value="interviews">
          {app.interviews.length === 0 ? (
            <Card className="p-10 text-center text-sm text-muted-foreground">Nenhuma entrevista agendada para esta vaga.</Card>
          ) : (
            <div className="space-y-4">
              {app.interviews.map((int) => {
                const st = interviewStatusMap[int.status] || interviewStatusMap.pending
                return (
                  <Card key={int.id}>
                    <CardContent className="space-y-3 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-poppins text-sm font-semibold">{int.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {int.date} às {int.time} · {int.duration} · com {int.host}
                          </p>
                        </div>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </div>

                      {int.status === 'confirmed' ? (
                        <a
                          href={int.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                          <Video className="h-4 w-4" /> Acessar Sala Virtual
                        </a>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <Button variant="success" size="sm" onClick={() => confirmPresence(int.id)}>
                            <CalendarCheck2 className="h-4 w-4" /> Confirmar Presença
                          </Button>
                          {int.status === 'suggested' && (
                            <Button size="sm" variant="default" onClick={() => acceptSuggested(int.id)}>
                              <Sparkles className="h-4 w-4" /> Aceitar Horário
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => requestReschedule(int.id)}>
                            <CalendarClock className="h-4 w-4" /> Solicitar Reagendamento
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Tarefas */}
        <TabsContent value="tasks">
          {app.tasks.length === 0 ? (
            <Card className="p-10 text-center text-sm text-muted-foreground">Nenhuma tarefa pendente. Boa sorte!</Card>
          ) : (
            <div className="space-y-4">
              {app.tasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        {task.type === 'questionnaire' ? (
                          <MessageSquareText className="h-4 w-4 text-primary" />
                        ) : task.type === 'practical' ? (
                          <ClipboardList className="h-4 w-4 text-primary" />
                        ) : (
                          <FileText className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-poppins text-sm font-semibold">{task.title}</p>
                        <p className="text-xs text-muted-foreground">Prazo: {task.deadline}</p>
                      </div>
                    </div>
                    {task.status === 'done' ? (
                      <Badge variant="success">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Enviado
                      </Badge>
                    ) : (
                      <Button size="sm" onClick={() => setTaskModal(task)}>
                        <Send className="h-3.5 w-3.5" /> Responder
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Documentação */}
        <TabsContent value="documents">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UploadCloud className="h-4 w-4 text-primary" /> Enviar documentos
                </CardTitle>
                <CardDescription>Certificados, registros profissionais e comprovantes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    handleFiles(Array.from(e.dataTransfer.files))
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary/60 hover:bg-muted/50"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      handleFiles(Array.from(e.target.files))
                      e.target.value = ''
                    }}
                  />
                  <UploadCloud className="mx-auto h-8 w-8 text-primary" />
                  <p className="mt-2 text-sm font-medium">Arraste arquivos ou clique para enviar</p>
                  <p className="mt-1 text-xs text-muted-foreground">PDF, PNG, JPG — máx. 10MB</p>
                </div>

                <div className="space-y-2">
                  {requiredDocs.map((rd) => {
                    const existing = app.documents.filter((d) => d.type?.toLowerCase() === rd.label.toLowerCase())
                    return (
                      <div key={rd.label} className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
                        <span className="text-xs font-medium">{rd.label}</span>
                        {existing.length > 0 ? (
                          <Badge variant={docStatusMap[existing[0].status].variant}>
                            {docStatusMap[existing[0].status].label}
                          </Badge>
                        ) : (
                          <Badge variant="warning">Pendente</Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-primary" /> Documentos enviados
                </CardTitle>
                <CardDescription>Status de validação de cada arquivo</CardDescription>
              </CardHeader>
              <CardContent>
                {app.documents.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Nenhum documento enviado ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {app.documents.map((doc) => {
                      const st = docStatusMap[doc.status] || docStatusMap.pending
                      const Icon = st.icon
                      return (
                        <div key={doc.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0 text-primary" />
                            <span className="truncate text-xs">{doc.name}</span>
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant={st.variant} className="shrink-0">
                                <Icon className="mr-1 h-3 w-3" /> {st.label}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>{st.label}</TooltipContent>
                          </Tooltip>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de tarefa */}
      <Dialog open={!!taskModal} onOpenChange={(o) => !o && setTaskModal(null)}>
        <DialogContent>
          {taskModal && (
            <>
              <DialogHeader>
                <DialogTitle>{taskModal.title}</DialogTitle>
                <DialogDescription>{taskModal.description}</DialogDescription>
              </DialogHeader>

              {taskModal.type === 'salary' ? (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-emerald-500" /> Pretensão Salarial (R$)
                  </Label>
                  <Input
                    type="number"
                    value={salaryExpectation}
                    onChange={(e) => setSalaryExpectation(e.target.value)}
                    placeholder="Ex.: 9000"
                  />
                  <p className="text-xs text-muted-foreground">O valor será apresentado ao recrutador na negociação.</p>
                </div>
              ) : taskModal.type === 'questionnaire' ? (
                <div className="max-h-80 space-y-4 overflow-y-auto">
                  {taskModal.questions.map((q, i) => (
                    <div key={i} className="space-y-1.5">
                      <Label>
                        {i + 1}. {q}
                      </Label>
                      <Textarea
                        rows={3}
                        value={taskAnswers[q] || ''}
                        onChange={(e) => setTaskAnswers((prev) => ({ ...prev, [q]: e.target.value }))}
                        placeholder="Escreva sua resposta..."
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 shrink-0 text-primary" /> Envie o material solicitado no bloco abaixo.
                  </div>
                  <Textarea
                    rows={5}
                    value={taskAnswers._practical || ''}
                    onChange={(e) => setTaskAnswers((prev) => ({ ...prev, _practical: e.target.value }))}
                    placeholder="Cole aqui o resultado do seu teste prático (links, arquivos ou resumo)..."
                  />
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setTaskModal(null)}>Cancelar</Button>
                <Button disabled={taskModal.type === 'salary' && !salaryExpectation} onClick={() => submitTask(taskModal)}>
                  <Send className="h-4 w-4" /> Enviar Respostas
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
