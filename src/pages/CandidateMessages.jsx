import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function CandidateMessages({ items, onMarkRead }) {
  const unread = items.filter((item) => !item.lida)
  const mark = async (ids) => {
    try { await onMarkRead(ids) } catch (error) { toast.error(error.message || 'Não foi possível atualizar as mensagens.') }
  }
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-poppins text-2xl font-semibold">Central de Mensagens</h1><p className="text-sm text-muted-foreground">Histórico de notificações da sua conta.</p></div><Button variant="outline" disabled={!unread.length} onClick={() => mark(unread.map((item) => item.id))}>Marcar todas como lidas</Button></div>
    {!items.length && <Card className="p-8 text-center text-sm text-muted-foreground">Nenhuma mensagem recebida até agora.</Card>}
    {items.map((item) => <Card key={item.id} className={`space-y-2 p-5 ${item.lida ? '' : 'border-primary/40'}`}><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-poppins font-semibold">{item.titulo}</p><p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString('pt-BR')} · {item.tipo}</p></div><span className="text-xs text-muted-foreground">{item.lida ? 'Lida' : 'Não lida'}</span></div><p className="text-sm">{item.mensagem}</p>{!item.lida && <Button size="sm" variant="outline" onClick={() => mark([item.id])}>Marcar como lida</Button>}</Card>)}
  </div>
}
