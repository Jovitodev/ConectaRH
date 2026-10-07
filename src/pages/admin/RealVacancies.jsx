import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RECRUITMENT_PAGE_SIZE, loadOwnedVacancies, loadVacancyApplications, recordFeedback, updateVacancyStatus } from '@/lib/recruitmentStore.js'

export default function RealVacancies({ onEdit }) {
  const [vacancies, setVacancies] = useState([])
  const [totalVacancies, setTotalVacancies] = useState(0)
  const [vacancyPage, setVacancyPage] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [applications, setApplications] = useState([])
  const [totalApplications, setTotalApplications] = useState(0)
  const [applicationPage, setApplicationPage] = useState(0)
  const [feedbackFilter, setFeedbackFilter] = useState('todas')
  const [notes, setNotes] = useState({})
  const [busy, setBusy] = useState(false)

  const refresh = () => loadOwnedVacancies(vacancyPage, feedbackFilter).then(({ rows, count }) => { setVacancies(rows); setTotalVacancies(count) }).catch((error) => toast.error('Falha ao carregar vagas reais: ' + error.message))
  useEffect(() => { refresh() }, [vacancyPage, feedbackFilter])
  useEffect(() => {
    if (!selectedId) return
    loadVacancyApplications(selectedId, applicationPage).then(({ rows, count }) => { setApplications(rows); setTotalApplications(count) }).catch((error) => toast.error('Falha ao carregar candidaturas: ' + error.message))
  }, [selectedId, applicationPage])

  const changeStatus = async (vacancy, status) => {
    try { await updateVacancyStatus(vacancy.id, status); await refresh(); toast.success('Status atualizado') }
    catch (error) { toast.error(error.message) }
  }

  const saveFeedback = async (app) => {
    const observacao = notes[app.id]?.trim()
    if (!observacao) return toast.error('Escreva uma observação antes de registrar o feedback.')
    setBusy(true)
    try {
      await recordFeedback(app.id, { etapa: app.etapa_atual, status: 'pendente', observacao })
      setNotes((current) => ({ ...current, [app.id]: '' }))
      const updated = await loadVacancyApplications(selectedId, applicationPage)
      setApplications(updated.rows)
      setTotalApplications(updated.count)
      await refresh()
      toast.success('Registro interno salvo; nenhuma mensagem foi enviada')
    } catch (error) { toast.error(error.message) }
    finally { setBusy(false) }
  }

  const withoutFeedback = (vacancy) => vacancy.summary?.sem_feedback || 0

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-semibold">Vagas reais no Supabase</h2><p className="text-sm text-muted-foreground">Somente vagas atribuídas à sua conta.</p></div>
      <Select value={feedbackFilter} onValueChange={(value) => { setVacancyPage(0); setFeedbackFilter(value) }}><SelectTrigger className="w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas</SelectItem><SelectItem value="sem_feedback">Vagas sem feedback</SelectItem><SelectItem value="mais_80_dias">Mais de 80 dias</SelectItem></SelectContent></Select>
    </div>
    {vacancies.length === 0 && <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Nenhuma vaga real encontrada nesta seleção.</p>}
    <div className="grid gap-3 md:grid-cols-2">
      {vacancies.map((vacancy) => <Card key={vacancy.id}><CardContent className="space-y-3 p-5">
        <div><p className="text-xs text-muted-foreground">{vacancy.codigo} · {vacancy.empresas?.nome || 'Empresa indisponível'}</p><h3 className="font-semibold">{vacancy.titulo}</h3></div>
        <p className="text-sm">{vacancy.status} · {vacancy.summary?.candidaturas || 0} candidatura(s) · {withoutFeedback(vacancy)} sem feedback</p>
        <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => { setApplicationPage(0); setSelectedId(selectedId === vacancy.id ? null : vacancy.id) }}>Ver candidaturas</Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(vacancy.id)}>Editar vaga</Button>
          {vacancy.status === 'ativa' && <Button variant="outline" size="sm" onClick={() => changeStatus(vacancy, 'pausada')}>Pausar</Button>}
          {vacancy.status === 'pausada' || vacancy.status === 'rascunho' ? <Button variant="outline" size="sm" onClick={() => changeStatus(vacancy, 'ativa')}>Publicar</Button> : null}
        </div>
      </CardContent></Card>)}
    </div>
    {totalVacancies > RECRUITMENT_PAGE_SIZE && <div className="flex items-center justify-end gap-2 text-sm"><span>{vacancyPage * RECRUITMENT_PAGE_SIZE + 1}–{Math.min((vacancyPage + 1) * RECRUITMENT_PAGE_SIZE, totalVacancies)} de {totalVacancies}</span><Button variant="outline" size="sm" disabled={vacancyPage === 0} onClick={() => setVacancyPage((page) => page - 1)}>Anterior</Button><Button variant="outline" size="sm" disabled={(vacancyPage + 1) * RECRUITMENT_PAGE_SIZE >= totalVacancies} onClick={() => setVacancyPage((page) => page + 1)}>Próxima</Button></div>}
    {selectedId && <Card><CardHeader><CardTitle>Candidaturas de {vacancies.find((item) => item.id === selectedId)?.codigo}</CardTitle></CardHeader><CardContent className="space-y-4">
      {applications.length === 0 && <p className="text-sm text-muted-foreground">Ainda não há candidaturas nesta vaga.</p>}
      {applications.map((app) => <div key={app.id} className="space-y-3 rounded-lg border p-4">
        <div><h4 className="font-medium">{app.nome_candidato}</h4><p className="text-sm text-muted-foreground">{app.email_candidato} · {app.cidade_candidato || ''} {app.estado_candidato || ''}</p><p className="text-sm">{app.etapa_atual} · {app.status}</p></div>
        {app.escolaridade && <p className="text-sm">Escolaridade: {app.escolaridade}</p>}
        {app.habilidades?.length > 0 && <p className="text-sm">Habilidades: {app.habilidades.join(', ')}</p>}
        {app.experiencias_resumo?.map((experience, index) => <p key={index} className="text-sm">{experience.role} · {experience.company}</p>)}
        {(app.feedbacks || []).map((feedback) => <p key={feedback.id} className="rounded bg-muted p-2 text-sm">Registro interno ({feedback.status}): {feedback.observacao}</p>)}
        <Textarea value={notes[app.id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [app.id]: event.target.value }))} placeholder="Observação interna; não envia mensagem" />
        <Button size="sm" disabled={busy} onClick={() => saveFeedback(app)}>Salvar registro interno</Button>
      </div>)}
      {totalApplications > RECRUITMENT_PAGE_SIZE && <div className="flex items-center justify-end gap-2 text-sm"><span>{applicationPage * RECRUITMENT_PAGE_SIZE + 1}–{Math.min((applicationPage + 1) * RECRUITMENT_PAGE_SIZE, totalApplications)} de {totalApplications}</span><Button variant="outline" size="sm" disabled={applicationPage === 0} onClick={() => setApplicationPage((page) => page - 1)}>Anterior</Button><Button variant="outline" size="sm" disabled={(applicationPage + 1) * RECRUITMENT_PAGE_SIZE >= totalApplications} onClick={() => setApplicationPage((page) => page + 1)}>Próxima</Button></div>}
    </CardContent></Card>}
  </section>
}
