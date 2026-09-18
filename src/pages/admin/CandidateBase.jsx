import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Search,
  MoreHorizontal,
  UserCog,
  Ban,
  ShieldAlert,
  Eye,
  Mail,
  FileText,
  UserCheck,
  KeyRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { PageHeader, SectionHeader, StatusBadge, AvatarInitials } from '@/components/admin-ui.jsx'
import { adminCandidates, candidateStatusMeta } from '@/data/adminData.js'
import { DataTable } from '@/components/ui/data-table'

const PAGE_SIZE = 5

const statusMeta = candidateStatusMeta

export default function CandidateBase({ onNavigate }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState(null)
  const [manageOpen, setManageOpen] = useState(false)
  const [anonymizeTarget, setAnonymizeTarget] = useState(null)
  const [accountStatus, setAccountStatus] = useState('ativo')

  const filtered = useMemo(() => {
    return adminCandidates.filter((c) => {
      const q = query.trim().toLowerCase()
      const matchQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.cpf.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        c.city.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'todos' || c.status === statusFilter
      return matchQuery && matchStatus
    })
  }, [query, statusFilter])

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE)
  const pageData = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  const openManage = (cand) => {
    setSelected(cand)
    setAccountStatus(cand.status)
    setManageOpen(true)
  }

  const saveAccount = () => {
    toast.success('Conta atualizada', { description: `${selected.name} — status: ${statusMeta[accountStatus].label}` })
    setManageOpen(false)
  }

  const resetPassword = () => {
    toast.success('Senha redefinida', { description: `Link de redefinição enviado para ${selected.email}.` })
  }

  const anonymize = (cand) => {
    setAnonymizeTarget(cand)
  }

  const confirmAnonymize = () => {
    toast.warning('Anonimização LGPD solicitada', {
      description: `Os dados pessoais de ${anonymizeTarget.name} serão anonimizados em 30 dias.`,
    })
    setAnonymizeTarget(null)
  }

  const columns = useMemo(
    () => [
      {
        header: 'Candidato',
        accessorKey: 'name',
        cell: ({ row }) => {
          const c = row.original
          return (
            <div className="flex items-center gap-3">
              <AvatarInitials name={c.name} />
              <div className="min-w-0">
                <p className="font-medium">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">{c.email}</p>
              </div>
            </div>
          )
        },
      },
      {
        header: 'CPF',
        accessorKey: 'cpf',
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.cpf}</span>,
      },
      {
        header: 'Origem',
        accessorKey: 'source',
        cell: ({ row }) => <Badge variant="secondary">{row.original.source}</Badge>,
      },
      {
        header: 'Match',
        accessorKey: 'score',
        cell: ({ row }) => {
          const score = row.original.score
          return (
            <div className="flex items-center gap-2">
              <Progress value={score} className="w-16" indicatorClassName={score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-slate-500'} />
              <span className="text-sm font-medium">{score}%</span>
            </div>
          )
        },
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => <StatusBadge meta={statusMeta[row.original.status]} />,
      },
      {
        header: 'Etapa',
        accessorKey: 'stage',
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.stage}</span>,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const c = row.original
          return (
            <div className="flex items-center justify-end gap-1">
              <Button variant="ghost" size="icon" onClick={() => onNavigate('candidate-detail')} aria-label="Ver perfil">
                <Eye className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Ações rápidas">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => onNavigate('candidate-detail')}>
                    <FileText /> Ver perfil completo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openManage(c)}>
                    <UserCog /> Gerenciar conta
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.success('E-mail enviado', { description: `Contato iniciado com ${c.name}.` })}>
                    <Mail /> Enviar e-mail
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => anonymize(c)}>
                    <ShieldAlert /> Anonimizar (LGPD)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [onNavigate],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Base Geral de Candidatos"
        description={`${adminCandidates.length} candidatos registrados na base.`}
      >
        <Button variant="outline" onClick={() => toast.success('Exportação iniciada', { description: 'O CSV será enviado por e-mail.' })}>
          <FileText className="h-4 w-4" /> Exportar base
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail, CPF..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0) }}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0) }}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(statusMeta).map(([k, m]) => (
              <SelectItem key={k} value={k}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="rounded-xl border">
        <DataTable columns={columns} data={pageData} emptyMessage="Nenhum candidato encontrado." />
        <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando <span className="font-medium text-foreground">{pageData.length}</span> de{' '}
            <span className="font-medium text-foreground">{filtered.length}</span> candidatos
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page + 1} de {Math.max(1, pageCount)}
            </span>
            <Button variant="outline" size="sm" disabled={page >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}>
              Próxima
            </Button>
          </div>
        </div>
      </Card>

      <SectionHeader title="Resumo da Base" description="Distribuição por status." className="mb-3" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Object.entries(statusMeta).map(([k, m]) => {
          const count = adminCandidates.filter((c) => c.status === k).length
          return (
            <div key={k} className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="text-sm text-muted-foreground">{m.label}</p>
                <p className="font-poppins text-2xl font-semibold">{count}</p>
              </div>
              <Badge variant={m.variant}>{Math.round((count / adminCandidates.length) * 100)}%</Badge>
            </div>
          )
        })}
      </div>

      {/* Modal gerenciar conta */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Conta do Candidato</DialogTitle>
            <DialogDescription>Altere o status da conta, redefina a senha ou gerencie privacidade.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                    {selected.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium">{selected.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{selected.email} · {selected.cpf}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="acc-status">Status da conta</Label>
                <Select value={accountStatus} onValueChange={setAccountStatus}>
                  <SelectTrigger id="acc-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo"><span className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-emerald-500" /> Ativo</span></SelectItem>
                    <SelectItem value="suspenso"><span className="flex items-center gap-2"><Ban className="h-4 w-4 text-amber-500" /> Suspenso</span></SelectItem>
                    <SelectItem value="cancelado"><span className="flex items-center gap-2"><Ban className="h-4 w-4 text-destructive" /> Cancelado</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" className="w-full" onClick={resetPassword}>
                <KeyRound className="h-4 w-4" /> Redefinir senha
              </Button>

              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                <p className="text-sm font-medium text-destructive">Anonimização LGPD</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Remove todos os dados pessoais do candidato da base, mantendo apenas registros estatísticos anonimizados.
                </p>
                <Button variant="destructive" size="sm" className="mt-3 w-full" onClick={() => { setManageOpen(false); anonymize(selected) }}>
                  <ShieldAlert className="h-4 w-4" /> Solicitar anonimização
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageOpen(false)}>Cancelar</Button>
            <Button onClick={saveAccount}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar anonimização */}
      <AlertDialog open={!!anonymizeTarget} onOpenChange={(o) => { if (!o) setAnonymizeTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar anonimização LGPD?</AlertDialogTitle>
            <AlertDialogDescription>
              Os dados pessoais de <span className="font-medium text-foreground">{anonymizeTarget?.name}</span> serão
              irreversivelmente anonimizados. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmAnonymize}>
              <ShieldAlert className="h-4 w-4" /> Confirmar anonimização
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
