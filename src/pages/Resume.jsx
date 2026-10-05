import { useCallback, useEffect, useId, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Briefcase, GraduationCap, Wrench, Languages, Link2, Trophy, UserRound } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { formatSalary, maskSalaryInput } from '@/lib/inputMasks.js'
import { loadAreas, saveAreas } from '@/lib/candidateExtras.js'
import LocationFields from '@/components/LocationFields.jsx'
import { availabilityChoices, workPreferences, educationLevels, educationStatuses, skillLevels, languageLevels } from '@/lib/professionalOptions.js'

const sections = [
  { key: 'experiences', icon: Briefcase, title: 'Experiências Profissionais', add: 'Adicionar Experiência', label: (x) => `${x.role || 'Cargo'} · ${x.company || 'Empresa'}`, fields: [['role', 'Cargo'], ['company', 'Empresa'], ['modality', 'Modalidade', 'select', workPreferences.filter((x) => x !== 'Indiferente')], ['start', 'Início (mês/ano)', 'month'], ['end', 'Fim (mês/ano)', 'month'], ['description', 'Descrição', 'textarea'], ['skills', 'Habilidades (separadas por vírgula)']] },
  { key: 'education', icon: GraduationCap, title: 'Formação Acadêmica & Cursos', add: 'Adicionar Formação', label: (x) => `${x.degree || 'Curso'} · ${x.institution || 'Instituição'}`, fields: [['degree', 'Curso'], ['educationLevel', 'Grau / escolaridade', 'select', educationLevels], ['educationStatus', 'Situação', 'select', educationStatuses], ['periodNumber', 'Período atual', 'select', Array.from({ length: 12 }, (_, i) => String(i + 1))], ['institution', 'Instituição']] },
  { key: 'skills', icon: Wrench, title: 'Habilidades Técnicas', add: 'Adicionar Habilidade', label: (x) => `${x.name || 'Habilidade'} · ${x.level || ''}`, fields: [['name', 'Habilidade'], ['level', 'Nível', 'select', skillLevels]] },
  { key: 'languages', icon: Languages, title: 'Idiomas', add: 'Adicionar Idioma', label: (x) => `${x.name || 'Idioma'} · ${x.level || ''}`, fields: [['name', 'Idioma'], ['level', 'Nível', 'select', languageLevels]] },
  { key: 'portfolio', icon: Link2, title: 'Portfólio & Links', add: 'Adicionar Link', label: (x) => `${x.label || 'Link'} · ${x.url || ''}`, fields: [['label', 'Rótulo'], ['url', 'URL', 'url']] },
  { key: 'certificates', icon: Trophy, title: 'Conquistas & Certificados', add: 'Adicionar', label: (x) => `${x.title || 'Título'} · ${x.institution || ''}`, fields: [['title', 'Título'], ['institution', 'Instituição'], ['year', 'Ano'], ['description', 'Descrição', 'textarea']] },
]

function ItemEditor({ section, item, onCancel, onSave }) {
  const idPrefix = useId()
  const [draft, setDraft] = useState(() => ({ ...item, start: item.period?.start?.slice(0, 7) || '', end: item.period?.end === 'Presente' ? '' : item.period?.end?.slice(0, 7) || '', skills: Array.isArray(item.skills) ? item.skills.join(', ') : item.skills || '' }))
  const [saving, setSaving] = useState(false)
  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      if (section.key === 'experiences' && (!draft.start || (!draft.current && !draft.end))) throw new Error('Informe mês e ano de início e fim, ou marque emprego atual.')
      if (section.key === 'experiences' && draft.end && draft.end < draft.start) throw new Error('O fim não pode ser anterior ao início.')
      const value = section.key === 'experiences' ? { ...draft, period: { start: draft.start, end: draft.end }, skills: draft.skills.split(',').map((skill) => skill.trim()).filter(Boolean) } : draft
      await onSave(value)
      onCancel()
      toast.success('Item salvo no currículo.')
    } catch (error) { toast.error(error.message || 'Não foi possível salvar.') }
    finally { setSaving(false) }
  }
  return <form onSubmit={save} className="space-y-3 rounded-lg border bg-muted/20 p-4">
    <div className="grid gap-3 sm:grid-cols-2">{section.fields.filter(([key]) => !(section.key === 'experiences' && key === 'end' && draft.current)).map(([key, label, type, options]) => <div key={key} className="space-y-1.5"><Label htmlFor={`${idPrefix}-${key}`}>{label}</Label>{type === 'textarea' ? <Textarea id={`${idPrefix}-${key}`} value={draft[key] || ''} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} /> : type === 'select' ? <select id={`${idPrefix}-${key}`} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={draft[key] || ''} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}><option value="">Selecione</option>{draft[key] && !options.includes(String(draft[key])) && <option value={draft[key]}>Valor anterior: {draft[key]}</option>}{options.map((option) => <option key={option} value={option}>{key === 'periodNumber' ? `${option}º período` : option}</option>)}</select> : <Input id={`${idPrefix}-${key}`} type={type || 'text'} value={draft[key] || ''} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />}</div>)}</div>
    {section.key === 'education' && item.period && <p className="text-xs text-muted-foreground">Período histórico preservado: {item.period}</p>}
    {section.key === 'experiences' && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!draft.current} onChange={(e) => setDraft({ ...draft, current: e.target.checked })} />Emprego atual</label>}
    <div className="flex gap-2"><Button type="submit" size="sm" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button><Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancelar</Button></div>
  </form>
}

