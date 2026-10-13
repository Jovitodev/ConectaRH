import { supabase } from './supabase.js'
import { checked, currentStaff, searchText, todayInSaoPaulo } from './recruitmentWorkflow.js'

import { daysBetween, deadlineField, deadlineLabel as formatDeadline } from './vacancyDates.js'
export { daysBetween, deadlineField }

export const operations = { nao_classificada:'A classificar',alinhamento:'Alinhamento',rs:'R&S',entrevista_gestor:'Entrevista gestor',admissao:'Admissão',suspensa:'Suspensa',concluida:'Concluída',cancelada:'Cancelada' }
export const dateFields = {data_abertura:'Data de abertura',data_reabertura:'Data de reabertura',previsao_alinhamento:'Previsão de alinhamento',previsao_entrega:'Previsão de entrega / triagem',previsao_entrevista:'Previsão de entrevista gestor',previsao_admissao:'Previsão de admissão',envio_material:'Envio de material',entrevista_tecnica:'Entrevista técnica',fechamento:'Fechamento',previsao_faturamento:'Previsão de faturamento',inicio_suspensao:'Início da suspensão',fim_suspensao:'Fim da suspensão',escolha_finalista:'Escolha do finalista'}
export const deadlineLabel = (row,today=todayInSaoPaulo()) => formatDeadline(row,today)
export function emptyOperation() { return {andamento:'alinhamento',reposicao:false,cv:'',gestor:'',email:'',telefone:'',valor_proposta:'',motivo_reabertura:'',motivo_cancelamento:'',finalista_id:'',...Object.fromEntries(Object.keys(dateFields).map(k=>[k,'']))} }
export async function operationalDirectory(options={},stage) {
 const user=await currentStaff()
 let q=supabase.from('recrutamento_operacao').select('*',{count:'exact'}).eq('responsavel_auth_user_id',user.id)
 const text=searchText(options.search)
 if(text)q=q.or(`titulo.ilike.%${text}%,codigo.ilike.%${text}%,cv.ilike.%${text}%,empresa_nome.ilike.%${text}%`)
 if(options.status&&options.status!=='todas')q=q.eq('status',options.status)
 if(stage)q=q.eq('andamento',stage)
 if(options.reposicao&&options.reposicao!=='todas')q=q.eq('reposicao',options.reposicao==='sim')
 if(options.filter==='sem_feedback')q=q.gt('sem_feedback_enviado',0)
 if(options.filter==='mais_80_dias')q=q.lt('publicada_em',new Date(Date.now()-80*86400000).toISOString())
 for(const key of ['previsao_entrega','previsao_entrevista','previsao_admissao'])if(options[key])q=q.eq(key,options[key])
 if(options.inicio)q=q.gte('data_abertura',options.inicio)
 if(options.fim)q=q.lte('data_abertura',options.fim)
 const page=options.page||0
 const response=await q.order('id',{ascending:false}).range(page*12,page*12+11)
 return {rows:checked(response)||[],count:response.count||0}
}
export async function operationalMetrics() { await currentStaff();return checked(await supabase.from('recrutamento_operacao_indicadores').select('*'))||[] }
export async function loadOperation(id) { await currentStaff();return checked(await supabase.from('vaga_operacao').select('*').eq('vaga_id',id).maybeSingle()) }
export async function saveOperation(id,form,previous) {
 await currentStaff()
 const keys=[...Object.keys(emptyOperation())]
 const values=Object.fromEntries(keys.map(key=>[key,form[key]===''?null:form[key]]))
 values.reposicao=!!form.reposicao;values.valor_proposta=form.valor_proposta===''?null:Number(form.valor_proposta);values.finalista_id=form.finalista_id?Number(form.finalista_id):null
 const q=previous?supabase.from('vaga_operacao').update(values).eq('vaga_id',id).eq('updated_at',previous.updated_at):supabase.from('vaga_operacao').insert({...values,vaga_id:id})
 const response=await q.select('*').single()
 if(response.error?.code==='PGRST116'||response.error?.code==='23505')throw new Error('A ficha foi alterada em outra sessão. Feche e abra novamente antes de salvar.')
 return checked(response)
}
export async function operationComments(id,page=0) { const r=await supabase.from('vaga_comentarios').select('*',{count:'exact'}).eq('vaga_id',id).order('created_at',{ascending:false}).order('id',{ascending:false}).range(page*12,page*12+11);return {rows:checked(r)||[],count:r.count||0} }
export async function addOperationComment(id,conteudo) { const user=await currentStaff();return checked(await supabase.from('vaga_comentarios').insert({vaga_id:id,autor_id:user.id,conteudo:conteudo.trim()}).select('id').single()) }
export async function assessmentOptions() { const user=await currentStaff();return checked(await supabase.from('recrutamento_opcoes').select('*').eq('autor_id',user.id).order('nome'))||[] }
export async function addAssessmentOption(campo,nome) { const user=await currentStaff();return checked(await supabase.from('recrutamento_opcoes').insert({campo,nome:nome.trim(),autor_id:user.id}).select('*').single()) }
export async function assessmentHistory(id,page=0) {const r=await supabase.from('candidatura_avaliacoes').select('*',{count:'exact'}).eq('candidatura_id',id).order('created_at',{ascending:false}).order('id',{ascending:false}).range(page*12,page*12+11);return {rows:checked(r)||[],count:r.count||0} }
export async function saveAssessment(id,dados) {const user=await currentStaff();return checked(await supabase.from('candidatura_avaliacoes').insert({candidatura_id:id,autor_id:user.id,dados}).select('id').single()) }
