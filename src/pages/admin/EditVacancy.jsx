import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/admin-ui.jsx'
import LocationFields from '@/components/LocationFields.jsx'
import { formatSalary, maskSalaryInput, parseSalary } from '@/lib/inputMasks.js'
import { loadCompanies, loadOwnedVacancy, loadRecruitmentAreas, updateOwnedVacancy } from '@/lib/recruitmentStore.js'

function toForm(row) {
  const [city = '', state = ''] = (row.localidade_texto || '').split(',').map((part) => part.trim())
  return {
    title: row.titulo || '', companyId: String(row.empresa_id), department: row.departamento || '',
    description: row.descricao || '', city, state, cityId: row.cidade_id, stateId: row.estado_id,
    model: row.modalidade || 'Presencial', type: row.contrato || 'CLT',
    salaryMin: formatSalary(row.salario_min), salaryMax: formatSalary(row.salario_max),
    requirements: (row.requisitos || []).join('\n'), benefits: (row.beneficios || []).join('\n'),
    pipeline: (row.etapas_iniciais || []).join('\n'), areas: row.areas || [],
    visibility: row.visibilidade, status: row.status,
    applicationStart: row.inscricoes_inicio || '', applicationEnd: row.inscricoes_fim || '',
  }
}

const lines = (value) => value.split('\n').map((line) => line.trim()).filter(Boolean)

