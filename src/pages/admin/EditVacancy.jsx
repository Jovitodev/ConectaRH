import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, Save, Users, Clock3, Briefcase, Plus, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PageHeader, StatusBadge } from '@/components/admin-ui.jsx'
import { adminJobs, jobStatusMeta } from '@/data/adminData.js'

const job = adminJobs[0]

export default function EditVacancy({ onBack, onNavigate }) {
  const [tab, setTab] = useState('geral')
  const [requirements, setRequirements] = useState(job.requirements)
  const [pipeline, setPipeline] = useState(job.pipeline)
  const [benefits, setBenefits] = useState(job.benefits)
  const [status, setStatus] = useState(job.status)
  const [visibility, setVisibility] = useState(job.visibility)

  const save = (msg = 'Alterações salvas!') => {
    toast.success(msg, { description: `${job.code} atualizada.` })
  }

  const addReq = () => setRequirements((r) => [...r, ''])
  const setReq = (i, v) => setRequirements((r) => r.map((x, j) => (j === i ? v : x)))
  const rmReq = (i) => setRequirements((r) => r.filter((_, j) => j !== i))

  const addStep = () => setPipeline((p) => [...p, ''])
  const setStep = (i, v) => setPipeline((p) => p.map((x, j) => (j === i ? v : x)))
  const rmStep = (i) => setPipeline((p) => p.filter((_, j) => j !== i))

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title={`Editar Vaga ${job.code}`}
        description={`${job.title} · ${job.company}`}
      >
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <Button onClick={() => save()}>
          <Save className="h-4 w-4" /> Salvar alterações
        </Button>
      </PageHeader>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="geral">Dados Gerais</TabsTrigger>
          <TabsTrigger value="requisitos">Requisitos</TabsTrigger>
          <TabsTrigger value="etapas">Etapas</TabsTrigger>
          <TabsTrigger value="divulgacao">Divulgação</TabsTrigger>
        </TabsList>

        <TabsContent value="geral">
          <Card>
            <CardHeader>
              <CardTitle>Dados Gerais</CardTitle>
              <CardDescription>Informações principais da vaga.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="e-title">Título da vaga</Label>
                <Input id="e-title" defaultValue={job.title} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-company">Empresa</Label>
                <Input id="e-company" defaultValue={job.company} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-dept">Departamento</Label>
                <Select defaultValue={job.department}>
                  <SelectTrigger id="e-dept"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Saúde', 'Finanças', 'Comercial', 'Marketing', 'Logística', 'Tecnologia', 'Administrativo'].map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-loc">Localização</Label>
                <Input id="e-loc" defaultValue={job.location} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-model">Modelo</Label>
                <Select defaultValue={job.model}>
                  <SelectTrigger id="e-model"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Presencial', 'Híbrido', 'Remoto'].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="e-desc">Descrição</Label>
                <Textarea id="e-desc" defaultValue={job.description} rows={5} />
              </div>
              <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="e-smin">Salário mínimo (R$)</Label>
                  <Input id="e-smin" defaultValue={job.salary.min} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e-smax">Salário máximo (R$)</Label>
                  <Input id="e-smax" defaultValue={job.salary.max} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requisitos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Requisitos</CardTitle>
                <CardDescription>Lista de requisitos exigidos para a vaga.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addReq}>
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {requirements.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={r} onChange={(e) => setReq(i, e.target.value)} />
                  <Button variant="ghost" size="icon" onClick={() => rmReq(i)} aria-label="Remover requisito">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="etapas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Etapas do Processo</CardTitle>
                <CardDescription>Pipeline de seleção desta vaga.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addStep}>
                <Plus className="h-3.5 w-3.5" /> Adicionar etapa
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {pipeline.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Badge variant="secondary" className="h-7 w-7 justify-center rounded-full p-0">{i + 1}</Badge>
                  <Input value={s} onChange={(e) => setStep(i, e.target.value)} />
                  <Button variant="ghost" size="icon" onClick={() => rmStep(i)} aria-label="Remover etapa">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="divulgacao">
          <Card>
            <CardHeader>
              <CardTitle>Divulgação</CardTitle>
              <CardDescription>Visibilidade e status da vaga.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="e-vis">Visibilidade</Label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger id="e-vis"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publica">Pública — visível no portal</SelectItem>
                    <SelectItem value="interna">Interna — apenas equipe</SelectItem>
                    <SelectItem value="sigilosa">Sigilosa — sem divulgação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-status">Status</Label>
                <Select value={status} onValueChange={(v) => { setStatus(v); save(`Status alterado para ${jobStatusMeta[v].label}`) }}>
                  <SelectTrigger id="e-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(jobStatusMeta).map(([k, m]) => (
                      <SelectItem key={k} value={k}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Destaque a vaga</p>
                  <p className="text-xs text-muted-foreground">Aumente a visibilidade nos resultados de busca.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Barra inferior */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur lg:pl-16">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <StatusBadge meta={jobStatusMeta[status]} />
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" /> {job.candidates} candidatos
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock3 className="h-4 w-4" /> {job.openDays} dias em aberto
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onNavigate('kanban')}>
              <Briefcase className="h-4 w-4" /> Ver fluxo
            </Button>
            <Button variant="outline" onClick={() => onNavigate('candidate-detail')}>
              <Eye className="h-4 w-4" /> Candidatos
            </Button>
            <Button onClick={() => save()}>
              <Save className="h-4 w-4" /> Salvar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
