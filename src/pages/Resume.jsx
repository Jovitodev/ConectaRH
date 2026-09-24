import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Briefcase, GraduationCap, Wrench, Languages, Link2, Trophy, UserRound } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { formatSalary, maskSalaryInput } from '@/lib/inputMasks.js'

const sections = [
  { key: 'experiences', icon: Briefcase, title: 'Experiências Profissionais', add: 'Adicionar Experiência', label: (x) => `${x.role || 'Cargo'} · ${x.company || 'Empresa'}`, fields: [['role', 'Cargo'], ['company', 'Empresa'], ['modality', 'Modalidade'], ['start', 'Início', 'date'], ['end', 'Fim', 'date'], ['description', 'Descrição', 'textarea'], ['skills', 'Habilidades (separadas por vírgula)']] },
  { key: 'education', icon: GraduationCap, title: 'Formação Acadêmica & Cursos', add: 'Adicionar Formação', label: (x) => `${x.degree || 'Curso'} · ${x.institution || 'Instituição'}`, fields: [['degree', 'Curso / Grau'], ['institution', 'Instituição'], ['period', 'Período']] },
  { key: 'skills', icon: Wrench, title: 'Habilidades Técnicas', add: 'Adicionar Habilidade', label: (x) => `${x.name || 'Habilidade'} · ${x.level || ''}`, fields: [['name', 'Habilidade'], ['level', 'Nível']] },
  { key: 'languages', icon: Languages, title: 'Idiomas', add: 'Adicionar Idioma', label: (x) => `${x.name || 'Idioma'} · ${x.level || ''}`, fields: [['name', 'Idioma'], ['level', 'Nível']] },
  { key: 'portfolio', icon: Link2, title: 'Portfólio & Links', add: 'Adicionar Link', label: (x) => `${x.label || 'Link'} · ${x.url || ''}`, fields: [['label', 'Rótulo'], ['url', 'URL', 'url']] },
  { key: 'certificates', icon: Trophy, title: 'Conquistas & Certificados', add: 'Adicionar', label: (x) => `${x.title || 'Título'} · ${x.institution || ''}`, fields: [['title', 'Título'], ['institution', 'Instituição'], ['year', 'Ano'], ['description', 'Descrição', 'textarea']] },
]

function ItemEditor({ section, item, onCancel, onSave }) {
  const [draft, setDraft] = useState(() => ({ ...item, start: item.period?.start || '', end: item.period?.end === 'Presente' ? '' : item.period?.end || '', skills: Array.isArray(item.skills) ? item.skills.join(', ') : item.skills || '' }))
  const [saving, setSaving] = useState(false)
  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const value = section.key === 'experiences' ? { ...draft, period: { start: draft.start, end: draft.end }, skills: draft.skills.split(',').map((skill) => skill.trim()).filter(Boolean) } : draft
      await onSave(value)
      onCancel()
      toast.success('Item salvo no currículo.')
    } catch (error) { toast.error(error.message || 'Não foi possível salvar.') }
    finally { setSaving(false) }
  }
  return <form onSubmit={save} className="space-y-3 rounded-lg border bg-muted/20 p-4">
    <div className="grid gap-3 sm:grid-cols-2">{section.fields.map(([key, label, type]) => <div key={key} className="space-y-1.5"><Label>{label}</Label>{type === 'textarea' ? <Textarea value={draft[key] || ''} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} /> : <Input type={type || 'text'} value={draft[key] || ''} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />}</div>)}</div>
    {section.key === 'experiences' && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!draft.current} onChange={(e) => setDraft({ ...draft, current: e.target.checked })} />Emprego atual</label>}
    <div className="flex gap-2"><Button type="submit" size="sm" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button><Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancelar</Button></div>
  </form>
}

