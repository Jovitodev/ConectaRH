import { Button } from '@/components/ui/button'
import { PAGE_SIZE } from '@/lib/recruitmentWorkflow.js'

export const inputClass = 'h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
export function Field({ label, children }) { return <label className="block space-y-1.5 text-sm font-medium"><span>{label}</span>{children}</label> }
export function Pagination({ page, total, onChange, size = PAGE_SIZE }) {
  if (total <= size) return null
  return <div className="flex flex-wrap items-center justify-end gap-3 py-3 text-sm"><span className="text-muted-foreground">{page * size + 1}–{Math.min((page + 1) * size, total)} de {total}</span><Button variant="outline" size="sm" disabled={page === 0} onClick={() => onChange(page - 1)}>Anterior</Button><Button variant="outline" size="sm" disabled={(page + 1) * size >= total} onClick={() => onChange(page + 1)}>Próxima</Button></div>
}
export function QueryState({ loading, error, empty, children }) {
  if (loading) return <p role="status" className="rounded-xl border p-8 text-sm text-muted-foreground">Carregando dados...</p>
  if (error) return <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">{error}</p>
  if (empty) return <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum registro encontrado nesta seleção.</p>
  return children
}
