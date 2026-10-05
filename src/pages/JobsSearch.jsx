import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Search, MapPin, Banknote, Building2, Clock, Check, Briefcase, Eye, ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { sectors } from '@/data/mockData.js'
import { jobAreas, enrollmentStatus, matchesJobFilters } from '@/lib/jobSearchRules.js'
import LocationFields from '@/components/LocationFields.jsx'
import { maskSalaryInput, parseSalary } from '@/lib/inputMasks.js'

const models = ['Presencial', 'Híbrido', 'Remoto']
const allAreaLabels = [...sectors.map((area) => area.label), 'Tecnologia', 'Recursos Humanos', 'Administrativo']
const dateLabel = (date) => date ? `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}` : 'não informado'

const sectorBadgeVariant = {
  saude: 'info',
  financas: 'finance',
  comercial: 'sales',
  marketing: 'warning',
  logistica: 'success',
}

const modelBadgeVariant = {
  Presencial: 'secondary',
  Híbrido: 'info',
  Remoto: 'success',
}

export default function JobsSearch({ jobs, applications, onApply, candidateAreas = [] }) {
  const [search, setSearch] = useState('')
  const [locality, setLocality] = useState({ state: '', stateId: null, city: '', cityId: null })
  const updateLocality = useCallback((patch) => setLocality((current) => ({ ...current, ...patch })), [])
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const invalidSalaryRange = salaryMin && salaryMax && parseSalary(salaryMin) > parseSalary(salaryMax)
  const [model, setModel] = useState('all')
  const [selectedAreas, setSelectedAreas] = useState([])
  const [detailJob, setDetailJob] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(t)
  }, [search, locality, model, selectedAreas, salaryMin, salaryMax])

  const filteredJobs = useMemo(() => {
    if (invalidSalaryRange) return []
    return jobs.filter((job) => matchesJobFilters(job, { search, state: locality.stateId ? locality.state : '', city: locality.cityId ? locality.city : '', model, areas: selectedAreas, salaryMin: parseSalary(salaryMin), salaryMax: parseSalary(salaryMax) }, sectors))
  }, [jobs, search, locality, model, selectedAreas, salaryMin, salaryMax, invalidSalaryRange])

  const isApplied = (jobId) => applications.some((a) => a.jobId === jobId)

  const clearFilters = () => {
    setSearch('')
    setLocality({ state: '', stateId: null, city: '', cityId: null })
    setSalaryMin('')
    setSalaryMax('')
    setModel('all')
    setSelectedAreas([])
  }

  const hasFilters = search || locality.state || locality.city || salaryMin || salaryMax || model !== 'all' || selectedAreas.length > 0

  const quickApply = (job) => {
    if (enrollmentStatus(job) !== 'aberta') return toast.error('Esta vaga está fora do período de inscrição.')
    if (isApplied(job.id)) {
      toast.info('Candidatura já realizada', { description: 'Você já está concorrendo a esta vaga.' })
      return
    }
    if (onApply(job.id) === false) return
    toast.success('Candidatura confirmada!', { description: `Você se candidatou a "${job.title}" na ${job.company}.` })
  }

  return (
    <div className="w-full space-y-6">
      {/* Painel de filtros */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cargo ou empresa..."
              className="h-10 pl-9 pr-8"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <LocationFields value={locality} onChange={updateLocality} idPrefix="job-filter" />
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os modelos</SelectItem>
                {models.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2"><Input aria-label="Salário mínimo" inputMode="numeric" value={salaryMin} onChange={(event) => setSalaryMin(maskSalaryInput(event.target.value))} placeholder="Salário mínimo" /><Input aria-label="Salário máximo" inputMode="numeric" value={salaryMax} onChange={(event) => setSalaryMax(maskSalaryInput(event.target.value))} placeholder="Salário máximo" /></div>
        {invalidSalaryRange && <p className="mt-2 text-xs text-destructive">O salário máximo deve ser maior ou igual ao mínimo.</p>}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Áreas</span>
          {allAreaLabels.map((area) => <label key={area} className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs"><input type="checkbox" checked={selectedAreas.includes(area)} onChange={() => setSelectedAreas((current) => current.includes(area) ? current.filter((value) => value !== area) : [...current, area])} />{area}</label>)}
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-muted-foreground">
              <X className="h-3.5 w-3.5" /> Limpar
            </Button>
          )}
        </div>
      </Card>

      {/* Grid de vagas */}
      {loading ? (
        <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="space-y-3 p-5">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-9 w-full" />
            </Card>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Briefcase className="h-10 w-10 text-muted-foreground" />
          <p className="font-poppins text-sm font-medium">Nenhuma vaga encontrada</p>
          <p className="text-xs text-muted-foreground">Ajuste os filtros ou limpe a busca.</p>
        </Card>
      ) : (
        <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4">
          {filteredJobs.map((job) => {
            const applied = isApplied(job.id)
            return (
              <Card key={job.id} className="flex flex-col rounded-xl border-slate-200 p-5 transition-all hover:border-primary/40 hover:shadow-soft">
                <div className="flex flex-wrap items-center gap-2">
                  {jobAreas(job, sectors).map((area) => <Badge key={area} variant={sectorBadgeVariant[job.sector]}>{area}</Badge>)}
                  {candidateAreas.some((area) => jobAreas(job, sectors).includes(area)) && <Badge variant="success">Combina com suas áreas</Badge>}
                  <Badge variant={modelBadgeVariant[job.model]}>{job.model}</Badge>
                  {applied && (
                    <Badge variant="success">
                      <Check className="mr-1 h-3 w-3" /> Candidatado
                    </Badge>
                  )}
                </div>

                <HoverCard>
                  <HoverCardTrigger asChild>
                    <h3 className="mt-3 cursor-help font-poppins text-base font-semibold hover:text-primary">{job.title}</h3>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-poppins text-sm font-semibold">{job.title}</p>
                        <p className="text-xs text-muted-foreground">{job.company}</p>
                      </div>
                      <Badge variant={sectorBadgeVariant[job.sector]}>{sectors.find((s) => s.id === job.sector)?.label}</Badge>
                    </div>
                    <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{job.description}</p>
                    <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">{job.salary}</p>
                  </HoverCardContent>
                </HoverCard>

                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{job.company}</span>
                </p>

                <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" /> {job.location}
                  </p>
                  <p className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                    <Banknote className="h-3.5 w-3.5 shrink-0" /> {job.salary}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0" /> {job.postedAt} · {job.type}
                  </p>
                  <p>Inscrições: {dateLabel(job.applicationStart)} a {dateLabel(job.applicationEnd)} · {enrollmentStatus(job)}</p>
                </div>

                <div className="mt-5 flex flex-1 items-end gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setDetailJob(job)}>
                        <Eye className="h-3.5 w-3.5" /> Detalhes
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ver descrição completa da vaga</TooltipContent>
                  </Tooltip>
                  <Button
                    size="sm"
                    className="flex-1"
                    variant={applied ? 'outline' : 'default'}
                    disabled={applied || enrollmentStatus(job) !== 'aberta'}
                    onClick={() => quickApply(job)}
                  >
                    {applied ? <Check className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                    {applied ? 'Candidatado' : enrollmentStatus(job) === 'aberta' ? 'Candidatar-se' : 'Inscrições indisponíveis'}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog de detalhe */}
      <Dialog open={!!detailJob} onOpenChange={(o) => !o && setDetailJob(null)}>
        <DialogContent className="max-w-2xl">
          {detailJob && (
            <>
              <DialogHeader>
                <DialogTitle>{detailJob.title}</DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{detailJob.company}</span>
                  {jobAreas(detailJob, sectors).map((area) => <Badge key={area} variant={sectorBadgeVariant[detailJob.sector]}>{area}</Badge>)}
                  <Badge variant={modelBadgeVariant[detailJob.model]}>{detailJob.model}</Badge>
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-2 rounded-lg border bg-muted/50 p-3 text-xs sm:grid-cols-2">
                <span className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> {detailJob.location}
                </span>
                <span className="flex items-center gap-2">
                  <Banknote className="h-3.5 w-3.5 text-emerald-500" /> <span className="font-medium">{detailJob.salary}</span>
                </span>
              </div>
              <Card className="p-3 text-sm"><p className="font-medium">Período de inscrição</p><p>{dateLabel(detailJob.applicationStart)} até {dateLabel(detailJob.applicationEnd)} · {enrollmentStatus(detailJob)}</p></Card>

              <div className="space-y-4">
                <div>
                  <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descrição da vaga</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">{detailJob.description}</p>
                </div>
                <div>
                  <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Requisitos obrigatórios</h4>
                  <ul className="space-y-1.5">
                    {detailJob.requirements.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Benefícios</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {detailJob.benefits.map((b, i) => (
                      <Badge key={i} variant="secondary">{b}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailJob(null)}>Fechar</Button>
                <Button
                  disabled={isApplied(detailJob.id) || enrollmentStatus(detailJob) !== 'aberta'}
                  onClick={() => {
                    quickApply(detailJob)
                    setDetailJob(null)
                  }}
                >
                  {isApplied(detailJob.id) ? (
                    <>
                      <Check className="h-4 w-4" /> Candidatura Enviada
                    </>
                  ) : (
                    <>Confirmar Candidatura</>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
