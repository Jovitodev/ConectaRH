import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Resume from '@/pages/Resume.jsx'

const steps = [
  ['professional', 'Dados profissionais'], ['areas', 'Áreas de interesse'],
  ['experiences', 'Experiências'], ['education', 'Formação'],
  ['skills', 'Habilidades'], ['languages', 'Idiomas'],
  ['portfolio', 'Portfólio'], ['certificates', 'Conquistas'], ['finish', 'Finalização'],
]

export default function ResumeOnboarding({ user, resume, onSaveItem, onDeleteItem, onSaveProfessional, onFinish, onLogout }) {
  const [step, setStep] = useState(0)
  const [finishing, setFinishing] = useState(false)
  const [complete, setComplete] = useState(false)
  const finish = async () => {
    setFinishing(true)
    try {
      await onFinish()
      setComplete(true)
      toast.success('Seu currículo foi cadastrado com sucesso!')
      setTimeout(() => onFinish(true), 1200)
    } catch (error) { toast.error(error.message || 'Não foi possível finalizar o currículo.') }
    finally { setFinishing(false) }
  }
  return <main className="min-h-screen bg-background px-4 py-8"><div className="mx-auto max-w-5xl space-y-5">
    <div className="flex items-center justify-between gap-3"><div><p className="font-poppins text-xl font-bold">Conecta<span className="text-primary">RH</span></p><h1 className="mt-5 font-poppins text-3xl font-semibold">Cadastre seu currículo</h1><p className="text-sm text-muted-foreground">Salve cada seção para continuar de onde parou. Cargo atual, cidade, estado e uma área de interesse são necessários para finalizar; as demais seções são opcionais.</p></div><Button variant="outline" onClick={onLogout}>Sair</Button></div>
    <Card className="p-4"><p className="text-sm font-medium">Etapa {step + 1} de {steps.length}: {steps[step][1]}</p><div className="mt-3 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${(step + 1) / steps.length * 100}%` }} /></div><div className="mt-4 flex flex-wrap gap-2">{steps.map(([key, label], index) => <Button key={key} size="sm" variant={index === step ? 'default' : 'outline'} onClick={() => setStep(index)}>{index + 1}. {label}</Button>)}</div></Card>
    {complete ? <Card className="p-8 text-center"><h2 className="font-poppins text-xl font-semibold">Seu currículo foi cadastrado com sucesso!</h2><p className="mt-2 text-sm text-muted-foreground">Redirecionando para a Home...</p></Card> : steps[step][0] === 'finish' ? <Card className="space-y-4 p-6"><h2 className="font-poppins text-xl font-semibold">Finalizar cadastro</h2><p className="text-sm text-muted-foreground">Confira se salvou os dados profissionais e as áreas de interesse. Você poderá editar o currículo depois.</p><Button disabled={finishing} onClick={finish}>{finishing ? 'Finalizando...' : 'Finalizar currículo'}</Button></Card> : <Resume key={user.id} user={user} resume={resume} onSaveItem={onSaveItem} onDeleteItem={onDeleteItem} onSaveProfessional={onSaveProfessional} onboardingSection={steps[step][0]} />}
    {!complete && <div className="flex justify-between"><Button variant="outline" disabled={step === 0} onClick={() => setStep((current) => current - 1)}>Anterior</Button><Button disabled={step === steps.length - 1} onClick={() => setStep((current) => current + 1)}>Próxima etapa</Button></div>}
  </div></main>
}
