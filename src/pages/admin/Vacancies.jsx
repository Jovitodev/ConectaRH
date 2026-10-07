import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/admin-ui.jsx'
import { readStore } from '@/lib/localStore.js'
import RealVacancies from './RealVacancies.jsx'

export default function Vacancies({ onNavigate, onEdit }) {
  const localDrafts = readStore('admin.vacancies', [])

  return <div className="space-y-6">
    <PageHeader title="Controle de Vagas" description="Vagas atribuídas à sua conta e persistidas no Supabase.">
      <Button onClick={() => onNavigate('vacancy-create')}><Plus className="h-4 w-4" /> Criar Nova Vaga</Button>
    </PageHeader>
    <RealVacancies onEdit={onEdit} />
    {localDrafts.length > 0 && <details className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
      <summary className="cursor-pointer font-medium">Dados demonstrativos locais ({localDrafts.length})</summary>
      <p className="mt-2">Estes itens permanecem apenas neste navegador. Não são vagas operacionais e não aparecem na busca pública.</p>
      <ul className="mt-2 list-inside list-disc">{localDrafts.map((job) => <li key={job.id}>{job.title} · {job.code}</li>)}</ul>
    </details>}
  </div>
}
