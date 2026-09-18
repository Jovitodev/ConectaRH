import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Copy, Wand2, Search, FileStack, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { PageHeader, SectionHeader, EmptyState } from '@/components/admin-ui.jsx'
import { jobTemplates } from '@/data/adminData.js'

const departments = ['Saúde', 'Finanças', 'Comercial', 'Marketing', 'Logística', 'Tecnologia', 'Administrativo']

export default function Templates({ onNavigate }) {
  const [templates, setTemplates] = useState(jobTemplates)
  const [query, setQuery] = useState('')
  const [deptFilter, setDeptFilter] = useState('todos')
  const [editing, setEditing] = useState(null)
  const [isCreate, setIsCreate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [form, setForm] = useState({ name: '', department: 'Saúde', description: '', steps: ['Triagem de Currículo', 'Entrevista com Gestor'] })

  const filtered = templates.filter((t) => {
    const matchQuery = !query || t.name.toLowerCase().includes(query.toLowerCase()) || t.department.toLowerCase().includes(query.toLowerCase())
    const matchDept = deptFilter === 'todos' || t.department === deptFilter
    return matchQuery && matchDept
  })

  const openCreate = () => {
    setIsCreate(true)
    setEditing(null)
    setForm({ name: '', department: 'Saúde', description: '', steps: ['Triagem de Currículo', 'Entrevista com Gestor'] })
  }

  const openEdit = (tpl) => {
    setIsCreate(false)
    setEditing(tpl)
    setForm({ name: tpl.name, department: tpl.department, description: tpl.description, steps: [...tpl.steps] })
  }

  const save = () => {
    if (!form.name.trim()) {
      toast.error('Informe o nome do template.')
      return
    }
    if (editing) {
      setTemplates((ts) => ts.map((t) => (t.id === editing.id ? { ...t, ...form, usageCount: t.usageCount, lastUsed: t.lastUsed, color: t.color } : t)))
      toast.success('Template atualizado!', { description: form.name })
    } else {
      setTemplates((ts) => [
        { id: `tpl-${Date.now()}`, ...form, usageCount: 0, lastUsed: null, status: 'ativo', color: 'bg-sky-50 text-sky-800 border-sky-200' },
        ...ts,
      ])
      toast.success('Template criado!', { description: form.name })
    }
    setEditing(null)
  }

  const useTemplate = (tpl) => {
    toast.success(`Template "${tpl.name}" aplicado`, { description: 'Pipeline carregado na nova vaga.' })
    onNavigate('vacancy-create')
  }

  const setStep = (i, v) => setForm((f) => ({ ...f, steps: f.steps.map((s, j) => (j === i ? v : s)) }))
  const addStep = () => setForm((f) => ({ ...f, steps: [...f.steps, ''] }))
  const rmStep = (i) => setForm((f) => ({ ...f, steps: f.steps.filter((_, j) => j !== i) }))

  const topUsed = [...templates].sort((a, b) => b.usageCount - a.usageCount).slice(0, 4)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Templates de Vagas"
        description="Modelos reutilizáveis de pipeline para agilizar a criação de vagas."
      >
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Novo Template
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar template..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Departamento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <SectionHeader
          title="Mais Utilizados"
          description="Templates com maior uso nas vagas."
          className="mb-3"
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {topUsed.map((t) => (
            <Card key={t.id} className="cursor-pointer transition-colors hover:border-primary/40" onClick={() => openEdit(t)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={t.color}>{t.department}</Badge>
                  <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" /> {t.usageCount} usos
                  </span>
                </div>
                <p className="mt-3 font-poppins text-sm font-semibold">{t.name}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.steps.slice(0, 3).map((s, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{s}</Badge>
                  ))}
                  {t.steps.length > 3 && <Badge variant="outline" className="text-[10px]">+{t.steps.length - 3}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <SectionHeader title="Todos os Templates" description={`${templates.length} modelos cadastrados.`} className="mb-3" />
        {filtered.length === 0 ? (
          <EmptyState
            icon={FileStack}
            title="Nenhum template encontrado"
            description="Crie um novo template para padronizar seus pipelines."
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Novo Template
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((t) => (
              <Card key={t.id}>
                <CardContent className="flex flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="secondary" className={t.color}>{t.department}</Badge>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)} aria-label="Editar template">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(t)} aria-label="Excluir template">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-3 font-poppins text-sm font-semibold">{t.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {t.steps.map((s, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t pt-3">
                    <span className="text-xs text-muted-foreground">
                      {t.usageCount} usos · {t.lastUsed ? `último em ${t.lastUsed}` : 'nunca usado'}
                    </span>
                    <Button size="sm" onClick={() => useTemplate(t)}>
                      <Wand2 className="h-3.5 w-3.5" /> Utilizar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal criar/editar */}
      <Dialog open={!!editing || isCreate} onOpenChange={(o) => { if (!o) { setEditing(null); setIsCreate(false) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isCreate ? 'Novo Template de Vaga' : 'Editar Template'}</DialogTitle>
            <DialogDescription>Defina o nome, departamento e etapas do pipeline.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="t-name">Nome do template *</Label>
              <Input id="t-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex.: Enfermagem Hospitalar" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="t-dept">Departamento</Label>
                <Select value={form.department} onValueChange={(v) => setForm((f) => ({ ...f, department: v }))}>
                  <SelectTrigger id="t-dept"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Etapas ({form.steps.length})</Label>
                <Button type="button" variant="outline" size="sm" className="w-full" onClick={addStep}>
                  <Plus className="h-3.5 w-3.5" /> Adicionar etapa
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-desc">Descrição</Label>
              <Textarea id="t-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Para quais cargos este template é ideal?" />
            </div>
            <div className="space-y-2">
              {form.steps.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Badge variant="secondary" className="h-7 w-7 justify-center rounded-full p-0">{i + 1}</Badge>
                  <Input value={s} onChange={(e) => setStep(i, e.target.value)} placeholder={`Etapa ${i + 1}`} />
                  <Button variant="ghost" size="icon" onClick={() => rmStep(i)} disabled={form.steps.length === 1} aria-label="Remover etapa">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditing(null); setIsCreate(false) }}>Cancelar</Button>
            <Button onClick={save}><Copy className="h-4 w-4" /> Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription>
              O template "{confirmDelete?.name}" será excluído permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setTemplates((ts) => ts.filter((t) => t.id !== confirmDelete.id))
                toast.success('Template excluído!')
                setConfirmDelete(null)
              }}
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
