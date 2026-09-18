import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Star, Briefcase, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader, StatCard, EmptyState } from '@/components/admin-ui.jsx'
import { kanbanStages, kanbanCards, adminJobs } from '@/data/adminData.js'

const stageAccents = {
  Triagem: 'text-slate-600 bg-slate-100',
  Teste: 'text-indigo-700 bg-indigo-50',
  'Entrevista RH': 'text-sky-700 bg-sky-50',
  'Entrevista Gestor': 'text-amber-700 bg-amber-50',
  Proposta: 'text-emerald-700 bg-emerald-50',
}

export default function Kanban({ onNavigate }) {
  const [cards, setCards] = useState(kanbanCards)
  const [jobFilter, setJobFilter] = useState('todas')

  const filtered = cards.filter((c) => jobFilter === 'todas' || c.job === jobFilter)

  const move = (cardId, direction) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c
        const idx = kanbanStages.indexOf(c.stage)
        const next = idx + direction
        if (next < 0 || next >= kanbanStages.length) return c
        toast.success('Card movido', { description: `${c.name} → ${kanbanStages[next]}` })
        return { ...c, stage: kanbanStages[next] }
      }),
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fluxo de Vagas"
        description="Kanban visual por etapa do processo seletivo."
      >
        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Filtrar por vaga" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as vagas</SelectItem>
            {adminJobs.filter((j) => j.status === 'ativa').map((j) => (
              <SelectItem key={j.id} value={j.title}>{j.code} — {j.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Em Triagem" value={filtered.filter((c) => c.stage === 'Triagem').length} icon={Briefcase} accent="text-slate-600 bg-slate-100" />
        <StatCard title="Em Teste / Avaliação" value={filtered.filter((c) => c.stage === 'Teste').length} icon={Briefcase} accent="text-indigo-700 bg-indigo-50" />
        <StatCard title="Em Proposta" value={filtered.filter((c) => c.stage === 'Proposta').length} icon={Briefcase} accent="text-emerald-700 bg-emerald-50" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Nenhum candidato nesta vaga"
          description="Selecione outra vaga ou mova os candidatos entre as etapas."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {kanbanStages.map((stage) => {
            const stageCards = filtered.filter((c) => c.stage === stage)
            return (
              <div key={stage} className="rounded-xl border bg-muted/30 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`flex h-2 w-2 rounded-full ${stageAccents[stage]}`} />
                    <span className="text-sm font-semibold">{stage}</span>
                  </div>
                  <Badge variant="secondary">{stageCards.length}</Badge>
                </div>
                <div className="space-y-3">
                  {stageCards.map((c) => (
                    <Card key={c.id} className="cursor-grab">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{c.name}</p>
                          <Badge variant="secondary" className={c.color}>
                            <Star className="mr-0.5 h-3 w-3" /> {c.score}
                          </Badge>
                        </div>
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{c.job}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={stage === kanbanStages[0]}
                              onClick={() => move(c.id, -1)}
                              aria-label="Mover para etapa anterior"
                            >
                              <ArrowRight className="h-4 w-4 rotate-180" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={stage === kanbanStages[kanbanStages.length - 1]}
                              onClick={() => move(c.id, 1)}
                              aria-label="Mover para próxima etapa"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button variant="ghost" size="sm" className="text-xs" onClick={() => onNavigate('candidate-detail')}>
                            Ver
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {stageCards.length === 0 && (
                    <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                      Sem candidatos
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex justify-center">
        <Button variant="outline" onClick={() => onNavigate('agenda')}>
          <Plus className="h-4 w-4" /> Agendar entrevista
        </Button>
      </div>
    </div>
  )
}
