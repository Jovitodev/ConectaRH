import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin-ui.jsx'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { RECRUITMENT_PAGE_SIZE, loadOwnedVacancies, loadVacancyApplications } from '@/lib/recruitmentStore.js'

export default function RecruitmentCandidates() {
  const [vacancies, setVacancies] = useState([])
  const [vacancyPage, setVacancyPage] = useState(0)
  const [totalVacancies, setTotalVacancies] = useState(0)
  const [selectedId, setSelectedId] = useState('')
  const [applications, setApplications] = useState([])
  const [applicationPage, setApplicationPage] = useState(0)
  const [totalApplications, setTotalApplications] = useState(0)

  useEffect(() => { loadOwnedVacancies(vacancyPage).then(({ rows, count }) => { setVacancies(rows); setTotalVacancies(count) }).catch((error) => toast.error('Falha ao carregar vagas: ' + error.message)) }, [vacancyPage])
  useEffect(() => {
    if (!selectedId) { setApplications([]); return }
    loadVacancyApplications(Number(selectedId), applicationPage).then(({ rows, count }) => { setApplications(rows); setTotalApplications(count) }).catch((error) => toast.error('Falha ao carregar candidaturas: ' + error.message))
  }, [selectedId, applicationPage])

  return <div className="space-y-5">
    <PageHeader title="Candidaturas das minhas vagas" description="Retratos profissionais enviados para as vagas atribuídas à sua conta." />
    <Select value={selectedId} onValueChange={(value) => { setApplicationPage(0); setSelectedId(value) }}><SelectTrigger className="max-w-md"><SelectValue placeholder="Selecione uma vaga real" /></SelectTrigger><SelectContent>{vacancies.map((vacancy) => <SelectItem key={vacancy.id} value={String(vacancy.id)}>{vacancy.codigo} · {vacancy.titulo}</SelectItem>)}</SelectContent></Select>
    {totalVacancies > RECRUITMENT_PAGE_SIZE && <div className="flex items-center gap-2 text-sm"><Button size="sm" variant="outline" disabled={vacancyPage === 0} onClick={() => setVacancyPage((page) => page - 1)}>Vagas anteriores</Button><span>Página {vacancyPage + 1} de {Math.ceil(totalVacancies / RECRUITMENT_PAGE_SIZE)}</span><Button size="sm" variant="outline" disabled={(vacancyPage + 1) * RECRUITMENT_PAGE_SIZE >= totalVacancies} onClick={() => setVacancyPage((page) => page + 1)}>Próximas vagas</Button></div>}
    {vacancies.length === 0 && <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">Nenhuma vaga real atribuída à sua conta.</p>}
    {selectedId && applications.length === 0 && <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">Nenhuma candidatura nesta vaga.</p>}
    <div className="grid gap-3 lg:grid-cols-2">{applications.map((app) => <Card key={app.id}><CardContent className="space-y-2 p-5">
      <h2 className="font-semibold">{app.nome_candidato}</h2><p className="text-sm text-muted-foreground">{app.email_candidato}</p>
      <p className="text-sm">{app.cidade_candidato || ''} {app.estado_candidato || ''} · {app.etapa_atual}</p>
      {app.escolaridade && <p className="text-sm">Escolaridade: {app.escolaridade}</p>}
      {app.habilidades?.length > 0 && <p className="text-sm">Habilidades: {app.habilidades.join(', ')}</p>}
      {app.areas?.length > 0 && <p className="text-sm">Áreas: {app.areas.join(', ')}</p>}
      {app.experiencias_resumo?.map((item, index) => <p key={index} className="text-sm">{item.role} · {item.company}</p>)}
    </CardContent></Card>)}</div>
    {totalApplications > RECRUITMENT_PAGE_SIZE && <div className="flex items-center gap-2 text-sm"><Button size="sm" variant="outline" disabled={applicationPage === 0} onClick={() => setApplicationPage((page) => page - 1)}>Anteriores</Button><span>{applicationPage * RECRUITMENT_PAGE_SIZE + 1}–{Math.min((applicationPage + 1) * RECRUITMENT_PAGE_SIZE, totalApplications)} de {totalApplications}</span><Button size="sm" variant="outline" disabled={(applicationPage + 1) * RECRUITMENT_PAGE_SIZE >= totalApplications} onClick={() => setApplicationPage((page) => page + 1)}>Próximas</Button></div>}
  </div>
}
