import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'

const icons = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  info: <Info className="h-5 w-5 text-primary" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
}

export default function Toast({ toasts }) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 shadow-soft"
        >
          {icons[t.type] || icons.info}
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{t.title}</p>
            <p className="text-xs text-muted-foreground">{t.message}</p>
          </div>
          <button className="text-muted-foreground hover:text-foreground" aria-label="Fechar toast">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
