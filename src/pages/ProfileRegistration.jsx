import { useState } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  UserCircle2,
  GraduationCap,
  Briefcase,
  Trophy,
  Plus,
  Trash2,
  Save,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Link2,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Combobox } from '@/components/ui/combobox'
import { DatePicker } from '@/components/ui/date-picker'
import { ufList } from '@/data/mockData.js'

const steps = [
  { id: 'personal', label: 'Dados Pessoais', icon: UserCircle2 },
  { id: 'education', label: 'Formação', icon: GraduationCap },
  { id: 'experience', label: 'Experiência', icon: Briefcase },
  { id: 'achievements', label: 'Conquistas', icon: Trophy },
]

const personalSchema = z.object({
  name: z.string().min(3, 'Informe o nome completo.'),
  email: z.string().email('Informe um e-mail válido.'),
  phone: z.string().min(10, 'Informe um telefone válido.'),
  birthDate: z.string().min(1, 'Informe a data de nascimento.'),
  gender: z.string().min(1, 'Selecione o gênero.'),
  pcdOption: z.string().min(1, 'Selecione uma opção.'),
  cep: z.string().min(8, 'CEP inválido.'),
  address: z.string().min(3, 'Informe o endereço.'),
  city: z.string().min(2, 'Informe a cidade.'),
  state: z.string().min(2, 'Selecione o estado.'),
  linkedin: z.string().optional(),
  title: z.string().max(120).optional(),
  cpf: z.string().optional(),
  nationality: z.string().optional(),
  neighborhood: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  desiredSalary: z.string().optional(),
  availability: z.string().optional(),
  workPreference: z.string().optional(),
  summary: z.string().max(1000).optional(),
  portfolioUrl: z.string().optional(),
})

const emptyFormation = () => ({ id: `f-${Date.now()}-${Math.random()}`, degree: '', institution: '', start: '', end: '', current: false })
const emptyExperience = () => ({ id: `e-${Date.now()}-${Math.random()}`, role: '', company: '', start: '', end: '', current: false, description: '' })
const emptyAchievement = () => ({ id: `a-${Date.now()}-${Math.random()}`, title: '', institution: '', year: '', description: '' })

