import { Card } from '@/components/ui/card'

export default function CandidateSupport() {
  return <div className="space-y-5">
    <div><h1 className="font-poppins text-2xl font-semibold">Suporte</h1><p className="text-sm text-muted-foreground">Ajuda para usar o ConectaRH.</p></div>
    <Card className="space-y-2 p-5"><h2 className="font-poppins font-semibold">Central de Ajuda</h2><p className="text-sm text-muted-foreground">Aqui ficarão orientações para usar seu perfil, currículo e candidaturas.</p></Card>
    <Card className="space-y-2 p-5"><h2 className="font-poppins font-semibold">Perguntas frequentes e contato</h2><p className="text-sm text-muted-foreground">Os canais de suporte serão disponibilizados nesta área.</p></Card>
  </div>
}
