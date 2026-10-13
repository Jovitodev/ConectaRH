import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/admin-ui.jsx'
import RealVacancies from './RealVacancies.jsx'

export default function Vacancies({ onNavigate, onEdit, onOpen, filter, status }) {
  return <div className="space-y-6"><PageHeader title="Gestão de vagas" description="Acompanhe suas vagas, prazos de inscrição e candidaturas."><Button onClick={() => onNavigate('vacancy-create')}><Plus className="h-4 w-4" /> Criar vaga</Button></PageHeader><RealVacancies onEdit={onEdit} onOpen={onOpen} initialFilter={filter} initialStatus={status} /></div>
}
