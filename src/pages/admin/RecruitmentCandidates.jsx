import { useState } from 'react'
import { PageHeader } from '@/components/admin-ui.jsx'
import RealVacancies from './RealVacancies.jsx'
import VacancyApplications from './VacancyApplications.jsx'

export default function RecruitmentCandidates({ kanban=false, onEdit }) {
  const [selected,setSelected]=useState(null)
  if(selected) return <VacancyApplications key={selected} vacancyId={selected} kanban={kanban} onBack={() => setSelected(null)} />
  return <div className="space-y-5"><PageHeader title={kanban ? 'Fluxo de candidaturas' : 'Gestão de candidaturas'} description="Selecione uma vaga para consultar as pessoas inscritas e as etapas do processo." /><RealVacancies onOpen={setSelected} onEdit={onEdit} /></div>
}
