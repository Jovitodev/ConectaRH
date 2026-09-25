import { passwordRules } from '@/lib/passwordRules.js'

export function PasswordRequirements({ password }) {
  return <div className="mt-3 space-y-1 text-xs" aria-live="polite"><p className="font-medium">Requisitos da senha:</p>{passwordRules.map(([label, check]) => <p key={label} className={check(password) ? 'text-emerald-600' : 'text-muted-foreground'}>{check(password) ? '✓' : '✗'} {label}</p>)}</div>
}
