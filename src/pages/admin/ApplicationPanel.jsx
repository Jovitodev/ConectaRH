import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Field, inputClass, Pagination, QueryState } from '@/components/recruitment-ui.jsx'
import { addRecord, applicationHistory, dateTime, interviewDirectory, messageStatuses, moveApplication, recordPendingMessage, rejectApplication, scheduleInterview, statuses } from '@/lib/recruitmentWorkflow.js'

import StructuredAssessment from './StructuredAssessment.jsx'

const eventLabels = { movimentacao: 'Movimentação', anotacao: 'Anotação interna', avaliacao: 'Avaliação interna', entrevista: 'Entrevista', mensagem_pendente: 'Mensagem registrada' }

function History({ app, table, refresh, kind }) {
  const [page, setPage] = useState(0)
  const [data, setData] = useState({ rows: [], count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    applicationHistory(table, app.id, page).then((result) => { if (active) setData(result) })
      .catch((cause) => { if (active) setError(cause.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [app.id, table, page, refresh])
  return <><QueryState loading={loading} error={error} empty={!data.rows.length}><div className="space-y-3">{data.rows.map((row) => <article key={row.id} className="space-y-2 rounded-xl border bg-card p-4 text-sm">
    <div className="flex flex-wrap items-center justify-between gap-2"><strong>{row.assunto || eventLabels[row.tipo] || 'Registro interno'}</strong><span className="text-xs text-muted-foreground">{dateTime(row.created_at)}</span></div>
    {kind === 'events' ? <><p>Responsável: {row.autor_id ? `Usuário ${row.autor_id.slice(0, 8)}` : 'Sistema'}</p>{row.tipo === 'movimentacao' ? <><p>{row.detalhes.etapa_origem} → {row.detalhes.etapa_destino}</p><p>{statuses[row.detalhes.status_origem]} → {statuses[row.detalhes.status_destino]}</p>{row.detalhes.motivo && <p className="whitespace-pre-wrap">Motivo: {row.detalhes.motivo}</p>}</> : <p>{row.detalhes.status || 'Registro salvo'}{row.detalhes.inicio ? ` · ${dateTime(row.detalhes.inicio)}` : ''}</p>}</> : <>
      {row.autor_nome && <p className="text-xs text-muted-foreground">Por {row.autor_nome}</p>}
      {row.remetente && <p className="break-all text-xs text-muted-foreground">De: {row.remetente} · Para: {row.destinatario}</p>}
      {row.status && <Badge variant="secondary">{table === 'feedbacks' ? `Registro legado: ${row.status} (envio não verificado)` : messageStatuses[row.status] || row.status}</Badge>}
      <p className="whitespace-pre-wrap break-words">{row.conteudo || row.observacao}</p>
    </>}
  </article>)}</div></QueryState><Pagination page={page} total={data.count} onChange={setPage} /></>
}

function Interviews({ app, refresh }) {
  const [data, setData] = useState({ rows: [], count: 0 })
  const [page, setPage] = useState(0)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true; setError('')
    interviewDirectory({ appId: app.id, page }).then((result) => { if (active) setData(result) }).catch((cause) => { if (active) setError(cause.message) })
    return () => { active = false }
  }, [app.id, page, refresh])
  return <><QueryState error={error} empty={!data.rows.length}>{data.rows.map((row) => <div key={row.id} className="mb-3 rounded-xl border p-4 text-sm"><strong>{dateTime(row.inicio, row.fuso)}</strong><p>{row.fuso} · {row.duracao_minutos} minutos · {row.status}</p><p>{row.entrevistador} · {row.modalidade}</p><p className="break-words">{row.local_ou_link}</p><p className="whitespace-pre-wrap">{row.observacoes}</p></div>)}</QueryState><Pagination page={page} total={data.count} onChange={setPage} /></>
}

export default function ApplicationPanel({ app, vacancy, items, onClose, onSelect, onChanged }) {
  const [tab, setTab] = useState('curriculo')
  const [action, setAction] = useState('')
  const [stage, setStage] = useState('')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [recordType, setRecordType] = useState('anotacao')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [revision, setRevision] = useState(0)
  const [interview, setInterview] = useState({ start: '', zone: 'America/Sao_Paulo', duration: 45, interviewer: '', mode: 'Online', location: '', notes: '' })
  useEffect(() => { setAction(''); setStage(''); setReason(''); setNote(''); setSubject(''); setBody(''); setTab('curriculo'); setRevision(0) }, [app?.id])
  if (!app) return null
  const stages = [...new Set(['Triagem curricular', ...(vacancy.etapas_iniciais || [])])]
  const index = items.findIndex((row) => row.id === app.id)
  const finalized = ['reprovado','contratado','desistiu'].includes(app.status)
  const run = async (callback, message) => {
    setBusy(true)
    try {
      await callback()
      setRevision((value) => value + 1); setAction(''); toast.success(message)
      try { await onChanged() } catch (cause) { toast.warning('Salvo no banco, mas a tela precisa ser recarregada: ' + cause.message) }
      return true
    }
    catch (cause) { toast.error(cause.message); return false }
    finally { setBusy(false) }
  }
  const setInterviewField = (key, value) => setInterview((current) => ({ ...current, [key]: value }))
  return <Sheet open={!!app} onOpenChange={(open) => !open && onClose()}><SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
    <SheetHeader className="pr-7"><SheetTitle>{app.nome_candidato}</SheetTitle><SheetDescription>{vacancy.codigo} · {vacancy.titulo} · {vacancy.empresas?.nome}</SheetDescription></SheetHeader>
    <div className="mt-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><Badge variant="secondary">{statuses[app.status] || app.status}</Badge><div className="flex gap-2"><Button variant="outline" size="sm" disabled={busy || index <= 0} onClick={() => onSelect(items[index - 1])}>Anterior</Button><Button variant="outline" size="sm" disabled={busy || index < 0 || index >= items.length - 1} onClick={() => onSelect(items[index + 1])}>Próximo</Button></div></div>
      <div className="grid gap-3 rounded-xl border bg-muted/30 p-4 text-sm sm:grid-cols-2"><p><span className="text-muted-foreground">Etapa atual</span><br /><strong>{app.etapa_atual}</strong></p><p><span className="text-muted-foreground">Candidatura em</span><br />{dateTime(app.aplicada_em)}</p><p className="break-all">{app.email_candidato}</p><p>{[app.cidade_candidato, app.estado_candidato].filter(Boolean).join(', ') || 'Localidade não informada'}</p></div>
      <div className="flex flex-wrap gap-2"><Button size="sm" disabled={finalized || busy} onClick={() => setAction('move')}>Mover para etapa</Button><Button size="sm" variant="outline" disabled={finalized || busy} onClick={() => setAction('reject')}>Reprovar</Button><Button size="sm" variant="outline" disabled={finalized || busy} onClick={() => setAction('interview')}>Agendar entrevista</Button><Button size="sm" variant="outline" onClick={() => setTab('avaliacao')}>Adicionar avaliação</Button></div>
      <Tabs value={tab} onValueChange={setTab}><TabsList className="flex h-auto flex-wrap justify-start gap-1"><TabsTrigger value="curriculo">Currículo</TabsTrigger><TabsTrigger value="avaliacao">Avaliação estruturada</TabsTrigger><TabsTrigger value="timeline">Timeline</TabsTrigger><TabsTrigger value="registros">Anotações e avaliações</TabsTrigger><TabsTrigger value="entrevistas">Entrevistas</TabsTrigger><TabsTrigger value="mensagens">Mensagens</TabsTrigger></TabsList>
        <TabsContent value="curriculo" className="space-y-5 py-3">
          <p className="text-xs text-muted-foreground">Retrato profissional enviado nesta candidatura. Dados não informados não são inferidos.</p>
          <section><h3 className="font-semibold">Resumo profissional</h3><p className="mt-1 text-sm">{app.escolaridade || 'Escolaridade não informada'} · {(app.areas || []).join(', ') || 'Áreas não informadas'}</p></section>
          <section><h3 className="font-semibold">Experiências</h3>{app.experiencias_resumo?.length ? app.experiencias_resumo.map((item, i) => <div key={i} className="mt-3 border-l-2 border-primary pl-4 text-sm"><strong>{item.role}</strong><p>{item.company}</p><p className="text-xs text-muted-foreground">{typeof item.period === 'object' ? `${item.period.start || ''} – ${item.period.end || ''}` : item.period}</p><p className="mt-1 whitespace-pre-wrap">{item.description}</p></div>) : <p className="mt-2 text-sm text-muted-foreground">Nenhuma experiência enviada.</p>}</section>
          <section><h3 className="font-semibold">Habilidades</h3><div className="mt-2 flex flex-wrap gap-2">{app.habilidades?.length ? app.habilidades.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>) : <p className="text-sm text-muted-foreground">Não informadas.</p>}</div></section>
          <section><h3 className="font-semibold">Idiomas</h3>{app.idiomas_resumo?.length ? app.idiomas_resumo.map((item, i) => <p key={i} className="mt-1 text-sm">{item.name} · {item.level}</p>) : <p className="mt-2 text-sm text-muted-foreground">Não informados.</p>}</section>
        </TabsContent>
        <TabsContent value="avaliacao" className="py-3"><StructuredAssessment key={app.id} app={app} vacancy={vacancy} onSaved={()=>setRevision(v=>v+1)}/></TabsContent><TabsContent value="timeline" className="space-y-3 py-3"><p className="text-xs text-muted-foreground">Eventos internos da candidatura. Novas ações registram responsável e data.</p><div className="rounded-xl border p-4 text-sm">Candidatura recebida em {dateTime(app.aplicada_em)}.</div><History key={`events-${app.id}`} app={app} table="candidatura_eventos" kind="events" refresh={revision} /></TabsContent>
        <TabsContent value="registros" className="space-y-4 py-3"><p className="text-xs text-muted-foreground">Visível somente ao recrutador atualmente responsável pela vaga. Registros são preservados sem edição.</p><form className="space-y-3" onSubmit={async (event) => { event.preventDefault(); if (await run(() => addRecord(app.id,recordType,note),'Registro interno salvo.')) setNote('') }}><Field label="Tipo de registro"><select className={inputClass} value={recordType} onChange={(event) => setRecordType(event.target.value)}><option value="anotacao">Anotação interna</option><option value="avaliacao">Avaliação interna</option></select></Field><Textarea aria-label="Conteúdo do registro interno" required maxLength={10000} rows={5} value={note} onChange={(event) => setNote(event.target.value)} /><Button disabled={busy || !note.trim()}>Salvar registro interno</Button></form><History key={`records-${app.id}`} app={app} table="candidatura_registros" refresh={revision} /><h3 className="font-semibold">Registros de feedback anteriores</h3><History key={`feedback-${app.id}`} app={app} table="feedbacks" refresh={revision} /></TabsContent>
        <TabsContent value="entrevistas" className="space-y-4 py-3"><p className="text-xs text-muted-foreground">Agendamentos internos. Nenhum convite é enviado automaticamente.</p><Interviews key={app.id} app={app} refresh={revision} /></TabsContent>
        <TabsContent value="mensagens" className="space-y-4 py-3"><p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Envio de e-mail ainda não conectado. Você pode salvar uma mensagem pendente; ela não será enviada automaticamente. Respostas do candidato ainda não estão disponíveis.</p><form className="space-y-3" onSubmit={async (event) => { event.preventDefault(); if(await run(() => recordPendingMessage(app,subject,body),'Mensagem salva como pendente; nenhum e-mail enviado.')) {setSubject('');setBody('')} }}><Field label="Assunto"><Input required maxLength={200} value={subject} onChange={(event) => setSubject(event.target.value)} /></Field><Field label="Mensagem"><Textarea required maxLength={10000} rows={6} value={body} onChange={(event) => setBody(event.target.value)} /></Field><Button disabled={busy || !subject.trim() || !body.trim()}>Salvar mensagem pendente</Button></form><History key={`messages-${app.id}`} app={app} table="candidatura_mensagens" refresh={revision} /></TabsContent>
      </Tabs>
    </div>
    <Dialog open={!!action} onOpenChange={(open) => !open && !busy && setAction('')}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{action === 'move' ? 'Mover candidatura' : action === 'reject' ? 'Reprovar candidatura' : 'Agendar entrevista'}</DialogTitle><DialogDescription>{app.nome_candidato} · {vacancy.codigo}. A ação é interna e não envia mensagens.</DialogDescription></DialogHeader>
      <form className="space-y-4" onSubmit={async (event) => { event.preventDefault(); if(action === 'move') await run(() => moveApplication(app,stage),'Etapa atualizada.'); else if(action === 'reject') await run(() => rejectApplication(app,reason),'Reprovação registrada.'); else if(await run(() => scheduleInterview(app.id,interview),'Entrevista agendada.')) setTab('entrevistas') }}>
        {action === 'move' && <Field label="Etapa de destino"><select required className={inputClass} value={stage} onChange={(event) => setStage(event.target.value)}><option value="">Selecione a etapa</option>{stages.map((item) => <option key={item} disabled={item === app.etapa_atual} value={item}>{item}{item === app.etapa_atual ? ' (atual)' : ''}</option>)}</select></Field>}
        {action === 'reject' && <Field label="Motivo da reprovação"><Textarea required maxLength={2000} value={reason} onChange={(event) => setReason(event.target.value)} /></Field>}
        {action === 'interview' && <div className="grid gap-3 sm:grid-cols-2"><Field label="Data e horário no fuso escolhido"><Input required type="datetime-local" value={interview.start} onChange={(event) => setInterviewField('start',event.target.value)} /></Field><Field label="Fuso horário"><select className={inputClass} value={interview.zone} onChange={(event) => setInterviewField('zone',event.target.value)}>{['America/Sao_Paulo','America/Manaus','America/Rio_Branco','America/Noronha'].map((zone) => <option key={zone}>{zone}</option>)}</select></Field><Field label="Duração em minutos"><Input required type="number" min={5} max={480} value={interview.duration} onChange={(event) => setInterviewField('duration',event.target.value)} /></Field><Field label="Entrevistador"><Input required maxLength={200} value={interview.interviewer} onChange={(event) => setInterviewField('interviewer',event.target.value)} /></Field><Field label="Modalidade"><select className={inputClass} value={interview.mode} onChange={(event) => setInterviewField('mode',event.target.value)}>{['Online','Presencial','Telefone'].map((mode) => <option key={mode}>{mode}</option>)}</select></Field><Field label="Local, telefone ou link"><Input required maxLength={2000} value={interview.location} onChange={(event) => setInterviewField('location',event.target.value)} /></Field><div className="sm:col-span-2"><Field label="Observações"><Textarea maxLength={10000} value={interview.notes} onChange={(event) => setInterviewField('notes',event.target.value)} /></Field></div></div>}
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => setAction('')}>Cancelar</Button><Button disabled={busy || (action === 'move' && !stage) || (action === 'reject' && !reason.trim())}>{busy ? 'Salvando...' : 'Confirmar'}</Button></DialogFooter>
      </form>
    </DialogContent></Dialog>
  </SheetContent></Sheet>
}
