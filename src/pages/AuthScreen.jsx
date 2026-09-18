import { useState } from 'react'
import { toast } from 'sonner'
import { Mail, Lock, Eye, EyeOff, CheckCircle2, User, Building2, ShieldCheck, UserRound, Sparkles, ArrowLeft, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { authAccounts } from '@/data/adminData.js'
import { signIn, signUpCandidate, requestPasswordReset, resetPassword } from '@/lib/authStore.js'

function Logo({ size = 'lg' }) {
  return <div className="flex items-center gap-3"><div className={`flex items-center justify-center rounded-xl bg-primary font-poppins font-bold text-primary-foreground ${size === 'lg' ? 'h-14 w-14 text-2xl' : 'h-9 w-9 text-base'}`}>C</div><div><p className={`font-poppins font-bold ${size === 'lg' ? 'text-3xl' : 'text-base'}`}>Conecta<span className="text-primary">RH</span></p><p className={`uppercase tracking-[0.25em] text-muted-foreground ${size === 'lg' ? 'text-[10px]' : 'text-[9px]'}`}>By Serhum Consultoria</p></div></div>
}

function DemoLoginCard({ title, description, email, icon: Icon, accent, onFill }) {
  return <button type="button" onClick={onFill} className="group flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/40 hover:bg-accent/50"><span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent}`}><Icon className="h-5 w-5" /></span><span className="min-w-0"><span className="flex items-center gap-1.5 font-medium text-foreground">{title}<Sparkles className="h-3 w-3 text-amber-500" /></span><span className="mt-0.5 block text-xs text-muted-foreground">{description}</span><span className="mt-1 block font-mono text-[11px] text-primary">{email}</span></span></button>
}

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('signin')
  const [recovery, setRecovery] = useState(false)
  const [recoveryStep, setRecoveryStep] = useState('request')
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', remember: true, token: '' })
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [doneAccount, setDoneAccount] = useState(null)
  const [loading, setLoading] = useState(false)
  const [demoToken, setDemoToken] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const finish = (account) => { setDoneAccount(account); setDone(true); setTimeout(() => onAuthenticated(account), 500) }

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (recovery) {
        if (recoveryStep === 'request') {
          if (!form.email) throw new Error('Informe seu e-mail.')
          const result = await requestPasswordReset(form.email)
          setDemoToken(result.token || '')
          setRecoveryStep('reset')
          toast.success('Solicitação processada', { description: result.token ? 'No modo demonstração, o token foi exibido abaixo.' : 'Se o e-mail existir, as instruções serão enviadas.' })
        } else {
          if (!form.email || !form.token || form.password.length < 8) throw new Error('Informe e-mail, token e uma nova senha com pelo menos 8 caracteres.')
          if (form.password !== form.confirm) throw new Error('As senhas não coincidem.')
          await resetPassword(form.email, form.token, form.password)
          toast.success('Senha redefinida!', { description: 'Você já pode entrar com a nova senha.' })
          setRecovery(false); setRecoveryStep('request'); setForm((f) => ({ ...f, password: '', confirm: '', token: '' }))
        }
        return
      }
      if (!form.email || !form.password) throw new Error('Preencha e-mail e senha para continuar.')
      if (mode === 'signup') {
        if (!form.name || form.name.trim().length < 3) throw new Error('Informe seu nome completo.')
        if (form.password.length < 8) throw new Error('A senha deve ter pelo menos 8 caracteres.')
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

  const fill = (account) => { setForm((f) => ({ ...f, email: account.email, password: account.password })); setError(''); toast.info('Credenciais preenchidas', { description: 'Clique em “Entrar” para continuar.' }) }
  const startRecovery = () => { setRecovery(true); setRecoveryStep('request'); setError(''); setDemoToken('') }

  return <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-8"><div className="pointer-events-none fixed inset-0 overflow-hidden"><div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" /><div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" /></div><div className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-soft lg:grid-cols-5"><div className="relative hidden flex-col justify-between bg-gradient-to-br from-sky-50 via-card to-emerald-50/40 p-8 lg:col-span-2 lg:flex dark:from-primary/15 dark:via-card dark:to-background"><Logo /><div><h2 className="font-poppins text-3xl font-semibold leading-snug">Conectando talentos às <span className="text-primary">grandes oportunidades.</span></h2><p className="mt-4 text-sm leading-relaxed text-muted-foreground">Do cadastro de vagas à contratação: um ecossistema completo para candidatos e equipes de RH.</p></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-emerald-500" />Ambientes seguros · Dados protegidos · LGPD</div></div><div className="flex flex-col p-6 sm:p-10 lg:col-span-3"><div className="mb-6 lg:hidden"><Logo /></div>
    {recovery ? <>
      <button type="button" onClick={() => { setRecovery(false); setError('') }} className="mb-5 flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Voltar para o login</button>
      <div className="mb-6"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><KeyRound className="h-5 w-5" /></div><h2 className="font-poppins text-2xl font-semibold">{recoveryStep === 'request' ? 'Recuperar senha' : 'Criar nova senha'}</h2><p className="mt-1 text-sm text-muted-foreground">{recoveryStep === 'request' ? 'Informe seu e-mail para receber as instruções.' : 'Use o token recebido e defina uma nova senha.'}</p></div>
      <form onSubmit={submit} className="space-y-4"><div className="space-y-1.5"><Label htmlFor="recovery-email">E-mail</Label><Input id="recovery-email" type="email" value={form.email} onChange={set('email')} placeholder="email@exemplo.com" /></div>{recoveryStep === 'reset' && <><div className="space-y-1.5"><Label htmlFor="reset-token">Token de recuperação</Label><Input id="reset-token" inputMode="numeric" maxLength={6} value={form.token} onChange={set('token')} placeholder="000000" />{demoToken && <p className="text-xs text-amber-600">Modo demonstração — token: <strong>{demoToken}</strong></p>}</div><div className="space-y-1.5"><Label>Nova senha</Label><Input type="password" value={form.password} onChange={set('password')} placeholder="Mínimo de 8 caracteres" /></div><div className="space-y-1.5"><Label>Confirmar nova senha</Label><Input type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repita a nova senha" /></div></>}{error && <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}<Button type="submit" className="h-11 w-full" disabled={loading}>{loading ? 'Processando...' : recoveryStep === 'request' ? 'Enviar instruções' : 'Redefinir senha'}</Button></form>
    </> : <>
      <Tabs value={mode} onValueChange={(v) => { setMode(v); setError('') }} className="mb-6"><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="signin">Entrar</TabsTrigger><TabsTrigger value="signup">Criar Conta</TabsTrigger></TabsList></Tabs>
      {done ? <div className="flex flex-1 flex-col items-center justify-center py-16 text-center"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15"><CheckCircle2 className="h-8 w-8 text-emerald-500" /></div><h3 className="mt-4 font-poppins text-xl font-semibold">{doneAccount?.account === 'colaborador' ? 'Acesso administrativo!' : 'Conta pronta!'}</h3><p className="mt-1 text-sm text-muted-foreground">Redirecionando...</p></div> : <form onSubmit={submit} className="flex flex-1 flex-col">
        {mode === 'signup' && <div className="space-y-1.5"><Label>Nome completo</Label><div className="relative"><User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={form.name} onChange={set('name')} placeholder="Seu nome" className="h-11 pl-9" /></div></div>}
        <div className="mt-3 space-y-1.5"><Label>E-mail</Label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="email" value={form.email} onChange={set('email')} placeholder="email@exemplo.com" className="h-11 pl-9" /></div></div>
        <div className="mt-3 space-y-1.5"><div className="flex items-center justify-between"><Label>Senha</Label>{mode === 'signin' && <button type="button" onClick={startRecovery} className="text-xs font-medium text-primary hover:underline">Esqueceu?</button>}</div><div className="relative"><Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder={mode === 'signup' ? 'Mínimo de 8 caracteres' : 'Sua senha'} className="h-11 pl-9 pr-10" /><button type="button" onClick={() => setShowPass((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Alternar visibilidade da senha">{showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
        {mode === 'signup' && <><div className="mt-3 space-y-1.5"><Label>Confirmar senha</Label><Input type={showPass ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} placeholder="Repita a senha" className="h-11" /></div><label className="mt-4 flex items-start gap-2 text-xs text-muted-foreground"><Checkbox checked={form.remember} onCheckedChange={(v) => setForm((f) => ({ ...f, remember: Boolean(v) }))} /><span>Concordo com os Termos de Uso e a Política de Privacidade.</span></label></>}
        {error && <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
        <Button type="submit" className="mt-5 h-11 w-full" disabled={loading}>{loading ? 'Processando...' : mode === 'signup' ? 'Criar minha conta' : 'Entrar'}</Button>
        {mode === 'signin' && <div className="mt-6 space-y-3"><p className="text-center text-xs font-medium text-muted-foreground">Acessos de demonstração</p><DemoLoginCard title="Candidato" description="Portal de vagas e perfil profissional" email={authAccounts.candidato.email} icon={UserRound} accent="bg-sky-500/10 text-sky-600" onFill={() => fill(authAccounts.candidato)} /><DemoLoginCard title="Colaborador" description="Painel de recrutamento e gestão" email={authAccounts.colaborador.email} icon={Building2} accent="bg-emerald-500/10 text-emerald-600" onFill={() => fill(authAccounts.colaborador)} /></div>}
      </form>}
    </>}
  </div></div></div>
}
