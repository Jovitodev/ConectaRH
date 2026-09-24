import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function CandidateSettings({ onNavigate }) {
  return <div className="space-y-5">
    <div><h1 className="font-poppins text-2xl font-semibold">Configurações</h1><p className="text-sm text-muted-foreground">Preferências, privacidade e conta.</p></div>
    <Card className="space-y-3 p-5"><h2 className="font-poppins font-semibold">Conta</h2><p className="text-sm text-muted-foreground">Seus dados pessoais e a alteração de senha estão em Meu Perfil.</p><Button variant="outline" onClick={() => onNavigate('profile')}>Ir para Meu Perfil</Button></Card>
    <Card className="space-y-2 p-5"><h2 className="font-poppins font-semibold">Preferências e privacidade</h2><p className="text-sm text-muted-foreground">Esta área será ampliada em uma próxima etapa.</p></Card>
  </div>
}
