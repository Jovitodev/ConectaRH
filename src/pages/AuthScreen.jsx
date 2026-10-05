import { useState } from 'react'
import { toast } from 'sonner'
import { Mail, Lock, Eye, EyeOff, CheckCircle2, User, ArrowLeft, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { signIn, signUpCandidate, requestPasswordReset } from '@/lib/authStore.js'
import { PasswordRequirements } from '@/components/PasswordRequirements.jsx'
import { validatePassword } from '@/lib/passwordRules.js'

function Logo({ size = 'lg' }) {
  return <div className="flex items-center gap-3"><div className={`flex items-center justify-center rounded-xl bg-primary font-poppins font-bold text-primary-foreground ${size === 'lg' ? 'h-14 w-14 text-2xl' : 'h-9 w-9 text-base'}`}>C</div><div><p className={`font-poppins font-bold ${size === 'lg' ? 'text-3xl' : 'text-base'}`}>Conecta<span className="text-primary">RH</span></p><p className={`uppercase tracking-[0.25em] text-muted-foreground ${size === 'lg' ? 'text-[10px]' : 'text-[9px]'}`}>By Serhum Consultoria</p></div></div>
}

export default function AuthScreen({ onAuthenticated, initialMode = 'signin', onBack }) {
  const [mode, setMode] = useState(initialMode)
  const [recovery, setRecovery] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', remember: true, token: '' })
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [doneAccount, setDoneAccount] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const finish = (account) => { setDoneAccount(account); setDone(true); setTimeout(() => onAuthenticated(account), 500) }

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (recovery) {
        if (!form.email) throw new Error('Informe seu e-mail.')
        await requestPasswordReset(form.email)
        toast.success('Instruções enviadas', { description: 'Verifique seu e-mail para criar uma nova senha.' })
        setRecovery(false)
        return
      }
      if (!form.email || !form.password) throw new Error('Preencha e-mail e senha para continuar.')
      if (mode === 'signup') {
        if (!form.name || form.name.trim().length < 3) throw new Error('Informe seu nome completo.')
        validatePassword(form.password)
        if (form.password !== form.confirm) throw new Error('As senhas não coincidem.')
        if (!form.remember) throw new Error('Aceite o termo para criar sua conta.')
        const account = await signUpCandidate({ name: form.name.trim(), email: form.email, password: form.password })
        toast.success('Conta criada!', { description: 'Agora vamos completar seu perfil.' }); finish(account)
      } else {
        const account = await signIn(form.email, form.password)
        toast.success('Login realizado!', { description: account.account === 'colaborador' ? 'Bem-vindo(a) ao painel administrativo.' : 'Bem-vindo(a) de volta.' }); finish(account)
      }
    } catch (err) { setError(err.message || 'Não foi possível concluir a operação.') }
    finally { setLoading(false) }
  }

  const startRecovery = () => { setRecovery(true); setError('') }

  return <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-8"><div className="pointer-events-none fixed inset-0 overflow-hidden"><div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" /><div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" /></div><div className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-soft lg:grid-cols-5"><div className="relative hidden flex-col justify-between bg-gradient-to-br from-sky-50 via-card to-emerald-50/40 p-8 lg:col-span-2 lg:flex dark:from-primary/15 dark:via-card dark:to-background"><Logo /><div><h2 className="font-poppins text-3xl font-semibold leading-snug">Conectando talentos às <span className="text-primary">grandes oportunidades.</span></h2><p className="mt-4 text-sm leading-relaxed text-muted-foreground">Do cadastro de vagas à contratação: um ecossistema completo para candidatos e equipes de RH.</p></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-emerald-500" />Ambientes seguros · Dados protegidos · LGPD</div></div><div className="flex flex-col p-6 sm:p-10 lg:col-span-3"><div className="mb-6 lg:hidden"><Logo /></div>
    {recovery ? <>
      <button type="button" onClick={() => { setRecovery(false); setError('') }} className="mb-5 flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Voltar para o login</button>
      <div className="mb-6"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><KeyRound className="h-5 w-5" /></div><h2 className="font-poppins text-2xl font-semibold">Recuperar senha</h2><p className="mt-1 text-sm text-muted-foreground">Informe seu e-mail para receber as instruções.</p></div>
      <form onSubmit={submit} className="space-y-4"><div className="space-y-1.5"><Label htmlFor="recovery-email">E-mail</Label><Input id="recovery-email" type="email" value={form.email} onChange={set('email')} placeholder="email@exemplo.com" /></div>{error && <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}<Button type="submit" className="h-11 w-full" disabled={loading}>{loading ? 'Processando...' : 'Enviar instruções'}</Button></form>
    </> : <>
      {onBack && <button type="button" onClick={onBack} className="mb-4 flex items-center gap-2 text-sm text-primary"><ArrowLeft className="h-4 w-4" />Voltar às vagas</button>}
      <Tabs value={mode} onValueChange={(v) => { setMode(v); setError('') }} className="mb-6"><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="signin">Entrar</TabsTrigger><TabsTrigger value="signup">Criar Conta</TabsTrigger></TabsList></Tabs>
      {done ? <div className="flex flex-1 flex-col items-center justify-center py-16 text-center"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15"><CheckCircle2 className="h-8 w-8 text-emerald-500" /></div><h3 className="mt-4 font-poppins text-xl font-semibold">{doneAccount?.account === 'colaborador' ? 'Acesso administrativo!' : 'Conta pronta!'}</h3><p className="mt-1 text-sm text-muted-foreground">Redirecionando...</p></div> : <form onSubmit={submit} className="flex flex-1 flex-col">
        {mode === 'signup' && <div className="space-y-1.5"><Label htmlFor="auth-name">Nome completo</Label><div className="relative"><User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="auth-name" autoComplete="name" value={form.name} onChange={set('name')} placeholder="Seu nome" className="h-11 pl-9" /></div></div>}
        <div className="mt-3 space-y-1.5"><Label htmlFor="auth-email">E-mail</Label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="auth-email" autoComplete="email" type="email" value={form.email} onChange={set('email')} placeholder="email@exemplo.com" className="h-11 pl-9" /></div></div>
        <div className="mt-3 space-y-1.5"><div className="flex items-center justify-between"><Label htmlFor="auth-password">Senha</Label>{mode === 'signin' && <button type="button" onClick={startRecovery} className="text-xs font-medium text-primary hover:underline">Esqueceu?</button>}</div><div className="relative"><Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="auth-password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder={mode === 'signup' ? 'Mínimo de 8 caracteres' : 'Sua senha'} className="h-11 pl-9 pr-10" /><button type="button" onClick={() => setShowPass((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Alternar visibilidade da senha">{showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
        {mode === 'signup' && <><PasswordRequirements password={form.password} /><div className="mt-3 space-y-1.5"><Label htmlFor="auth-confirm">Confirmar senha</Label><Input id="auth-confirm" autoComplete="new-password" type={showPass ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} placeholder="Repita a senha" className="h-11" /></div><label className="mt-4 flex items-start gap-2 text-xs text-muted-foreground"><Checkbox checked={form.remember} onCheckedChange={(v) => setForm((f) => ({ ...f, remember: Boolean(v) }))} /><span>Concordo com os Termos de Uso e a Política de Privacidade.</span></label></>}
        {error && <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
        <Button type="submit" className="mt-5 h-11 w-full" disabled={loading}>{loading ? 'Processando...' : mode === 'signup' ? 'Criar minha conta' : 'Entrar'}</Button>
        {mode === 'signin' && <a className="mt-5 text-center text-xs font-medium text-primary hover:underline" href="/colaborador/login">Login do Colaborador</a>}
      </form>}
    </>}
  </div></div></div>
}
