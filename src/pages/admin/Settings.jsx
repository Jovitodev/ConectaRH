import { useState } from 'react'
import { toast } from 'sonner'
import { Save, Bell, Palette, Shield, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/admin-ui.jsx'
import { useTheme } from '@/components/theme-provider'

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState({
    orgName: 'Serhum Consultoria',
    brandName: 'ConectaRH',
    defaultJobType: 'CLT',
    defaultVisibility: 'publica',
    notifyNewApp: true,
    notifyInterview: true,
    notifyReport: false,
    twoFactor: true,
    sessionTimeout: '30',
  })

  const set = (k) => (e) => setSettings((s) => ({ ...s, [k]: e.target.value }))
  const setRaw = (k, v) => setSettings((s) => ({ ...s, [k]: v }))

  const save = () => {
    toast.success('Configurações salvas!', { description: 'As preferências foram atualizadas.' })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Preferências da organização e do sistema.">
        <Button onClick={save}>
          <Save className="h-4 w-4" /> Salvar alterações
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Identidade
            </CardTitle>
            <CardDescription>Informações da organização exibidas aos candidatos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="s-org">Nome da organização</Label>
              <Input id="s-org" value={settings.orgName} onChange={set('orgName')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-brand">Marca do portal</Label>
              <Input id="s-brand" value={settings.brandName} onChange={set('brandName')} />
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="s-type">Tipo de contratação padrão</Label>
                <Select value={settings.defaultJobType} onValueChange={(v) => setRaw('defaultJobType', v)}>
                  <SelectTrigger id="s-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['CLT', 'PJ', 'CLT + Variável', 'Estágio', 'Temporário'].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-vis">Visibilidade padrão</Label>
                <Select value={settings.defaultVisibility} onValueChange={(v) => setRaw('defaultVisibility', v)}>
                  <SelectTrigger id="s-vis"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publica">Pública</SelectItem>
                    <SelectItem value="interna">Interna</SelectItem>
                    <SelectItem value="sigilosa">Sigilosa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4" /> Notificações
              </CardTitle>
              <CardDescription>Quais eventos geram alertas para a equipe.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'notifyNewApp', title: 'Nova candidatura', desc: 'Alerta quando um candidato se aplica a uma vaga.' },
                { key: 'notifyInterview', title: 'Entrevistas agendadas', desc: 'Lembrete para entrevistas próximas.' },
                { key: 'notifyReport', title: 'Relatórios semanais', desc: 'Resumo analítico enviado por e-mail toda segunda.' },
              ].map((n) => (
                <div key={n.key} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.desc}</p>
                  </div>
                  <Switch checked={settings[n.key]} onCheckedChange={(v) => setRaw(n.key, v)} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" /> Segurança
              </CardTitle>
              <CardDescription>Políticas de acesso e sessão.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Autenticação de dois fatores</p>
                  <p className="text-xs text-muted-foreground">Exigir 2FA para toda a equipe.</p>
                </div>
                <Switch checked={settings.twoFactor} onCheckedChange={(v) => setRaw('twoFactor', v)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-timeout">Tempo de sessão (minutos)</Label>
                <Select value={settings.sessionTimeout} onValueChange={(v) => setRaw('sessionTimeout', v)}>
                  <SelectTrigger id="s-timeout"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">60 minutos</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-4 w-4" /> Aparência
            </CardTitle>
            <CardDescription>Preferência de tema visual.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="s-theme">Tema do sistema</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="s-theme" className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Escuro</SelectItem>
                  <SelectItem value="light">Claro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