export default function ProfileRegistration({ user, resume, onSave }) {
  const [step, setStep] = useState(0)
  const [formations, setFormations] = useState(
    resume.education.map((ed) => {
      const [start = '', end = ''] = String(ed.period || '').split(' - ')
      return { id: ed.id, degree: ed.degree, institution: ed.institution, start, end, current: false }
    }),
  )
  const [experiences, setExperiences] = useState(
    resume.experiences.map((ex) => ({
      id: ex.id,
      role: ex.role,
      company: ex.company,
      start: ex.period?.start || '',
      end: ex.period?.end || '',
      current: ex.current,
      description: ex.description || '',
    })),
  )
  const [achievements, setAchievements] = useState(
    resume.certificates.map((c) => ({ id: c.id, title: c.title, institution: c.institution, year: c.year, description: c.description })),
  )
  const [saved, setSaved] = useState(false)

  const form = useForm({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      birthDate: user.birthDate,
      gender: user.gender || '',
      pcdOption: user.pcdOption || 'Não',
      cep: user.cep || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      linkedin: user.linkedin || '',
      title: user.title || '',
      cpf: user.cpf || '',
      nationality: user.nationality || '',
      neighborhood: user.neighborhood || '',
      number: user.number || '',
      complement: user.complement || '',
      desiredSalary: user.desiredSalary || '',
      availability: user.availability || 'Imediata',
      workPreference: user.workPreference || 'Não definido',
      summary: resume.summary || user.summary || '',
      portfolioUrl: user.portfolioUrl || '',
    },
  })

  const updateList = (setter, id, patch) => setter((list) => list.map((item) => (item.id === id ? { ...item, ...patch } : item)))

  const saveAll = form.handleSubmit(
    (values) => {
      const tracked = ['name', 'email', 'phone', 'birthDate', 'gender', 'pcdOption', 'cep', 'address', 'city', 'state', 'title', 'cpf', 'nationality', 'desiredSalary', 'availability', 'workPreference', 'summary']
      const completed = tracked.filter((key) => String(values[key] ?? '').trim()).length
      const profileProgress = Math.round((completed / tracked.length) * 100)
      const newHint = profileProgress >= 100 ? 'Perfil completo!' : `Complete ${tracked.filter((key) => !String(values[key] ?? '').trim()).length} campo(s) para chegar a 100%.`
      onSave({
        user: { ...user, ...values, profileProgress, profileMissingHint: newHint },
        resume: {
          ...resume,
          name: resume.name || 'Currículo Geral',
          summary: values.summary || resume.summary || '',
          education: formations.filter((f) => f.degree || f.institution).map((f) => ({
            id: f.id,
            degree: f.degree,
            institution: f.institution,
            period: `${f.start} - ${f.end}`,
          })),
          experiences: experiences
            .filter((e) => e.role || e.company)
            .map((e) => ({
              id: e.id,
              role: e.role,
              company: e.company,
              modality: e.current ? 'Emprego atual' : 'Presencial',
              period: { start: e.start || 'Ago 2026', end: e.current ? 'Presente' : e.end || 'Ago 2026' },
              current: e.current,
              description: e.description,
              skills: [],
            })),
          certificates: achievements.filter((a) => a.title).map((a) => ({ id: a.id, title: a.title, institution: a.institution, year: a.year, description: a.description })),
        },
      })
      setSaved(true)
      toast.success('Currículo salvo!', { description: 'Seu perfil foi atualizado com sucesso.' })
      setTimeout(() => setSaved(false), 2500)
    },
    () => {
      setStep(0)
      toast.error('Revise seus dados pessoais', { description: 'Há campos obrigatórios pendentes.' })
    },
  )

  const goNext = () => setStep((s) => Math.min(steps.length - 1, s + 1))
  const goBack = () => setStep((s) => Math.max(0, s - 1))

  const inputCls = 'h-10'
  const labelCls = 'text-xs font-medium text-muted-foreground'

  return (
    <div className="w-full space-y-4">
      {/* Indicador de etapas */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          {steps.map((s, i) => {
            const Icon = s.icon
            const active = i === step
            const done = i < step
            return (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                  active ? 'border-primary bg-primary/10 text-primary' : done ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-border text-muted-foreground hover:border-muted-foreground'
                }`}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                {s.label}
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex gap-1.5">
          {steps.map((s, i) => (
            <div
              key={s.id}
              className={`h-1.5 flex-1 rounded-full transition-all ${i < step ? 'bg-emerald-500' : i === step ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
      </Card>

      <Form {...form}>
        <form onSubmit={saveAll} className="space-y-4">
          <Card className="p-5 sm:p-6">
            {/* STEP 1 — Dados Pessoais */}
            {step === 0 && (
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <UserCircle2 className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-poppins text-lg font-semibold">Dados Pessoais</h3>
                    <p className="text-xs text-muted-foreground">Informações básicas usadas em suas candidaturas</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className={labelCls}>Nome completo</FormLabel>
                      <FormControl><Input className={inputCls} placeholder="Seu nome" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className={labelCls}>Título profissional</FormLabel>
                      <FormControl><Input className={inputCls} placeholder="Ex.: Analista de Dados | Engenheiro de Software" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>E-mail</FormLabel>
                      <FormControl><Input type="email" className={inputCls} placeholder="email@exemplo.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Telefone / WhatsApp</FormLabel>
                      <FormControl><Input className={inputCls} placeholder="+55 11 90000-0000" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="birthDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Data de nascimento</FormLabel>
                      <FormControl>
                        <DatePicker value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="cpf" render={({ field }) => (
                    <FormItem><FormLabel className={labelCls}>CPF</FormLabel><FormControl><Input className={inputCls} placeholder="000.000.000-00" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="nationality" render={({ field }) => (
                    <FormItem><FormLabel className={labelCls}>Nacionalidade</FormLabel><FormControl><Input className={inputCls} placeholder="Brasileira" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Gênero</FormLabel>
                      <Select value={field.value || 'all'} onValueChange={(v) => field.onChange(v === 'all' ? '' : v)}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Feminino">Feminino</SelectItem>
                          <SelectItem value="Masculino">Masculino</SelectItem>
                          <SelectItem value="Não binário">Não binário</SelectItem>
                          <SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="pcdOption" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Opção PcD</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Não">Não</SelectItem>
                          <SelectItem value="Sim">Sim</SelectItem>
                          <SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="cep" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>CEP</FormLabel>
                      <FormControl><Input className={inputCls} placeholder="00000-000" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Endereço</FormLabel>
                      <FormControl><Input className={inputCls} placeholder="Rua, número, complemento" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="number" render={({ field }) => (
                    <FormItem><FormLabel className={labelCls}>Número</FormLabel><FormControl><Input className={inputCls} placeholder="123" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="neighborhood" render={({ field }) => (
                    <FormItem><FormLabel className={labelCls}>Bairro</FormLabel><FormControl><Input className={inputCls} placeholder="Centro" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="complement" render={({ field }) => (
                    <FormItem><FormLabel className={labelCls}>Complemento</FormLabel><FormControl><Input className={inputCls} placeholder="Apto, bloco..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Cidade</FormLabel>
                      <FormControl><Input className={inputCls} placeholder="Sua cidade" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Estado (UF)</FormLabel>
                      <FormControl>
                        <Combobox
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Selecione a UF"
                          searchPlaceholder="Buscar UF..."
                          options={ufList.map((uf) => ({ value: uf, label: uf }))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="linkedin" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className={`${labelCls} flex items-center gap-1`}>
                        <Link2 className="h-3.5 w-3.5 text-primary" /> Perfil do LinkedIn
                      </FormLabel>
                      <FormControl><Input className={inputCls} placeholder="linkedin.com/in/seuperfil" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="desiredSalary" render={({ field }) => (
                    <FormItem><FormLabel className={labelCls}>Pretensão salarial</FormLabel><FormControl><Input className={inputCls} placeholder="R$ 5.000" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="availability" render={({ field }) => (
                    <FormItem><FormLabel className={labelCls}>Disponibilidade</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Imediata">Imediata</SelectItem><SelectItem value="Até 15 dias">Até 15 dias</SelectItem><SelectItem value="Até 30 dias">Até 30 dias</SelectItem><SelectItem value="A combinar">A combinar</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="workPreference" render={({ field }) => (
                    <FormItem><FormLabel className={labelCls}>Preferência de trabalho</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Remoto">Remoto</SelectItem><SelectItem value="Híbrido">Híbrido</SelectItem><SelectItem value="Presencial">Presencial</SelectItem><SelectItem value="Não definido">Não definido</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="portfolioUrl" render={({ field }) => (
                    <FormItem><FormLabel className={labelCls}>Portfólio / Site</FormLabel><FormControl><Input className={inputCls} placeholder="https://seusite.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="summary" render={({ field }) => (
                    <FormItem className="sm:col-span-2"><FormLabel className={labelCls}>Resumo profissional</FormLabel><FormControl><Textarea rows={4} placeholder="Apresente sua experiência, especialidades e principais resultados..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>
            )}

            {/* STEP 2 — Formação */}
            {step === 1 && (
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <GraduationCap className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-poppins text-lg font-semibold">Formação Acadêmica</h3>
                    <p className="text-xs text-muted-foreground">Graduações, pós, cursos técnicos e livres</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {formations.map((f) => (
                    <div key={f.id} className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <Input value={f.degree} onChange={(e) => updateList(setFormations, f.id, { degree: e.target.value })} placeholder="Curso / Grau" className="flex-1" />
                        <Button type="button" variant="ghost" size="icon" onClick={() => setFormations((l) => l.filter((x) => x.id !== f.id))} aria-label="Remover formação">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input value={f.institution} onChange={(e) => updateList(setFormations, f.id, { institution: e.target.value })} placeholder="Instituição" />
                        <div className="grid grid-cols-2 gap-2">
                          <Input value={f.start} onChange={(e) => updateList(setFormations, f.id, { start: e.target.value })} placeholder="Início" disabled={f.current} />
                          <Input value={f.end} onChange={(e) => updateList(setFormations, f.id, { end: e.target.value })} placeholder="Fim" disabled={f.current} />
                        </div>
                      </div>
                      <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                        <Checkbox checked={f.current} onCheckedChange={(c) => updateList(setFormations, f.id, { current: !!c })} />
                        Em andamento
                      </label>
                    </div>
                  ))}
                </div>

                <Button type="button" variant="outline" className="mt-4" onClick={() => setFormations((l) => [...l, emptyFormation()])}>
                  <Plus className="h-4 w-4" /> Adicionar outra formação...
                </Button>
              </div>
            )}

            {/* STEP 3 — Experiência */}
            {step === 2 && (
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <Briefcase className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-poppins text-lg font-semibold">Experiência Profissional</h3>
                    <p className="text-xs text-muted-foreground">Adicione quantas experiências forem necessárias</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {experiences.map((e) => (
                    <div key={e.id} className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <Input value={e.role} onChange={(ev) => updateList(setExperiences, e.id, { role: ev.target.value })} placeholder="Cargo" className="flex-1" />
                        <Button type="button" variant="ghost" size="icon" onClick={() => setExperiences((l) => l.filter((x) => x.id !== e.id))} aria-label="Remover experiência">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <Input value={e.company} onChange={(ev) => updateList(setExperiences, e.id, { company: ev.target.value })} placeholder="Empresa" />
                        <Input value={e.start} onChange={(ev) => updateList(setExperiences, e.id, { start: ev.target.value })} placeholder="Início (Jan 2022)" />
                        <Input value={e.end} onChange={(ev) => updateList(setExperiences, e.id, { end: ev.target.value })} placeholder="Fim (Dez 2024)" disabled={e.current} />
                      </div>
                      <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                        <Checkbox checked={e.current} onCheckedChange={(c) => updateList(setExperiences, e.id, { current: !!c })} />
                        Emprego atual
                      </label>
                      <Textarea value={e.description} onChange={(ev) => updateList(setExperiences, e.id, { description: ev.target.value })} rows={2} className="mt-3" placeholder="Descreva suas principais atividades e resultados..." />
                    </div>
                  ))}
                </div>

                <Button type="button" variant="outline" className="mt-4" onClick={() => setExperiences((l) => [...l, emptyExperience()])}>
                  <Plus className="h-4 w-4" /> Adicionar outra experiência...
                </Button>
              </div>
            )}

            {/* STEP 4 — Conquistas */}
            {step === 3 && (
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-poppins text-lg font-semibold">Conquistas & Certificados</h3>
                    <p className="text-xs text-muted-foreground">Certificações, prêmios e reconhecimentos</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {achievements.map((a) => (
                    <div key={a.id} className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <Input value={a.title} onChange={(ev) => updateList(setAchievements, a.id, { title: ev.target.value })} placeholder="Título" className="flex-1" />
                        <Button type="button" variant="ghost" size="icon" onClick={() => setAchievements((l) => l.filter((x) => x.id !== a.id))} aria-label="Remover conquista">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input value={a.institution} onChange={(ev) => updateList(setAchievements, a.id, { institution: ev.target.value })} placeholder="Instituição" />
                        <Input value={a.year} onChange={(ev) => updateList(setAchievements, a.id, { year: ev.target.value })} placeholder="Ano" />
                      </div>
                      <Textarea value={a.description} onChange={(ev) => updateList(setAchievements, a.id, { description: ev.target.value })} rows={2} className="mt-3" placeholder="Descrição da conquista..." />
                    </div>
                  ))}
                </div>

                <Button type="button" variant="outline" className="mt-4" onClick={() => setAchievements((l) => [...l, emptyAchievement()])}>
                  <Plus className="h-4 w-4" /> Adicionar outra conquista...
                </Button>
              </div>
            )}

            {/* Navegação entre etapas */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
              <Button type="button" variant="outline" onClick={goBack} disabled={step === 0}>
                <ChevronLeft className="h-4 w-4" /> Voltar
              </Button>
              <div className="flex flex-1 justify-end">
                {step < steps.length - 1 ? (
                  <Button type="button" onClick={goNext}>
                    Próximo <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>

          {/* Botão fixo de salvamento */}
          <div className="sticky bottom-4 z-10 flex items-center gap-3 rounded-xl border bg-background/95 p-3 shadow-2xl backdrop-blur">
            <div className="hidden flex-1 items-center gap-2 text-xs text-muted-foreground sm:flex">
              <MapPin className="h-4 w-4 text-primary" />
              {form.watch('city')} · {form.watch('state') || 'UF não informada'} — {formations.length} formação(ões) · {experiences.length} experiência(s)
            </div>
            <Button type="submit" size="lg" className="w-full sm:w-auto">
              {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? 'Currículo Salvo!' : 'Salvar Currículo'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
