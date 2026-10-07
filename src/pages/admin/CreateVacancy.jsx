import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, Check, Plus, Trash2, Save, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/admin-ui.jsx'
import { jobTemplates } from '@/data/adminData.js'
import { createVacancy, loadCompanies, loadRecruitmentAreas } from '@/lib/recruitmentStore.js'
import LocationFields from '@/components/LocationFields.jsx'
import { maskSalaryInput, parseSalary } from '@/lib/inputMasks.js'

const emptyBenefit = (i) => `Benefício ${i}`

const stepsMeta = [
  { n: 1, title: 'Informações Básicas', desc: 'Identificação e modelo da vaga' },
  { n: 2, title: 'Detalhamento', desc: 'Requisitos, salário, etapas e visibilidade' },
]

export default function CreateVacancy({ onBack, onDone }) {
  const [step, setStep] = useState(1)
  const [companies, setCompanies] = useState([])
  const [areaChoices, setAreaChoices] = useState([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    companyId: '',
    department: 'Saúde',
    areas: [],
    applicationStart: '',
    applicationEnd: '',
    state: '', stateId: null, city: '', cityId: null,
    model: 'Presencial',
    type: 'CLT',
    description: '',
    requirements: [''],
    salaryMin: '',
    salaryMax: '',
    pipeline: ['Triagem de Currículo', 'Entrevista com Gestor'],
    benefits: [],
    visibility: 'publica',
    template: '',
    published: false,
  })

  useEffect(() => {
    loadCompanies().then(setCompanies).catch((error) => toast.error('Não foi possível carregar empresas: ' + error.message)).finally(() => setLoadingCompanies(false))
    loadRecruitmentAreas().then((rows) => setAreaChoices(rows.map((area) => area.nome))).catch((error) => toast.error('Não foi possível carregar áreas: ' + error.message))
  }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setRaw = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const updateLocation = useCallback((patch) => setForm((current) => ({ ...current, ...patch })), [])

  const setRequirement = (i, value) => {
    setForm((f) => ({ ...f, requirements: f.requirements.map((r, j) => (j === i ? value : r)) }))
  }

  const addRequirement = () => {
    setForm((f) => ({ ...f, requirements: [...f.requirements, ''] }))
  }

  const removeRequirement = (i) => {
    setForm((f) => ({ ...f, requirements: f.requirements.filter((_, j) => j !== i) }))
  }

  const setPipelineStep = (i, value) => {
    setForm((f) => ({ ...f, pipeline: f.pipeline.map((s, j) => (j === i ? value : s)) }))
  }

  const addPipelineStep = () => {
    setForm((f) => ({ ...f, pipeline: [...f.pipeline, ''] }))
  }

  const removePipelineStep = (i) => {
    setForm((f) => ({ ...f, pipeline: f.pipeline.filter((_, j) => j !== i) }))
  }

  const applyTemplate = (tplId) => {
    const tpl = jobTemplates.find((t) => t.id === tplId)
    if (!tpl) return
    setForm((f) => ({
      ...f,
      template: tplId,
      department: tpl.department,
      pipeline: tpl.steps,
    }))
    toast.success('Template aplicado', { description: `Pipeline de "${tpl.name}" carregado.` })
  }

  const validateStep1 = () => {
    if (!form.companyId) { toast.error('Selecione uma empresa cadastrada pelo Comercial.'); return false }
    if (!form.title.trim()) {
      toast.error('Informe o título da vaga.')
      return false
    }
    if (!form.cityId || !form.stateId) {
      toast.error('Selecione estado e cidade da lista.')
      return false
    }
    if (!form.areas.length) { toast.error('Selecione ao menos uma área.'); return false }
    if (!form.applicationStart || !form.applicationEnd || form.applicationEnd < form.applicationStart) { toast.error('Informe um período de inscrição válido.'); return false }
    return true
  }

  const validateStep2 = () => {
    if (!form.salaryMin || !form.salaryMax || parseSalary(form.salaryMin) > parseSalary(form.salaryMax)) {
      toast.error('Preencha a faixa salarial.')
      return false
    }
    return true
  }

  const next = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep((s) => Math.min(2, s + 1))
  }

  const save = async (draft = false) => {
    if (!validateStep1() || !validateStep2()) return
    setSaving(true)
    try {
      const saved = await createVacancy({ ...form, published: draft ? false : form.published, salaryMinValue: parseSalary(form.salaryMin), salaryMaxValue: parseSalary(form.salaryMax) })
      toast.success(!draft && form.published ? 'Vaga publicada!' : 'Rascunho salvo!', { description: `Vaga ${saved.codigo} registrada no Supabase.` })
      onDone()
    } catch (error) { toast.error('Não foi possível salvar a vaga: ' + error.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Criar Nova Vaga"
        description="Monte uma vaga em dois passos rápidos."
      >
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
      </PageHeader>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {stepsMeta.map((s, i) => (
          <div key={s.n} className="flex flex-1 items-center gap-2">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
              step > s.n ? 'border-emerald-500 bg-emerald-500 text-white' : step === s.n ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground'
            }`}>
              {step > s.n ? <Check className="h-4 w-4" /> : s.n}
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-medium">{s.title}</p>
              <p className="truncate text-xs text-muted-foreground">{s.desc}</p>
            </div>
            {i < stepsMeta.length - 1 && <div className={`h-px flex-1 ${step > s.n ? 'bg-emerald-500' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>Identifique a vaga, empresa e modelo de contratação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="v-title">Título da vaga *</Label>
                <Input id="v-title" value={form.title} onChange={set('title')} placeholder="Ex.: Enfermeiro Intensivista UTI" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-company">Empresa / Cliente *</Label>
                <Select value={form.companyId} onValueChange={(v) => setRaw('companyId', v)} disabled={loadingCompanies || companies.length === 0}>
                  <SelectTrigger id="v-company"><SelectValue placeholder={loadingCompanies ? 'Carregando empresas...' : companies.length ? 'Selecione a empresa' : 'Aguardando cadastro pelo Comercial'} /></SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => <SelectItem key={company.id} value={String(company.id)}>{company.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                {!loadingCompanies && companies.length === 0 && <p className="text-xs text-muted-foreground">O Comercial precisa cadastrar uma empresa antes da primeira vaga real.</p>}
              </div>
              <div className="space-y-1.5"><Label>Responsável pela vaga</Label><p className="rounded-md border bg-muted px-3 py-2 text-sm">Você (conta de colaborador conectada)</p></div>
              <div className="space-y-1.5">
                <Label htmlFor="v-dept">Departamento</Label>
                <Select value={form.department} onValueChange={(v) => setRaw('department', v)}>
                  <SelectTrigger id="v-dept"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Saúde', 'Finanças', 'Comercial', 'Marketing', 'Logística', 'Tecnologia', 'Administrativo'].map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <LocationFields value={form} onChange={updateLocation} idPrefix="vacancy" />
              <fieldset className="space-y-2 sm:col-span-2"><legend className="text-sm font-medium">Áreas da vaga *</legend><p className="text-xs text-muted-foreground">Selecione uma ou mais áreas.</p><div className="flex flex-wrap gap-2">{areaChoices.map((area) => <label key={area} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><input type="checkbox" checked={form.areas.includes(area)} onChange={() => setForm((current) => ({ ...current, areas: current.areas.includes(area) ? current.areas.filter((value) => value !== area) : [...current.areas, area] }))} />{area}</label>)}</div></fieldset>
              <div className="space-y-1.5"><Label htmlFor="v-application-start">Início das inscrições *</Label><Input id="v-application-start" type="date" value={form.applicationStart} onChange={set('applicationStart')} /></div>
              <div className="space-y-1.5"><Label htmlFor="v-application-end">Fim das inscrições *</Label><Input id="v-application-end" type="date" value={form.applicationEnd} onChange={set('applicationEnd')} /></div>
              <div className="space-y-1.5">
                <Label htmlFor="v-model">Modelo de trabalho</Label>
                <Select value={form.model} onValueChange={(v) => setRaw('model', v)}>
                  <SelectTrigger id="v-model"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Presencial', 'Híbrido', 'Remoto'].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="v-type">Tipo de contratação</Label>
                <Select value={form.type} onValueChange={(v) => setRaw('type', v)}>
                  <SelectTrigger id="v-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['CLT', 'PJ', 'CLT + Variável', 'Estágio', 'Temporário'].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="v-desc">Descrição da vaga</Label>
                <Textarea id="v-desc" value={form.description} onChange={set('description')} placeholder="Descreva as responsabilidades e o contexto da vaga..." rows={4} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Detalhamento</CardTitle>
                <CardDescription>Requisitos, faixa salarial, etapas e benefícios.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Requisitos da vaga</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addRequirement}>
                    <Plus className="h-3.5 w-3.5" /> Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.requirements.map((req, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={req} onChange={(e) => setRequirement(i, e.target.value)} placeholder={`Requisito ${i + 1}`} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeRequirement(i)} disabled={form.requirements.length === 1} aria-label="Remover requisito">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="v-smin">Salário mínimo (R$) *</Label>
                  <Input id="v-smin" inputMode="numeric" value={form.salaryMin} onChange={(event) => setRaw('salaryMin', maskSalaryInput(event.target.value))} placeholder="R$ 8.500,00" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="v-smax">Salário máximo (R$) *</Label>
                  <Input id="v-smax" inputMode="numeric" value={form.salaryMax} onChange={(event) => setRaw('salaryMax', maskSalaryInput(event.target.value))} placeholder="R$ 11.000,00" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Etapas do Processo</CardTitle>
                <CardDescription>Pipeline de seleção desta vaga. Os modelos abaixo são apenas sugestões locais.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="v-tpl">Template (opcional)</Label>
                <Select value={form.template} onValueChange={applyTemplate}>
                  <SelectTrigger id="v-tpl"><SelectValue placeholder="Selecione um template..." /></SelectTrigger>
                  <SelectContent>
                    {jobTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                {form.pipeline.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Badge variant="secondary" className="h-7 w-7 justify-center rounded-full p-0">{i + 1}</Badge>
                    <Input value={s} onChange={(e) => setPipelineStep(i, e.target.value)} placeholder={`Etapa ${i + 1}`} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removePipelineStep(i)} disabled={form.pipeline.length === 1} aria-label="Remover etapa">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addPipelineStep}>
                <Plus className="h-3.5 w-3.5" /> Adicionar etapa
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Benefícios e Visibilidade</CardTitle>
              <CardDescription>Liste os benefícios oferecidos e defina a visibilidade da vaga.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Benefícios</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setRaw('benefits', [...form.benefits, emptyBenefit(form.benefits.length)])}>
                    <Plus className="h-3.5 w-3.5" /> Adicionar
                  </Button>
                </div>
                {form.benefits.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Nenhum benefício adicionado. Clique em "Adicionar" para incluir.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {form.benefits.map((b, i) => (
                      <Badge key={i} variant="secondary" className="gap-1 pr-1">
                        {b}
                        <button type="button" onClick={() => setRaw('benefits', form.benefits.filter((_, j) => j !== i))} aria-label="Remover benefício">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-1.5">
                <Label htmlFor="v-vis">Visibilidade</Label>
                <Select value={form.visibility} onValueChange={(v) => setRaw('visibility', v)}>
                  <SelectTrigger id="v-vis"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publica">Pública — visível no portal</SelectItem>
                    <SelectItem value="interna">Interna — apenas equipe</SelectItem>
                    <SelectItem value="sigilosa">Sigilosa — sem divulgação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Publicar imediatamente</p>
                  <p className="text-xs text-muted-foreground">Se desativado, a vaga será salva como rascunho.</p>
                </div>
                <Switch checked={form.published} onCheckedChange={(v) => setRaw('published', v)} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        <div className="flex items-center gap-2">
          {step === 2 && (
            <Button variant="ghost" onClick={() => save(true)} disabled={saving || companies.length === 0}>
              <Save className="h-4 w-4" /> Salvar como rascunho
            </Button>
          )}
          {step < 2 ? (
            <Button onClick={next}>
              Próximo <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => save(false)} disabled={saving || companies.length === 0}>
              <Check className="h-4 w-4" /> {form.published ? 'Publicar vaga' : 'Salvar vaga'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
