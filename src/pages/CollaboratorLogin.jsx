import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInCollaborator, requestPasswordReset } from '@/lib/authStore.js'

export default function CollaboratorLogin({ onAuthenticated, onCandidateLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [recovery, setRecovery] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      if (recovery) { await requestPasswordReset(email, '/colaborador/login'); setMessage('Se a conta existir, as instruções serão enviadas por e-mail.') }
      else onAuthenticated(await signInCollaborator(email, password))
    } catch (cause) { setError(cause.message || 'Não foi possível entrar.') }
    finally { setBusy(false) }
  }
  return <div className="flex min-h-screen items-center justify-center bg-background p-4"><Card className="w-full max-w-md space-y-5 p-7"><div><p className="font-poppins text-xl font-bold">Conecta<span className="text-primary">RH</span></p><p className="text-xs text-muted-foreground">By Serhum Consultoria</p></div><div><h1 className="font-poppins text-2xl font-semibold">{recovery ? 'Recuperar senha' : 'Login do Colaborador'}</h1><p className="text-sm text-muted-foreground">Acesso à área administrativa.</p></div><form onSubmit={submit} className="space-y-4"><div className="space-y-1.5"><Label htmlFor="collaborator-email">E-mail</Label><Input id="collaborator-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>{!recovery && <div className="space-y-1.5"><Label htmlFor="collaborator-password">Senha</Label><Input id="collaborator-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{message && <p className="text-sm text-emerald-600">{message}</p>}<Button className="w-full" disabled={busy}>{busy ? 'Aguarde...' : recovery ? 'Enviar instruções' : 'Entrar'}</Button></form><div className="flex justify-between text-xs"><button className="text-primary hover:underline" onClick={() => { setRecovery(!recovery); setError('') }}>{recovery ? 'Voltar ao login' : 'Esqueceu a senha?'}</button><button className="text-primary hover:underline" onClick={onCandidateLogin}>Login do Candidato</button></div></Card></div>
}
