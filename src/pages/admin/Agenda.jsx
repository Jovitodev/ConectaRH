import { useState } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Video,
  MapPin,
  Users,
  MessageSquareText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader, StatCard } from '@/components/admin-ui.jsx'
import { interviews, adminCandidates } from '@/data/adminData.js'

const statusMeta = {
  agendada: { label: 'Agendada', variant: 'info' },
  concluida: { label: 'Concluída', variant: 'success' },
  cancelada: { label: 'Cancelada', variant: 'destructive' },
  pendente: { label: 'Pendente', variant: 'warning' },
}

export default function Agenda() {
  const [list, setList] = useState(interviews)
  const [tab, setTab] = useState('hoje')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    candidate: '',
    job: '',
    date: '2026-08-25',
    time: '10:00',
    duration: 45,
    type: 'Entrevista com RH',
    interviewers: '',
    link: '',
    location: 'Google Meet',
  })

  const today = '2026-08-25'

  const counts = {
    hoje: list.filter((i) => i.date === today && i.status !== 'cancelada').length,
    pendentes: list.filter((i) => i.status === 'agendada').length,
    concluidas: list.filter((i) => i.status === 'concluida').length,
    todas: list.length,
  }

  const tabFilter = (i) => {
    if (tab === 'hoje') return i.date === today && i.status !== 'cancelada'
    if (tab === 'pendentes') return i.status === 'agendada'
    if (tab === 'concluidas') return i.status === 'concluida'
    return true
  }

  const visible = list.filter(tabFilter).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setRaw = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const create = () => {
    if (!form.candidate || !form.date || !form.time) {
      toast.error('Preencha candidato, data e horário.')
      return
    }
    setList((prev) => [
      {
        id: `int-${Date.now()}`,
        candidate: form.candidate,
        jobCode: 'VAG-0001',
        job: form.job || 'Enfermeiro Intensivista UTI',
        date: form.date,
        time: form.time,
        duration: form.duration,
        type: form.type,
        interviewers: form.interviewers ? [form.interviewers] : ['Marina Duarte'],
        link: form.link || 'https://meet.example.com/nova-entrevista',
        status: 'agendada',
        location: form.location,
        parecer: null,
      },
      ...prev,
    ])
    setCreateOpen(false)
    setForm({ candidate: '', job: '', date: '2026-08-25', time: '10:00', duration: 45, type: 'Entrevista com RH', interviewers: '', link: '', location: 'Google Meet' })
    toast.success('Entrevista agendada!', { description: 'Os participantes foram notificados.' })
  }

  const submitParecer = (id) => {
    toast.success('Parecer registrado', { description: 'Parecer salvo para a entrevista.' })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda de Entrevistas"
        description="Gerencie horários, entrevistadores e pareceres."
      >
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Agendar entrevista
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Entrevistas Hoje" value={counts.hoje} description={`Hoje · ${today}`} icon={CalendarClock} accent="text-sky-700 bg-sky-50" />
        <StatCard title="Pendentes" value={counts.pendentes} description="Agendadas aguardando realização" icon={Clock3} accent="text-amber-700 bg-amber-50" />
        <StatCard title="Concluídas" value={counts.concluidas} description="Com parecer registrado" icon={CheckCircle2} accent="text-emerald-700 bg-emerald-50" />
        <StatCard title="Total no mês" value={counts.todas} description="Todas as entrevistas do período" icon={CalendarClock} accent="text-indigo-700 bg-indigo-50" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="hoje">Hoje ({counts.hoje})</TabsTrigger>
          <TabsTrigger value="pendentes">Pendentes ({counts.pendentes})</TabsTrigger>
          <TabsTrigger value="concluidas">Concluídas ({counts.concluidas})</TabsTrigger>
          <TabsTrigger value="todas">Todas</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {visible.map((i) => (
              <Card key={i.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{i.candidate}</CardTitle>
                      <CardDescription>{i.job} · {i.jobCode}</CardDescription>
                    </div>
                    <Badge variant={statusMeta[i.status].variant}>{statusMeta[i.status].label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarClock className="h-4 w-4" /> {i.date} às {i.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock3 className="h-4 w-4" /> {i.duration} min
                    </span>
                    <span className="flex items-center gap-1">
                      {i.location === 'Google Meet' ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />} {i.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{i.interviewers.join(', ')}</span>
                  </div>

                  {i.status === 'concluida' ? (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Parecer</p>
                      <p className="mt-1 text-sm text-muted-foreground">{i.parecer}</p>
                    </div>
                  ) : i.status === 'agendada' ? (
                    <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3">
                      <div className="min-w-0 flex-1">
                        <Label htmlFor={`parecer-${i.id}`} className="text-xs">Parecer rápido</Label>
                        <Input id={`parecer-${i.id}`} placeholder="Aprovado / Reprovado / Dúvida..." className="mt-1 h-8" />
                      </div>
                      <Button size="sm" onClick={() => submitParecer(i.id)}>
                        <MessageSquareText className="h-3.5 w-3.5" /> Salvar
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal criar entrevista */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Agendar Entrevista</DialogTitle>
            <DialogDescription>Defina candidato, horário, entrevistadores e link da reunião.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="a-cand">Candidato *</Label>
              <Select value={form.candidate} onValueChange={(v) => setRaw('candidate', v)}>
                <SelectTrigger id="a-cand"><SelectValue placeholder="Selecione o candidato..." /></SelectTrigger>
                <SelectContent>
                  {adminCandidates.filter((c) => c.status === 'ativo').map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-type">Tipo de entrevista</Label>
              <Select value={form.type} onValueChange={(v) => setRaw('type', v)}>
                <SelectTrigger id="a-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Entrevista com RH', 'Entrevista com Gestor', 'Entrevista Técnica', 'Entrevista Comercial', 'Painel de Entrevistas'].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="a-date">Data *</Label>
                <Input id="a-date" type="date" value={form.date} onChange={set('date')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-time">Horário *</Label>
                <Input id="a-time" type="time" value={form.time} onChange={set('time')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="a-dur">Duração (min)</Label>
                <Input id="a-dur" type="number" value={form.duration} onChange={set('duration')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-int">Entrevistadores</Label>
                <Input id="a-int" value={form.interviewers} onChange={set('interviewers')} placeholder="Marina Duarte" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-link">Link da reunião</Label>
              <Input id="a-link" value={form.link} onChange={set('link')} placeholder="https://meet.example.com/..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={create}>
              <CalendarClock className="h-4 w-4" /> Agendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