export default function Resume({ user, resume, onSaveItem, onDeleteItem, onSaveProfessional }) {
  const [editing, setEditing] = useState(null)
  const [professional, setProfessional] = useState({ title: user.title || '', city: user.city || '', state: user.state || '', desiredSalary: formatSalary(user.desiredSalary), availability: user.availability || '', workPreference: user.workPreference || '', portfolioUrl: user.portfolioUrl || '' })
  const [savingProfessional, setSavingProfessional] = useState(false)
  const saveProfessional = async (event) => {
    event.preventDefault(); setSavingProfessional(true)
    try { await onSaveProfessional(professional); toast.success('Dados profissionais salvos.') }
    catch (error) { toast.error(error.message || 'Não foi possível salvar os dados profissionais.') }
    finally { setSavingProfessional(false) }
  }
  const remove = async (section, item) => {
    if (!window.confirm('Excluir este item do currículo?')) return
    try { await onDeleteItem(section, item.id); toast.success('Item excluído do currículo.') }
    catch (error) { toast.error(error.message || 'Não foi possível excluir.') }
  }
  return <div className="space-y-5">
    <div><h1 className="font-poppins text-2xl font-semibold">Meu Currículo</h1><p className="text-sm text-muted-foreground">Suas informações profissionais para candidaturas.</p></div>
    <Card className="rounded-xl border bg-card p-5 shadow-sm"><h2 className="mb-4 flex items-center gap-3 font-poppins font-semibold"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><UserRound className="h-5 w-5" /></span>Dados profissionais</h2>
      <form onSubmit={saveProfessional} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2">
        {[["title", "Título profissional"], ["city", "Cidade"], ["state", "Estado"], ["desiredSalary", "Pretensão salarial"], ["availability", "Disponibilidade"], ["workPreference", "Preferência de trabalho"], ["portfolioUrl", "Site pessoal"]].map(([key, label]) => <div key={key} className="space-y-1.5"><Label htmlFor={`professional-${key}`}>{label}</Label><Input id={`professional-${key}`} inputMode={key === 'desiredSalary' ? 'numeric' : undefined} value={professional[key]} onChange={(e) => setProfessional({ ...professional, [key]: key === 'desiredSalary' ? maskSalaryInput(e.target.value) : e.target.value })} /></div>)}
      </div><Button type="submit" disabled={savingProfessional}>{savingProfessional ? 'Salvando...' : 'Salvar dados profissionais'}</Button></form>
    </Card>
    <Accordion type="multiple" defaultValue={sections.map((s) => s.key)} className="space-y-3">{sections.map((section) => <AccordionItem key={section.key} value={section.key} className="rounded-xl border bg-card px-5 shadow-sm"><AccordionTrigger className="font-poppins font-semibold"><span className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><section.icon className="h-5 w-5" /></span>{section.title}</span></AccordionTrigger><AccordionContent className="space-y-3">
      <Button size="sm" variant="outline" onClick={() => setEditing({ section: section.key, id: 'new' })}><Plus className="mr-1 h-4 w-4" />{section.add}</Button>
      {editing?.section === section.key && editing.id === 'new' && <ItemEditor key={`${section.key}-new`} section={section} item={{}} onCancel={() => setEditing(null)} onSave={(item) => onSaveItem(section.key, item)} />}
      {(resume[section.key] || []).filter((item) => section.key !== 'portfolio' || !/linkedin/i.test(`${item.label || ''} ${item.url || ''}`)).map((item) => <div key={item.id} className="rounded-lg border p-3">
        {editing?.section === section.key && editing.id === item.id ? <ItemEditor key={`${section.key}-${item.id}`} section={section} item={item} onCancel={() => setEditing(null)} onSave={(value) => onSaveItem(section.key, value)} /> : <div className="flex items-center justify-between gap-3"><p className="min-w-0 truncate text-sm">{section.label(item)}</p><div className="flex shrink-0 gap-1"><Button size="sm" variant="ghost" onClick={() => setEditing({ section: section.key, id: item.id })}><Pencil className="mr-1 h-3.5 w-3.5" />Editar</Button><Button size="sm" variant="ghost" onClick={() => remove(section.key, item)}><Trash2 className="mr-1 h-3.5 w-3.5" />Excluir</Button></div></div>}
      </div>)}
    </AccordionContent></AccordionItem>)}</Accordion>
  </div>
}
