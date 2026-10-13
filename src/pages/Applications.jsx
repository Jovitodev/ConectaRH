import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Briefcase, Building2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RECRUITMENT_PAGE_SIZE, loadMyApplications, toApplicationJob } from '@/lib/recruitmentStore.js'

const applicationStatus = {
  em_andamento: 'Em análise', aprovado: 'Aprovado', reprovado: 'Reprovado', contratado: 'Contratado', desistiu: 'Desistiu',
}
const vacancyStatus = {
  ativa: 'Aberta', pausada: 'Pausada', encerrada: 'Encerrada', cancelada: 'Cancelada', rascunho: 'Não publicada',
}

export default function Applications() {
  const [page, setPage] = useState(0)
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    loadMyApplications(page).then(({ rows, count }) => { if (active) { setRecords(rows); setTotal(count) } })
      .catch((error) => toast.error('Não foi possível carregar suas candidaturas: ' + error.message))
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page])

  return <div className="space-y-5">
    <div><h1 className="font-poppins text-2xl font-semibold">Minhas Candidaturas</h1><p className="text-sm text-muted-foreground">Histórico persistido no Supabase, inclusive quando a vaga for pausada ou encerrada.</p></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> {total} candidatura(s)</CardTitle></CardHeader><CardContent className="space-y-4">
      {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {!loading && records.length === 0 && <p className="text-sm text-muted-foreground">Você ainda não se candidatou a nenhuma vaga real.</p>}
      {records.map((application) => {
        const job = toApplicationJob(application)
        return <div key={application.id} className="space-y-3 rounded-lg border p-4">
          <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="font-semibold">{job.title}</h2><p className="flex items-center gap-1 text-sm text-muted-foreground"><Building2 className="h-3.5 w-3.5" /> {job.company}</p></div><Badge variant="secondary">Vaga: {vacancyStatus[job.status] || job.status}</Badge></div>
          <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {job.location || 'Localidade não informada'} · {job.model}</p>
          <p className="text-sm">Minha candidatura: <strong>{applicationStatus[application.status] || application.status}</strong> · Etapa atual: {application.etapa_atual}</p>
          <p className="text-xs text-muted-foreground">Enviada em {new Date(application.aplicada_em).toLocaleString('pt-BR')}. Este registro permanece no histórico mesmo se a vaga deixar de ser pública.</p>
        </div>
      })}
    </CardContent></Card>
    {total > RECRUITMENT_PAGE_SIZE && <div className="flex items-center justify-end gap-2 text-sm"><span>{page * RECRUITMENT_PAGE_SIZE + 1}–{Math.min((page + 1) * RECRUITMENT_PAGE_SIZE, total)} de {total}</span><Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>Anterior</Button><Button variant="outline" size="sm" disabled={(page + 1) * RECRUITMENT_PAGE_SIZE >= total} onClick={() => setPage((current) => current + 1)}>Próxima</Button></div>}
  </div>
}