export default function EditVacancy({ vacancyId, onBack, onSaved }) {
  const [row, setRow] = useState(null)
  const [form, setForm] = useState(null)
  const [companies, setCompanies] = useState([])
  const [areas, setAreas] = useState([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!vacancyId) { setLoading(false); return }
    let active = true
    Promise.all([loadOwnedVacancy(vacancyId), loadCompanies(), loadRecruitmentAreas()])
      .then(([vacancy, companyRows, areaRows]) => {
        if (!active) return
        setRow(vacancy); setForm(toForm(vacancy)); setCompanies(companyRows); setAreas(areaRows.map((area) => area.nome))
      })
      .catch((error) => toast.error('Não foi possível carregar a vaga: ' + error.message))
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [vacancyId])

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const updateLocation = useCallback((patch) => setForm((current) => ({ ...current, ...patch })), [])

  const save = async () => {
    if (!form.title.trim() || !form.companyId || !form.cityId || !form.stateId || !form.areas.length) return toast.error('Informe título, empresa, cidade, estado e área.')
    if (!form.applicationStart || !form.applicationEnd || form.applicationEnd < form.applicationStart) return toast.error('Informe um período de inscrição válido.')
    const salaryMinValue = parseSalary(form.salaryMin)
    const salaryMaxValue = parseSalary(form.salaryMax)
    if (salaryMinValue === null || salaryMaxValue === null || salaryMinValue > salaryMaxValue) return toast.error('Informe uma faixa salarial válida.')
    setSaving(true)
    try {
      await updateOwnedVacancy(vacancyId, {
        ...form, salaryMinValue, salaryMaxValue,
        requirements: lines(form.requirements), benefits: lines(form.benefits), pipeline: lines(form.pipeline),
      })
      const reloaded = await loadOwnedVacancy(vacancyId)
      setRow(reloaded); setForm(toForm(reloaded))
      toast.success(`Vaga ${reloaded.codigo} salva no Supabase`)
      onSaved?.()
    } catch (error) { toast.error('Não foi possível salvar: ' + error.message) }
    finally { setSaving(false) }
  }

  if (!vacancyId) return <div className="space-y-4"><p className="text-sm text-muted-foreground">Selecione uma vaga real em Controle de Vagas para editar.</p><Button onClick={onBack}>Voltar às vagas</Button></div>
  if (loading) return <p className="text-sm text-muted-foreground">Carregando vaga...</p>
  if (!form) return <div className="space-y-4"><p className="text-sm text-destructive">Vaga indisponível para esta conta.</p><Button onClick={onBack}>Voltar às vagas</Button></div>

  return <div className="space-y-6 pb-10">
    <PageHeader title={`Editar ${row.codigo}`} description="Alterações persistidas no Supabase e limitadas à vaga atribuída à sua conta.">
      <Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Voltar</Button>
      <Button disabled={saving} onClick={save}><Save className="h-4 w-4" /> Salvar alterações</Button>
    </PageHeader>
    <Card><CardHeader><CardTitle>Dados da vaga</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="edit-title">Cargo *</Label><Input id="edit-title" value={form.title} onChange={(event) => set('title', event.target.value)} /></div>
      <div className="space-y-1.5"><Label>Empresa *</Label><Select value={form.companyId} onValueChange={(value) => set('companyId', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{companies.map((company) => <SelectItem key={company.id} value={String(company.id)}>{company.nome}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1.5"><Label htmlFor="edit-department">Departamento</Label><Input id="edit-department" value={form.department} onChange={(event) => set('department', event.target.value)} /></div>
      <LocationFields value={form} onChange={updateLocation} idPrefix="edit-vacancy" />
      <fieldset className="space-y-2 sm:col-span-2"><legend className="text-sm font-medium">Áreas *</legend><div className="flex flex-wrap gap-2">{areas.map((area) => <label key={area} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><input type="checkbox" checked={form.areas.includes(area)} onChange={() => set('areas', form.areas.includes(area) ? form.areas.filter((item) => item !== area) : [...form.areas, area])} />{area}</label>)}</div></fieldset>
      <div className="space-y-1.5"><Label>Modalidade</Label><Select value={form.model} onValueChange={(value) => set('model', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Presencial','Híbrido','Remoto'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1.5"><Label>Contrato</Label><Select value={form.type} onValueChange={(value) => set('type', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['CLT','PJ','CLT + Variável','Estágio','Temporário'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1.5"><Label htmlFor="edit-start">Início das inscrições *</Label><Input id="edit-start" type="date" value={form.applicationStart} onChange={(event) => set('applicationStart', event.target.value)} /></div>
      <div className="space-y-1.5"><Label htmlFor="edit-end">Fim das inscrições *</Label><Input id="edit-end" type="date" value={form.applicationEnd} onChange={(event) => set('applicationEnd', event.target.value)} /></div>
      <div className="space-y-1.5"><Label htmlFor="edit-min">Salário mínimo *</Label><Input id="edit-min" value={form.salaryMin} onChange={(event) => set('salaryMin', maskSalaryInput(event.target.value))} /></div>
      <div className="space-y-1.5"><Label htmlFor="edit-max">Salário máximo *</Label><Input id="edit-max" value={form.salaryMax} onChange={(event) => set('salaryMax', maskSalaryInput(event.target.value))} /></div>
      <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={(value) => set('status', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['rascunho','ativa','pausada','encerrada','cancelada'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1.5"><Label>Visibilidade</Label><Select value={form.visibility} onValueChange={(value) => set('visibility', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['publica','interna','sigilosa'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="edit-description">Descrição</Label><Textarea id="edit-description" value={form.description} onChange={(event) => set('description', event.target.value)} /></div>
      <div className="space-y-1.5"><Label htmlFor="edit-requirements">Requisitos (um por linha)</Label><Textarea id="edit-requirements" value={form.requirements} onChange={(event) => set('requirements', event.target.value)} rows={5} /></div>
      <div className="space-y-1.5"><Label htmlFor="edit-benefits">Benefícios (um por linha)</Label><Textarea id="edit-benefits" value={form.benefits} onChange={(event) => set('benefits', event.target.value)} rows={5} /></div>
      <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="edit-steps">Etapas iniciais (uma por linha)</Label><Textarea id="edit-steps" value={form.pipeline} onChange={(event) => set('pipeline', event.target.value)} rows={4} /></div>
      <p className="text-xs text-muted-foreground sm:col-span-2">Publicação original: {row.publicada_em ? new Date(row.publicada_em).toLocaleDateString('pt-BR') : 'ainda não publicada'}. Pausar ou reativar preserva esta data.</p>
    </CardContent></Card>
  </div>
}
