import { useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Check,
  X,
  Send,
  MessageCircle,
  Download,
  Star,
  Phone,
  MapPin,
  Mail,
  ShieldCheck,
  FileText,
  Briefcase,
  GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { PageHeader, StatusBadge, AvatarInitials } from '@/components/admin-ui.jsx'
import { adminCandidates, candidateStatusMeta, adminJobs } from '@/data/adminData.js'

const cand = adminCandidates[0]
const job = adminJobs.find((j) => j.id === cand.jobId)

export default function CandidateDetail({ onBack, onNavigate }) {
  const [tab, setTab] = useState('resumo')
  const [action, setAction] = useState(null)

  const fireAction = (name, desc) => {
    setAction(name)
    toast.success(name, { description: desc })
  }

  const actionButtons = [
    { name: 'Aprovar', desc: 'Candidato avançará para a próxima etapa.', icon: Check, cls: 'bg-emerald-600 hover:bg-emerald-600/90 text-white' },
    { name: 'Reprovar', desc: 'Candidato será desqualificado do processo.', icon: X, cls: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' },
    { name: 'Enviar Proposta', desc: 'Proposta enviada para o e-mail do candidato.', icon: Send, cls: '' },
    { name: 'Enviar Mensagem', desc: 'WhatsApp aberto em nova aba.', icon: MessageCircle, cls: '' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Perfil do Candidato"
        description={`${cand.name} · ${cand.cpf}`}
      >
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
      </PageHeader>

      {/* Cabeçalho do candidato */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <AvatarInitials name={cand.name} className="h-14 w-14 text-lg" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-poppins text-xl font-semibold">{cand.name}</h2>
                <StatusBadge meta={candidateStatusMeta[cand.status]} />
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{cand.summary.slice(0, 110)}...</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {cand.city}</span>
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {cand.email}</span>
                <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {cand.phone}</span>
                <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> PCD: {cand.pcd}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info" className="text-sm">
              <Star className="mr-1 h-3.5 w-3.5" /> {cand.score}% match
            </Badge>
            <Button variant="outline" onClick={() => toast.success('Currículo baixado', { description: `${cand.name}.pdf` })}>
              <Download className="h-4 w-4" /> Currículo
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="historico">Histórico na Vaga</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="resumo" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sobre o Candidato</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{cand.summary}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" /> Formação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cand.education.map((e, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium">{e.degree}</p>
                        <p className="text-xs text-muted-foreground">{e.institution}</p>
                      </div>
                      <Badge variant="secondary">{e.period}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" /> Experiência
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cand.experience.map((e, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium">{e.role}</p>
                        <p className="text-xs text-muted-foreground">{e.company}</p>
                      </div>
                      <Badge variant="secondary">{e.period}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Competências</CardTitle>
                  <CardDescription>Skills detectadas no currículo e perfil.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {cand.skills.map((s) => (
                    <Badge key={s} variant="secondary" className="rounded-full px-3 py-1">{s}</Badge>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="historico" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico na Vaga {job?.code}</CardTitle>
                  <CardDescription>{job?.title} · {job?.company}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-0">
                    {cand.history.map((h, i) => (
                      <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
                        {i < cand.history.length - 1 && <span className="absolute left-[11px] top-6 h-full w-px bg-border" />}
                        <span className={`relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                          h.status === 'done' ? 'border-emerald-500 bg-emerald-500 text-white' : h.status === 'current' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted'
                        }`}>
                          {h.status === 'done' ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{h.step}</p>
                          <p className="text-xs text-muted-foreground">{h.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Anotações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-600 dark:text-amber-400">
                    {cand.notes}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documentos" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Documentos Enviados</CardTitle>
                  <CardDescription>Arquivos anexados pelo candidato.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cand.documents.map((d) => (
                    <div key={d.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{d.type} · {d.size} · {d.date}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => toast.success('Download iniciado', { description: d.name })}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Painel de ações laterais */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vaga</CardTitle>
              <CardDescription>Processo seletivo em andamento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{job?.title}</p>
                  <p className="text-xs text-muted-foreground">{job?.company} · {job?.code}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('kanban')}>Abrir</Button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Etapa atual</span>
                <Badge variant="info">{cand.stage}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Candidatou-se em</span>
                <span className="font-medium">{cand.appliedAt}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
              <CardDescription>Decisões rápidas sobre este candidato.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {actionButtons.map((a) => (
                <Button
                  key={a.name}
                  className={`w-full justify-start ${a.cls}`}
                  variant={a.cls ? 'default' : 'outline'}
                  onClick={() => fireAction(a.name, a.desc)}
                >
                  <a.icon className="h-4 w-4" /> {a.name}
                </Button>
              ))}
              <Separator className="my-2" />
              <Button variant="outline" className="w-full" onClick={() => toast.success('Perfil comparado', { description: 'Score de match recalculado: 92%.' })}>
                <Star className="h-4 w-4" /> Recalcular match
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
