import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Plus,
  Download,
  Briefcase,
  GraduationCap,
  Wrench,
  Languages as LanguagesIcon,
  Link2,
  Pencil,
  Save,
  Trash2,
  CheckCircle2,
  Award,
  Clock3,
  Trophy,
  Copy,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const MONTHS = { Jan: 0, Fev: 1, Mar: 2, Abr: 3, Mai: 4, Jun: 5, Jul: 6, Ago: 7, Set: 8, Out: 9, Nov: 10, Dez: 11 }

function durationLabel(start, end) {
  const parse = (str) => {
    const [m, y] = str.split(' ')
    return { month: MONTHS[m] ?? 0, year: parseInt(y, 10) }
  }
  const s = parse(start)
  let e
  if (end === 'Presente') {
    const now = new Date()
    e = { month: now.getMonth(), year: now.getFullYear() }
  } else {
    e = parse(end)
  }
  let months = (e.year - s.year) * 12 + (e.month - s.month)
  if (months < 0) months = 0
  const years = Math.floor(months / 12)
  const rem = months % 12
  const parts = []
  if (years > 0) parts.push(`${years} ano${years > 1 ? 's' : ''}`)
  if (rem > 0) parts.push(`${rem} mes${rem > 1 ? 'es' : ''}`)
  if (months === 0) parts.push('menos de 1 mês')
  return parts.join(' e ')
}

const levelOptions = ['Iniciante', 'Intermediário', 'Avançado', 'Nativo']

