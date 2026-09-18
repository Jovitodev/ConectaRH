import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Copy, Pencil, MoreHorizontal, Search, Briefcase, Filter, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PageHeader, SectionHeader, StatusBadge, EmptyState } from '@/components/admin-ui.jsx'
import { adminJobs, jobStatusMeta } from '@/data/adminData.js'
import { readStore, writeStore } from '@/lib/localStore.js'

export default function Vacancies({ onNavigate }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('todas')
  const [tab, setTab] = useState('todas')
  const [vacancies, setVacancies] = useState(() => readStore('admin.vacancies', adminJobs))

  const filtered = vacancies.filter((job) => {
    const matchQuery =
      !query ||
      job.title.toLowerCase().includes(query.toLowerCase()) ||
      job.code.toLowerCase().includes(query.toLowerCase()) ||
      job.company.toLowerCase().includes(query.toLowerCase())
    const matchStatus = statusFilter === 'todas' || job.status === statusFilter
    return matchQuery && matchStatus
  })

  const countBy = (s) => vacancies.filter((j) => j.status === s).length

  const duplicate = (job) => {
    const copy = { ...job, id: `${job.id}-copy-${Date.now()}`, code: `${job.code}-COPY`, title: `${job.title} — Cópia`, status: 'rascunho', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    const next = [copy, ...vacancies]
    setVacancies(next); writeStore('admin.vacancies', next)
    toast.success('Vaga duplicada', { description: `Rascunho criado a partir de ${job.code}.` })
  }

  const toggleStatus = (job) => {
    const status = job.status === 'ativa' ? 'pausada' : 'ativa'
    const next = vacancies.map((item) => item.id === job.id ? { ...item, status, updatedAt: new Date().toISOString() } : item)
    setVacancies(next); writeStore('admin.vacancies', next)
    toast.success('Status atualizado', { description: `${job.code} alterada para ${status}.` })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Controle de Vagas"
        description="Gerencie aberturas, rascunhos e encerramentos."
      >
        <Button onClick={() => onNavigate('vacancy-create')}>
          <Plus className="h-4 w-4" /> Criar Nova Vaga
        </Button>
      </PageHeader>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="todas">Todas ({vacancies.length})</TabsTrigger>
          <TabsTrigger value="ativas">Ativas ({countBy('ativa')})</TabsTrigger>
          <TabsTrigger value="rascunho">Rascunhos ({countBy('rascunho')})</TabsTrigger>
          <TabsTrigger value="pausada">Pausadas ({countBy('pausada')})</TabsTrigger>
          <TabsTrigger value="encerrada">Encerradas ({countBy('encerrada')})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por vaga, código ou empresa..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="h-3.5 w-3.5" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos os status</SelectItem>
            {Object.entries(jobStatusMeta).map(([k, m]) => (
              <SelectItem key={k} value={k}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {filtered.map((job) => (
          <Card key={job.id} className="flex flex-col">
            <CardContent className="flex flex-1 flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                    {job.code.replace('VAG-', '#')}
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">{job.company}</p>
                    <p className="font-poppins text-sm font-semibold leading-tight">{job.title}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Ações">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onNavigate('vacancy-edit')}>
                      <Pencil /> Editar vaga
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onNavigate('candidate-detail')}>
                      <Eye /> Ver candidatos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => duplicate(job)}>
                      <Copy /> Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => toggleStatus(job)}>
                      {job.status === 'ativa' ? 'Pausar vaga' : 'Reativar vaga'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge variant="secondary">{job.model}</Badge>
                <Badge variant="secondary">{job.type}</Badge>
                <Badge variant="secondary">{job.department}</Badge>
              </div>

              <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                <p>{job.location}</p>
                <p>
                  <span className="text-foreground">R$ {job.salary.min.toLocaleString('pt-BR')} - R$ {job.salary.max.toLocaleString('pt-BR')}</span>
                </p>
              </div>

              <div className="mt-auto flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" /> {job.candidates} candidatos
                  </span>
                  <span>{job.status === 'rascunho' ? 'Não publicada' : `${job.openDays} dias`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge meta={jobStatusMeta[job.status]} />
                  <Button size="sm" variant="outline" onClick={() => onNavigate('vacancy-edit')}>
                    Gerenciar
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 border-t pt-3">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-sky-50 text-[10px] font-bold text-sky-700">
                    {job.recruiter.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">{job.recruiter}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <EmptyState
          icon={Briefcase}
          title="Nenhuma vaga encontrada"
          description="Ajuste os filtros de busca ou crie uma nova vaga para começar."
          action={
            <Button onClick={() => onNavigate('vacancy-create')}>
              <Plus className="h-4 w-4" /> Criar Nova Vaga
            </Button>
          }
        />
      )}
    </div>
  )
}