export default function Resume({ user, resume, onSaveItem, onDeleteItem, onSaveProfessional, onRefreshNotifications, onboardingSection = null, onDirtyChange }) {
  const [editing, setEditing] = useState(null)
  const [professional, setProfessional] = useState({ title: user.title || '', city: user.city || '', state: user.state || '', cityId: user.cityId || null, stateId: user.stateId || null, desiredSalary: formatSalary(user.desiredSalary), availabilityOptions: user.availabilityOptions || [], workPreference: user.workPreference || '', portfolioUrl: user.portfolioUrl || '' })
  const updateLocation = useCallback((patch) => { setProfessionalSaved(false); setProfessional((current) => ({ ...current, ...patch })) }, [])
  const [savingProfessional, setSavingProfessional] = useState(false)
  const [availableAreas, setAvailableAreas] = useState([])
  const [selectedAreas, setSelectedAreas] = useState([])
  const [savingAreas, setSavingAreas] = useState(false)
  const [professionalSaved, setProfessionalSaved] = useState(false)
  const [areasSaved, setAreasSaved] = useState(true)
  useEffect(() => {
    if (!onDirtyChange) return
    onDirtyChange(Boolean(editing) || (onboardingSection === 'professional' && !professionalSaved && JSON.stringify(professional) !== JSON.stringify({ title: user.title || '', city: user.city || '', state: user.state || '', cityId: user.cityId || null, stateId: user.stateId || null, desiredSalary: formatSalary(user.desiredSalary), availabilityOptions: user.availabilityOptions || [], workPreference: user.workPreference || '', portfolioUrl: user.portfolioUrl || '' })) || (onboardingSection === 'areas' && !areasSaved))
  }, [editing, professional, professionalSaved, areasSaved, selectedAreas, onboardingSection, onDirtyChange, user])
  useEffect(() => {
    loadAreas().then(({ areas, selectedIds }) => { setAvailableAreas(areas); setSelectedAreas(selectedIds) }).catch((error) => toast.error('Não foi possível carregar áreas: ' + error.message))
  }, [])
  const toggleArea = (id) => { setAreasSaved(false); setSelectedAreas((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]) }
  const persistAreas = async () => {
    setSavingAreas(true)
    try { await saveAreas(selectedAreas); setAreasSaved(true); toast.success('Áreas de interesse salvas.'); onRefreshNotifications?.().catch((error) => toast.error('Não foi possível atualizar mensagens: ' + error.message)) }
    catch (error) { toast.error(error.message || 'Não foi possível salvar as áreas.') }
    finally { setSavingAreas(false) }
  }
  const saveProfessional = async (event) => {
    event.preventDefault(); setSavingProfessional(true)
    try { await onSaveProfessional(professional); setProfessionalSaved(true); toast.success('Dados profissionais salvos.') }
    catch (error) { toast.error(error.message || 'Não foi possível salvar os dados profissionais.') }
    finally { setSavingProfessional(false) }
  }
  const remove = async (section, item) => {
    if (!window.confirm('Excluir este item do currículo?')) return
    try { await onDeleteItem(section, item.id); toast.success('Item excluído do currículo.') }
    catch (error) { toast.error(error.message || 'Não foi possível excluir.') }
  }
  return <div className="space-y-5">
    {!onboardingSection && <div><h1 className="font-poppins text-2xl font-semibold">Meu Currículo</h1><p className="text-sm text-muted-foreground">Suas informações profissionais para candidaturas.</p></div>}
    {(!onboardingSection || onboardingSection === 'professional') && <Card data-resume-section="professional" className="rounded-xl border bg-card p-5 shadow-sm"><h2 className="mb-4 flex items-center gap-3 font-poppins font-semibold"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><UserRound className="h-5 w-5" /></span>Dados profissionais</h2>
      <form onSubmit={saveProfessional} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="professional-title">Cargo atual</Label><Input id="professional-title" value={professional.title} onChange={(e) => { setProfessionalSaved(false); setProfessional({ ...professional, title: e.target.value }) }} /></div>
        <LocationFields value={professional} onChange={updateLocation} idPrefix="professional" />
        <div className="space-y-1.5"><Label htmlFor="professional-salary">Pretensão salarial</Label><Input id="professional-salary" inputMode="numeric" value={professional.desiredSalary} onChange={(e) => { setProfessionalSaved(false); setProfessional({ ...professional, desiredSalary: maskSalaryInput(e.target.value) }) }} placeholder="R$ 2.500,00" /></div>
        <div className="space-y-1.5"><Label htmlFor="professional-work">Preferência de trabalho</Label><select id="professional-work" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={professional.workPreference} onChange={(e) => { setProfessionalSaved(false); setProfessional({ ...professional, workPreference: e.target.value }) }}><option value="">Selecione</option>{professional.workPreference && !workPreferences.includes(professional.workPreference) && <option value={professional.workPreference}>Valor anterior: {professional.workPreference}</option>}{workPreferences.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>
        <div className="space-y-1.5"><Label htmlFor="professional-site">Site pessoal</Label><Input id="professional-site" type="url" value={professional.portfolioUrl} onChange={(e) => { setProfessionalSaved(false); setProfessional({ ...professional, portfolioUrl: e.target.value }) }} placeholder="https://exemplo.com" /></div>
      </div><fieldset className="space-y-2"><legend className="text-sm font-medium">Disponibilidade (selecione uma ou mais)</legend><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{availabilityChoices.map((option) => <label key={option} className="flex items-center gap-2 rounded-md border p-2 text-sm"><input type="checkbox" checked={professional.availabilityOptions.includes(option)} onChange={() => { setProfessionalSaved(false); setProfessional((current) => ({ ...current, availabilityOptions: current.availabilityOptions.includes(option) ? current.availabilityOptions.filter((item) => item !== option) : [...current.availabilityOptions, option] })) }} />{option}</label>)}</div></fieldset><Button type="submit" disabled={savingProfessional}>{savingProfessional ? 'Salvando...' : 'Salvar dados profissionais'}</Button></form>
    </Card>}
    {(!onboardingSection || onboardingSection === 'areas') && <Card data-resume-section="areas" className="rounded-xl border bg-card p-5 shadow-sm"><h2 className="mb-2 font-poppins font-semibold">Áreas de interesse</h2><p className="mb-4 text-sm text-muted-foreground">Selecione quantas áreas desejar.</p><div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{availableAreas.map((area) => <label key={area.id} className="flex items-center gap-2 rounded-lg border p-2 text-sm"><input type="checkbox" checked={selectedAreas.includes(area.id)} onChange={() => toggleArea(area.id)} />{area.nome}</label>)}</div><Button type="button" onClick={persistAreas} disabled={savingAreas}>{savingAreas ? 'Salvando...' : 'Salvar áreas'}</Button></Card>}
    <Accordion type="multiple" defaultValue={sections.map((s) => s.key)} className="space-y-3">{sections.filter((section) => !onboardingSection || section.key === onboardingSection).map((section) => <AccordionItem key={section.key} data-resume-section={section.key} value={section.key} className="rounded-xl border bg-card px-5 shadow-sm"><AccordionTrigger className="font-poppins font-semibold"><span className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><section.icon className="h-5 w-5" /></span>{section.title}</span></AccordionTrigger><AccordionContent className="space-y-3">
      <Button size="sm" variant="outline" onClick={() => setEditing({ section: section.key, id: 'new' })}><Plus className="mr-1 h-4 w-4" />{section.add}</Button>
      {editing?.section === section.key && editing.id === 'new' && <ItemEditor key={`${section.key}-new`} section={section} item={{}} onCancel={() => setEditing(null)} onSave={(item) => onSaveItem(section.key, item)} />}
      {(resume[section.key] || []).filter((item) => section.key !== 'portfolio' || !/linkedin/i.test(`${item.label || ''} ${item.url || ''}`)).map((item) => <div key={item.id} className="rounded-lg border p-3">
        {editing?.section === section.key && editing.id === item.id ? <ItemEditor key={`${section.key}-${item.id}`} section={section} item={item} onCancel={() => setEditing(null)} onSave={(value) => onSaveItem(section.key, value)} /> : <div className="flex items-center justify-between gap-3"><p className="min-w-0 truncate text-sm">{section.label(item)}</p><div className="flex shrink-0 gap-1"><Button size="sm" variant="ghost" onClick={() => setEditing({ section: section.key, id: item.id })}><Pencil className="mr-1 h-3.5 w-3.5" />Editar</Button><Button size="sm" variant="ghost" onClick={() => remove(section.key, item)}><Trash2 className="mr-1 h-3.5 w-3.5" />Excluir</Button></div></div>}
      </div>)}
    </AccordionContent></AccordionItem>)}</Accordion>
  </div>
}