export default function Resume({ user, resume, resumes = [], activeResumeId, onSelectResume, onCreateResume, onDuplicateResume, onDeleteResume, onChange }) {
  const [addModal, setAddModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [newExp, setNewExp] = useState({
    role: '', company: '', modality: '', start: '', end: '', current: false, description: '', skills: '',
  })

  const [editEducation, setEditEducation] = useState({ on: false, draft: resume.education })
  const [editSkills, setEditSkills] = useState({ on: false, draft: resume.skills })
  const [editLanguages, setEditLanguages] = useState({ on: false, draft: resume.languages })
  const [editPortfolio, setEditPortfolio] = useState({ on: false, draft: resume.portfolio })
  const [editCertificates, setEditCertificates] = useState({ on: false, draft: resume.certificates })
  const [newSkill, setNewSkill] = useState('')
  const [newLang, setNewLang] = useState({ name: '', level: 'Intermediário' })
  const [newPortfolio, setNewPortfolio] = useState({ label: '', url: '' })

  useEffect(() => {
    setEditEducation({ on: false, draft: resume.education || [] })
    setEditSkills({ on: false, draft: resume.skills || [] })
    setEditLanguages({ on: false, draft: resume.languages || [] })
    setEditPortfolio({ on: false, draft: resume.portfolio || [] })
    setEditCertificates({ on: false, draft: resume.certificates || [] })
  }, [resume.id])

  const initials = user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')
  const progress = user.profileProgress

  const addExperience = () => {
    if (!newExp.role || !newExp.company) {
      toast.warning('Dados incompletos', { description: 'Preencha cargo e empresa.' })
      return
    }
    const skills = newExp.skills.split(',').map((s) => s.trim()).filter(Boolean)
    const exp = {
      id: `exp-${Date.now()}`,
      role: newExp.role,
      company: newExp.company,
      modality: newExp.modality || 'Presencial',
      period: { start: newExp.start || 'Ago 2026', end: newExp.current ? 'Presente' : newExp.end || 'Ago 2026' },
      current: newExp.current,
      description: newExp.description,
      skills,
    }
    onChange((prev) => ({ ...prev, experiences: [exp, ...prev.experiences] }))
    setAddModal(false)
    setNewExp({ role: '', company: '', modality: '', start: '', end: '', current: false, description: '', skills: '' })
    toast.success('Experiência adicionada!', { description: `${exp.role} na ${exp.company} incluída na linha do tempo.` })
  }

  const confirmDelete = () => {
    if (!deleteId) return
    onChange((prev) => ({ ...prev, experiences: prev.experiences.filter((e) => e.id !== deleteId) }))
    setDeleteId(null)
    toast.info('Experiência removida', { description: 'O item foi removido da linha do tempo.' })
  }

  const saveEducation = () => { onChange((p) => ({ ...p, education: editEducation.draft })); setEditEducation((s) => ({ ...s, on: false })); toast.success('Formação salva!') }
  const saveSkills = () => { onChange((p) => ({ ...p, skills: editSkills.draft })); setEditSkills((s) => ({ ...s, on: false })); toast.success('Habilidades salvas!') }
  const saveLanguages = () => { onChange((p) => ({ ...p, languages: editLanguages.draft })); setEditLanguages((s) => ({ ...s, on: false })); toast.success('Idiomas salvos!') }
  const savePortfolio = () => { onChange((p) => ({ ...p, portfolio: editPortfolio.draft })); setEditPortfolio((s) => ({ ...s, on: false })); toast.success('Links salvos!') }
  const saveCertificates = () => { onChange((p) => ({ ...p, certificates: editCertificates.draft })); setEditCertificates((s) => ({ ...s, on: false })); toast.success('Certificados salvos!') }

  const exportPdf = () => {
    toast.info('Gerando PDF...', { description: 'A visualização de impressão será aberta.' })
    setTimeout(() => window.print(), 500)
  }

  const mapDraft = (draft, i, patch) => draft.map((d, j) => (j === i ? { ...d, ...patch } : d))

  return (
    <div className="w-full space-y-6">
      {/* Gerenciador de currículos */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-poppins text-base font-semibold">Meus currículos</h2><p className="text-xs text-muted-foreground">Mantenha versões diferentes para cada objetivo profissional.</p></div>
          <div className="flex items-center gap-2"><Input value={resume.name || ''} onChange={(e) => onChange((prev) => ({ ...prev, name: e.target.value }))} className="h-9 w-44" placeholder="Nome do currículo" /><Button size="sm" onClick={() => onCreateResume?.('Novo currículo')}><Plus className="h-4 w-4" /> Novo currículo</Button></div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map((item) => <div key={item.id} className={`flex items-center gap-2 rounded-lg border p-2 ${item.id === activeResumeId ? 'border-primary bg-primary/5' : 'bg-background'}`}>
            <button type="button" onClick={() => onSelectResume?.(item.id)} className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-medium">{item.name || 'Currículo sem nome'}</p><p className="text-[11px] text-muted-foreground">{(item.experiences || []).length} experiências · {(item.skills || []).length} habilidades</p></button>
            <Button size="icon" variant="ghost" title="Duplicar" onClick={() => onDuplicateResume?.(item)}><Copy className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" title="Excluir" onClick={() => onDeleteResume?.(item.id)} disabled={resumes.length <= 1}><Trash2 className="h-4 w-4" /></Button>
          </div>)}
        </div>
      </Card>

      {/* Cabeçalho do perfil */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-primary/20 via-emerald-500/10 to-transparent" />
        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20 rounded-2xl">
            <AvatarFallback className="rounded-2xl bg-primary/15 font-poppins text-2xl font-bold text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="font-poppins text-2xl font-semibold">{user.name}</h1>
            <p className="text-sm text-primary">{user.title}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {user.email}</span>
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {user.phone}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {user.city}, {user.state}</span>
              <span className="flex items-center gap-1"><Linkedin className="h-3.5 w-3.5" /> {user.linkedin}</span>
            </div>
          </div>
          <Button onClick={exportPdf}>
            <Download className="h-4 w-4" /> Exportar PDF
          </Button>
        </div>

        <div className="relative border-t p-6">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progresso de preenchimento</span>
            <span className="font-medium text-primary">{progress}%</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{user.profileMissingHint}</p>
        </div>
      </Card>

      {/* Linha do tempo */}
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-poppins text-xl font-semibold">
              <Briefcase className="h-5 w-5 text-primary" /> Experiências Profissionais
            </h2>
            <p className="text-sm text-muted-foreground">Linha do tempo cronológica com duração calculada automaticamente</p>
          </div>
          <Button onClick={() => setAddModal(true)}>
            <Plus className="h-4 w-4" /> Adicionar Experiência
          </Button>
        </div>

        <div className="relative pl-8">
          <div className="absolute bottom-2 left-[15px] top-2 w-0.5 bg-gradient-to-b from-emerald-500 via-primary to-muted" />
          <div className="space-y-6">
            {resume.experiences.map((exp) => {
              const duration = durationLabel(exp.period.start, exp.period.end)
              return (
                <div key={exp.id} className="relative">
                  <span
                    className={`absolute -left-8 top-5 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full ring-4 ring-background ${
                      exp.current ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]' : 'bg-primary'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-background" />
                  </span>

                  <Card className="group p-5 transition-all hover:border-primary/40">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-poppins text-base font-semibold">{exp.role}</h3>
                          {exp.current && <Badge variant="success">Emprego atual</Badge>}
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">{exp.company} · {exp.modality}</p>
                        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Clock3 className="h-3.5 w-3.5 text-primary" />
                          {exp.period.start} — {exp.period.end}
                          <Badge variant="info">{duration}</Badge>
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => setDeleteId(exp.id)}
                            aria-label="Remover experiência"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remover experiência</TooltipContent>
                      </Tooltip>
                    </div>
                    {exp.description && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{exp.description}</p>}
                    {exp.skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {exp.skills.map((sk, i) => (
                          <Badge key={i} variant="secondary">{sk}</Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Módulos sanfonados */}
      <Accordion type="multiple" className="w-full space-y-4">
        {/* Formação */}
        <AccordionItem value="education" className="rounded-xl border px-5">
          <AccordionTrigger>
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <GraduationCap className="h-5 w-5 text-primary" />
              </span>
              <span className="font-poppins text-sm font-semibold">Formação Acadêmica & Cursos</span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {!editEducation.on ? (
              <div className="space-y-3">
                {resume.education.map((ed) => (
                  <div key={ed.id} className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
                    <Award className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{ed.degree}</p>
                      <p className="text-xs text-muted-foreground">{ed.institution} · {ed.period}</p>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setEditEducation({ on: true, draft: resume.education })}>
                  <Pencil className="h-3.5 w-3.5" /> Editar Formação
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {editEducation.draft.map((ed, i) => (
                  <div key={ed.id} className="space-y-2 rounded-lg border bg-muted/30 p-3">
                    <Input value={ed.degree} onChange={(e) => setEditEducation((s) => ({ ...s, draft: mapDraft(s.draft, i, { degree: e.target.value }) }))} placeholder="Curso / Grau" />
                    <div className="flex gap-2">
                      <Input value={ed.institution} onChange={(e) => setEditEducation((s) => ({ ...s, draft: mapDraft(s.draft, i, { institution: e.target.value }) }))} placeholder="Instituição" />
                      <Input value={ed.period} onChange={(e) => setEditEducation((s) => ({ ...s, draft: mapDraft(s.draft, i, { period: e.target.value }) }))} className="w-32" placeholder="Período" />
                      <Button variant="ghost" size="icon" onClick={() => setEditEducation((s) => ({ ...s, draft: s.draft.filter((_, j) => j !== i) }))}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setEditEducation((s) => ({ ...s, draft: [...s.draft, { id: `edu-${Date.now()}`, degree: '', institution: '', period: '' }] }))}>
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </Button>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditEducation((s) => ({ ...s, on: false }))}>Cancelar</Button>
                  <Button size="sm" onClick={saveEducation}><Save className="h-3.5 w-3.5" /> Salvar</Button>
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Habilidades */}
        <AccordionItem value="skills" className="rounded-xl border px-5">
          <AccordionTrigger>
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Wrench className="h-5 w-5 text-primary" />
              </span>
              <span className="font-poppins text-sm font-semibold">Habilidades Técnicas</span>
              <Badge variant="secondary">{resume.skills.length} skills</Badge>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {!editSkills.on ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {resume.skills.map((sk, i) => (
                    <Badge key={i} variant="secondary">{sk.name} <span className="ml-1 text-[10px] text-primary">· {sk.level}</span></Badge>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditSkills({ on: true, draft: resume.skills })}>
                  <Pencil className="h-3.5 w-3.5" /> Editar Habilidades
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {editSkills.draft.map((sk, i) => (
                    <div key={i} className="flex items-center gap-1 rounded-md border bg-muted/40 p-1.5">
                      <Input value={sk.name} onChange={(e) => setEditSkills((s) => ({ ...s, draft: mapDraft(s.draft, i, { name: e.target.value }) }))} className="h-7 w-32" />
                      <select
                        value={sk.level}
                        onChange={(e) => setEditSkills((s) => ({ ...s, draft: mapDraft(s.draft, i, { level: e.target.value }) }))}
                        className="h-7 rounded-md border bg-transparent px-1 text-xs outline-none"
                      >
                        {levelOptions.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditSkills((s) => ({ ...s, draft: s.draft.filter((_, j) => j !== i) }))}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Adicionar skill e pressione Enter..." className="max-w-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSkill.trim()) {
                        setEditSkills((s) => ({ ...s, draft: [...s.draft, { name: newSkill.trim(), level: 'Intermediário' }] }))
                        setNewSkill('')
                      }
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditSkills((s) => ({ ...s, on: false }))}>Cancelar</Button>
                  <Button size="sm" onClick={saveSkills}><Save className="h-3.5 w-3.5" /> Salvar</Button>
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Idiomas */}
        <AccordionItem value="languages" className="rounded-xl border px-5">
          <AccordionTrigger>
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <LanguagesIcon className="h-5 w-5 text-primary" />
              </span>
              <span className="font-poppins text-sm font-semibold">Idiomas</span>
              <Badge variant="secondary">{resume.languages.length} idiomas</Badge>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {!editLanguages.on ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  {resume.languages.map((l, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
                      <span className="text-sm">{l.name}</span>
                      <Badge variant="success">{l.level}</Badge>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditLanguages({ on: true, draft: resume.languages })}>
                  <Pencil className="h-3.5 w-3.5" /> Editar Idiomas
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  {editLanguages.draft.map((l, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input value={l.name} onChange={(e) => setEditLanguages((s) => ({ ...s, draft: mapDraft(s.draft, i, { name: e.target.value }) }))} />
                      <select
                        value={l.level}
                        onChange={(e) => setEditLanguages((s) => ({ ...s, draft: mapDraft(s.draft, i, { level: e.target.value }) }))}
                        className="h-9 rounded-md border bg-transparent px-2 text-xs outline-none"
                      >
                        {levelOptions.map((lo) => <option key={lo} value={lo}>{lo}</option>)}
                      </select>
                      <Button variant="ghost" size="icon" onClick={() => setEditLanguages((s) => ({ ...s, draft: s.draft.filter((_, j) => j !== i) }))}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newLang.name} onChange={(e) => setNewLang((s) => ({ ...s, name: e.target.value }))} placeholder="Novo idioma..." className="max-w-[140px]" />
                  <select value={newLang.level} onChange={(e) => setNewLang((s) => ({ ...s, level: e.target.value }))} className="h-9 rounded-md border bg-transparent px-2 text-xs outline-none">
                    {levelOptions.map((lo) => <option key={lo} value={lo}>{lo}</option>)}
                  </select>
                  <Button size="icon" onClick={() => {
                    if (!newLang.name.trim()) return
                    setEditLanguages((s) => ({ ...s, draft: [...s.draft, { name: newLang.name.trim(), level: newLang.level }] }))
                    setNewLang({ name: '', level: 'Intermediário' })
                  }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditLanguages((s) => ({ ...s, on: false }))}>Cancelar</Button>
                  <Button size="sm" onClick={saveLanguages}><Save className="h-3.5 w-3.5" /> Salvar</Button>
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Portfólio */}
        <AccordionItem value="portfolio" className="rounded-xl border px-5">
          <AccordionTrigger>
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Link2 className="h-5 w-5 text-primary" />
              </span>
              <span className="font-poppins text-sm font-semibold">Portfólio & Links</span>
              <Badge variant="secondary">{resume.portfolio.length} links</Badge>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {!editPortfolio.on ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  {resume.portfolio.map((p, i) => (
                    <a key={i} href={p.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-primary hover:border-primary/50">
                      <Link2 className="h-4 w-4" /> {p.label}
                    </a>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditPortfolio({ on: true, draft: resume.portfolio })}>
                  <Pencil className="h-3.5 w-3.5" /> Editar Links
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  {editPortfolio.draft.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input value={p.label} onChange={(e) => setEditPortfolio((s) => ({ ...s, draft: mapDraft(s.draft, i, { label: e.target.value }) }))} className="w-32" placeholder="Rótulo" />
                      <Input value={p.url} onChange={(e) => setEditPortfolio((s) => ({ ...s, draft: mapDraft(s.draft, i, { url: e.target.value }) }))} placeholder="https://..." />
                      <Button variant="ghost" size="icon" onClick={() => setEditPortfolio((s) => ({ ...s, draft: s.draft.filter((_, j) => j !== i) }))}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newPortfolio.label} onChange={(e) => setNewPortfolio((s) => ({ ...s, label: e.target.value }))} className="w-32" placeholder="Rótulo" />
                  <Input value={newPortfolio.url} onChange={(e) => setNewPortfolio((s) => ({ ...s, url: e.target.value }))} placeholder="https://..." />
                  <Button size="icon" onClick={() => {
                    if (!newPortfolio.label.trim() || !newPortfolio.url.trim()) return
                    setEditPortfolio((s) => ({ ...s, draft: [...s.draft, { label: newPortfolio.label.trim(), url: newPortfolio.url.trim() }] }))
                    setNewPortfolio({ label: '', url: '' })
                  }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditPortfolio((s) => ({ ...s, on: false }))}>Cancelar</Button>
                  <Button size="sm" onClick={savePortfolio}><Save className="h-3.5 w-3.5" /> Salvar</Button>
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Certificados */}
        <AccordionItem value="certificates" className="rounded-xl border px-5">
          <AccordionTrigger>
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Trophy className="h-5 w-5 text-primary" />
              </span>
              <span className="font-poppins text-sm font-semibold">Conquistas & Certificados</span>
              <Badge variant="secondary">{resume.certificates?.length || 0} itens</Badge>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {!editCertificates.on ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  {(resume.certificates || []).map((c) => (
                    <div key={c.id} className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
                      <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium">{c.title}</p>
                        <p className="text-xs text-muted-foreground">{c.institution} · {c.year}</p>
                        {c.description && <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>}
                      </div>
                    </div>
                  ))}
                  {(resume.certificates || []).length === 0 && (
                    <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">Nenhum certificado adicionado ainda.</p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditCertificates({ on: true, draft: resume.certificates || [] })}>
                  <Pencil className="h-3.5 w-3.5" /> Editar Certificados
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  {editCertificates.draft.map((c, i) => (
                    <div key={c.id} className="space-y-2 rounded-lg border bg-muted/30 p-3">
                      <Input value={c.title} onChange={(e) => setEditCertificates((s) => ({ ...s, draft: mapDraft(s.draft, i, { title: e.target.value }) }))} placeholder="Título" />
                      <div className="flex gap-2">
                        <Input value={c.institution} onChange={(e) => setEditCertificates((s) => ({ ...s, draft: mapDraft(s.draft, i, { institution: e.target.value }) }))} placeholder="Instituição" />
                        <Input value={c.year} onChange={(e) => setEditCertificates((s) => ({ ...s, draft: mapDraft(s.draft, i, { year: e.target.value }) }))} className="w-24" placeholder="Ano" />
                        <Button variant="ghost" size="icon" onClick={() => setEditCertificates((s) => ({ ...s, draft: s.draft.filter((_, j) => j !== i) }))}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <Textarea value={c.description} onChange={(e) => setEditCertificates((s) => ({ ...s, draft: mapDraft(s.draft, i, { description: e.target.value }) }))} rows={2} placeholder="Descrição (opcional)" />
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditCertificates((s) => ({ ...s, draft: [...s.draft, { id: `cert-${Date.now()}`, title: '', institution: '', year: '', description: '' }] }))}>
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </Button>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditCertificates((s) => ({ ...s, on: false }))}>Cancelar</Button>
                  <Button size="sm" onClick={saveCertificates}><Save className="h-3.5 w-3.5" /> Salvar</Button>
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator className="my-4" />

      {/* Dialog: adicionar experiência */}
      <Dialog open={addModal} onOpenChange={setAddModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Experiência</DialogTitle>
            <DialogDescription>Inclua um novo cargo na linha do tempo do seu currículo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Cargo *</Label>
              <Input value={newExp.role} onChange={(e) => setNewExp((s) => ({ ...s, role: e.target.value }))} placeholder="Ex.: Enfermeiro Sênior" />
            </div>
            <div className="space-y-1.5">
              <Label>Empresa *</Label>
              <Input value={newExp.company} onChange={(e) => setNewExp((s) => ({ ...s, company: e.target.value }))} placeholder="Ex.: Hospital São Paulo" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Modalidade</Label>
                <select value={newExp.modality} onChange={(e) => setNewExp((s) => ({ ...s, modality: e.target.value }))} className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none">
                  <option>Presencial</option>
                  <option>Híbrido</option>
                  <option>Remoto</option>
                </select>
              </div>
              <label className="flex items-end gap-2 pb-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={newExp.current} onChange={(e) => setNewExp((s) => ({ ...s, current: e.target.checked }))} className="h-4 w-4 accent-primary" />
                Emprego atual
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Início</Label>
                <Input value={newExp.start} onChange={(e) => setNewExp((s) => ({ ...s, start: e.target.value }))} placeholder="Ex.: Jan 2020" />
              </div>
              <div className="space-y-1.5">
                <Label>Fim</Label>
                <Input value={newExp.end} disabled={newExp.current} onChange={(e) => setNewExp((s) => ({ ...s, end: e.target.value }))} placeholder="Ex.: Dez 2022" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição das realizações</Label>
              <Textarea value={newExp.description} onChange={(e) => setNewExp((s) => ({ ...s, description: e.target.value }))} rows={3} placeholder="Descreva suas principais entregas e resultados..." />
            </div>
            <div className="space-y-1.5">
              <Label>Skills (separadas por vírgula)</Label>
              <Input value={newExp.skills} onChange={(e) => setNewExp((s) => ({ ...s, skills: e.target.value }))} placeholder="Liderança, UTI, Indicadores" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModal(false)}>Cancelar</Button>
            <Button onClick={addExperience}><CheckCircle2 className="h-4 w-4" /> Adicionar ao Currículo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: confirmar remoção */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover experiência?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O item será removido permanentemente da sua linha do tempo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="h-4 w-4" /> Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
