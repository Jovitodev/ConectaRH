import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Mail, Shield, Search, UserCog, ShieldAlert, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageHeader, SectionHeader } from '@/components/admin-ui.jsx'
import { teamMembers } from '@/data/adminData.js'

const roleMeta = {
  Administradora: { variant: 'finance', icon: Shield },
  Administrador: { variant: 'finance', icon: Shield },
  Recrutador: { variant: 'info', icon: UserCog },
  Recrutadora: { variant: 'info', icon: UserCog },
  Gestora: { variant: 'success', icon: ShieldAlert },
  Gestor: { variant: 'success', icon: ShieldAlert },
}

const roleGroups = [
  { title: 'Administradores', desc: 'Acesso total, inclui configurações e usuários.', filter: (r) => r.startsWith('Admin'), color: 'text-indigo-700 bg-indigo-50' },
  { title: 'Recrutadores', desc: 'Gestão de vagas, candidatos e agenda.', filter: (r) => r.startsWith('Recrut'), color: 'text-sky-700 bg-sky-50' },
  { title: 'Gestores', desc: 'Acesso às vagas e candidatos do seu departamento.', filter: (r) => r.startsWith('Gest'), color: 'text-emerald-700 bg-emerald-50' },
]

export default function Team() {
  const [members, setMembers] = useState(teamMembers)
  const [query, setQuery] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: 'Recrutador', department: 'Recrutamento e Seleção' })

  const filtered = members.filter(
    (m) => !query || m.name.toLowerCase().includes(query.toLowerCase()) || m.email.toLowerCase().includes(query.toLowerCase()),
  )

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setRaw = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const invite = () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Informe nome e e-mail do convidado.')
      return
    }
    setMembers((prev) => [
      {
        id: `team-${Date.now()}`,
        name: form.name,
        email: form.email,
        role: form.role,
        department: form.department,
        status: 'pendente',
        lastAccess: '—',
        color: 'bg-slate-100 text-slate-600',
      },
      ...prev,
    ])
    setInviteOpen(false)
    setForm({ name: '', email: '', role: 'Recrutador', department: 'Recrutamento e Seleção' })
    toast.success('Convite enviado!', { description: `Um e-mail de ativação foi enviado para ${form.email}.` })
  }

  const toggleStatus = (m) => {
    setMembers((prev) =>
      prev.map((x) =>
        x.id === m.id
          ? { ...x, status: x.status === 'ativo' ? 'inativo' : 'ativo' }
          : x,
      ),
    )
    toast.success('Status atualizado', { description: m.name })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipe e Níveis de Acesso"
        description="Gerencie usuários internos e suas permissões."
      >
        <Button onClick={() => setInviteOpen(true)}>
          <Plus className="h-4 w-4" /> Convidar membro
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou e-mail..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
        </div>
        <Badge variant="secondary">{members.filter((m) => m.status === 'ativo').length} ativos</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {roleGroups.map((group) => {
          const groupMembers = filtered.filter((m) => group.filter(m.role))
          return (
            <div key={group.title}>
              <SectionHeader
                title={group.title}
                description={group.desc}
                action={<span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${group.color}`}>{groupMembers.length}</span>}
                className="mb-3"
              />
              <Card>
                <CardContent className="space-y-2 p-3">
                  {groupMembers.length === 0 && (
                    <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                      Nenhum membro neste perfil.
                    </p>
                  )}
                  {groupMembers.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${m.color}`}>
                        {m.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                          {m.name}
                          {m.status === 'pendente' && <Badge variant="warning">Pendente</Badge>}
                          {m.status === 'inativo' && <Badge variant="outline">Inativo</Badge>}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{m.email} · {m.department}</p>
                        <p className="text-[11px] text-muted-foreground">Último acesso: {m.lastAccess}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Ações">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => toast.success('E-mail enviado', { description: m.email })}>
                            <Mail /> Enviar e-mail
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.success('Permissões editadas', { description: m.name })}>
                            <UserCog /> Editar permissões
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleStatus(m)}>
                            {m.status === 'ativo' ? 'Desativar acesso' : 'Reativar acesso'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>

      {/* Modal convite */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar Membro</DialogTitle>
            <DialogDescription>Envie um convite por e-mail com o nível de acesso desejado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="inv-name">Nome completo</Label>
              <Input id="inv-name" value={form.name} onChange={set('name')} placeholder="Nome do membro" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-email">E-mail corporativo</Label>
              <Input id="inv-email" type="email" value={form.email} onChange={set('email')} placeholder="nome@conectarh.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="inv-role">Perfil de acesso</Label>
                <Select value={form.role} onValueChange={(v) => setRaw('role', v)}>
                  <SelectTrigger id="inv-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                    <SelectItem value="Recrutador">Recrutador</SelectItem>
                    <SelectItem value="Gestor">Gestor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inv-dept">Departamento</Label>
                <Input id="inv-dept" value={form.department} onChange={set('department')} />
              </div>
            </div>
            <div className="rounded-lg border p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Sobre os acessos:</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                <li>Administradores: acesso total ao sistema.</li>
                <li>Recrutadores: vagas, candidatos e agenda.</li>
                <li>Gestores: apenas vagas e candidatos do seu departamento.</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancelar</Button>
            <Button onClick={invite}>
              <Mail className="h-4 w-4" /> Enviar convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
