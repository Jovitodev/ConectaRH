import { supabase } from './supabase.js'
import { onlyDigits, validPhone } from './inputMasks.js'
import { normalizeCnpj, validCnpj } from './commercialValidation.js'
export { normalizeCnpj, maskCnpj, validCnpj } from './commercialValidation.js'

export const COMMERCIAL_PAGE_SIZE = 12
export const clientStatuses = { ativo: 'Ativo', inativo: 'Inativo', pendente: 'Pendente', bloqueado: 'Bloqueado' }
export const proposalStatuses = { aguardando: 'Aguardando', fechado: 'Fechado', nao_fechado: 'Não fechado' }
export const proposalTypes = { rs: 'Recrutamento e Seleção', riscos_psicossociais: 'Riscos Psicossociais' }
export const maskCep = (value) => onlyDigits(value).slice(0,8).replace(/^(\d{5})(\d)/,'$1-$2')
const emailValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
const textFilter = (value) => String(value || '').replace(/[%_(),.\\"']/g,' ').trim().slice(0,120)
function check(response) {
  if (response.error) {
    if (response.error.code==='23505') throw new Error('Já existe um cadastro com esse CNPJ, razão social ou opção.')
    if (['PGRST205','PGRST202','42P01'].includes(response.error.code)) throw new Error('A atualização do Comercial no banco ainda não está disponível.')
    throw response.error
  }
  return response.data
}
async function currentCommercial() {
  const { data,error } = await supabase.auth.getUser()
  if(error || data.user?.app_metadata?.role!=='comercial') throw new Error('Entre com uma conta Comercial autorizada.')
  return data.user
}
const pageRange = (query,page) => query.range(page*COMMERCIAL_PAGE_SIZE,(page+1)*COMMERCIAL_PAGE_SIZE-1)

export async function commercialIndicators() {
  await currentCommercial()
  return check(await supabase.from('comercial_indicadores').select('*').single())
}
export async function loadClients({ page=0, company='', tradeName='', contact='', cnpj='', status='todos', archived=false }={}) {
  await currentCommercial()
  let query = supabase.from('comercial_clientes').select('*',{count:'exact'})
  query = archived ? query.not('excluido_em','is',null) : query.is('excluido_em',null)
  for(const [column,value] of [['nome',company],['nome_fantasia',tradeName],['solicitante',contact]]) {
    const term=textFilter(value)
    if(term) query=query.ilike(column,`%${term}%`)
  }
  const document=normalizeCnpj(cnpj)
  if(document) query=query.ilike('cnpj',`%${document}%`)
  if(status!=='todos') query=query.eq('status',status)
  const response=await pageRange(query.order('created_at',{ascending:false}).order('id',{ascending:false}),page)
  return { rows:check(response)||[],count:response.count||0 }
}
export async function loadClient(id) {
  await currentCommercial()
  return check(await supabase.from('comercial_clientes').select('*').eq('id',id).single())
}
export function clientPayload(form) {
  for(const [label,value] of [['Razão social',form.name],['Nome fantasia',form.tradeName],['Solicitante',form.contact],['Endereço',form.address]]) {
    if(!String(value||'').trim()) throw new Error(`Preencha ${label}.`)
  }
  if(!validCnpj(form.cnpj)) throw new Error('Informe um CNPJ válido.')
  if(!validPhone(form.phone)) throw new Error('Informe um telefone com DDD válido.')
  if(!emailValid(form.contactEmail)||!emailValid(form.billingEmail)) throw new Error('Informe e-mails de contato e faturamento válidos.')
  if(onlyDigits(form.cep).length!==8) throw new Error('Informe um CEP com 8 dígitos.')
  if(!form.cityId||!form.stateId) throw new Error('Selecione estado e cidade cadastrados.')
  if(!form.businessId) throw new Error('Selecione ou cadastre um tipo de negócio.')
  if(!clientStatuses[form.status]) throw new Error('Status inválido.')
  return { nome:form.name.trim(),nome_fantasia:form.tradeName.trim(),cnpj:normalizeCnpj(form.cnpj),solicitante:form.contact.trim(),negocio_id:Number(form.businessId),telefone:onlyDigits(form.phone),email_contato:form.contactEmail.trim(),email_faturamento:form.billingEmail.trim(),cep:onlyDigits(form.cep),estado_id:form.stateId,cidade_id:form.cityId,endereco:form.address.trim(),status:form.status }
}
export async function saveClient(id,form) {
  await currentCommercial()
  const result=check(await supabase.rpc('comercial_salvar_cliente',{p_id:id||null,p_dados:clientPayload(form)}))
  return loadClient(result)
}
export async function archiveClient(id,archived) {
  await currentCommercial()
  check(await supabase.from('empresa_dados_comerciais').update({excluido_em:archived ? new Date().toISOString() : null}).eq('empresa_id',id).select('empresa_id').single())
}
export async function changeClientStatus(id,status) {
  await currentCommercial()
  if(!clientStatuses[status]) throw new Error('Status inválido.')
  check(await supabase.from('empresa_dados_comerciais').update({status}).eq('empresa_id',id).is('excluido_em',null).select('empresa_id').single())
}
export async function loadCommercialOptions(type) {
  return check(await supabase.from('comercial_opcoes').select('id,nome').eq('tipo',type).order('nome'))||[]
}
export async function createCommercialOption(type,name) {
  const user=await currentCommercial()
  if(name.trim().length<2) throw new Error('Informe um nome com pelo menos 2 caracteres.')
  return check(await supabase.from('comercial_opcoes').insert({tipo:type,nome:name.trim(),criada_por:user.id}).select('id,nome').single())
}

export async function loadProposals({companyId,type,page=0,status='todos'}) {
  await currentCommercial()
  let query=supabase.from('comercial_propostas').select('*',{count:'exact'}).eq('empresa_id',companyId).eq('tipo',type)
  if(status!=='todos')query=query.eq('status',status)
  const response=await pageRange(query.order('data_envio',{ascending:false}).order('id',{ascending:false}),page)
  return {rows:check(response)||[],count:response.count||0}
}
export async function proposalIndicators(companyId,type) {
  const rows=check(await supabase.from('comercial_propostas_indicadores').select('*').eq('empresa_id',companyId).eq('tipo',type))
  return rows[0]||{total:0,fechado:0,aguardando:0,nao_fechado:0}
}
export async function saveProposal(companyId,type,id,form) {
  const user=await currentCommercial()
  if(!form.contact.trim()||!emailValid(form.email)||!validPhone(form.phone)||!form.sentDate) throw new Error('Preencha solicitante, e-mail, telefone e data da proposta.')
  if(!proposalStatuses[form.status]) throw new Error('Selecione um status válido.')
  const payload={solicitante:form.contact.trim(),email:form.email.trim().toLowerCase(),telefone:onlyDigits(form.phone),data_envio:form.sentDate,status:form.status}
  if(type==='rs') {
    if(!form.originId) throw new Error('Selecione ou cadastre a origem do cliente.')
    for(const [label,value] of [['Taxa',form.rate],['Taxa de cancelamento',form.cancellationRate]]) {
      if(value===''||!Number.isFinite(Number(value))||Number(value)<0||Number(value)>100) throw new Error(`${label} deve estar entre 0 e 100%.`)
    }
    for(const [label,value] of [['Vencimento',form.dueDays],['Reposição',form.replacementDays]]) {
      if(value===''||!Number.isInteger(Number(value))||Number(value)<0) throw new Error(`${label} deve ser um número inteiro de dias, maior ou igual a zero.`)
    }
    Object.assign(payload,{origem_id:Number(form.originId),taxa_percentual:Number(form.rate),cancelamento_percentual:Number(form.cancellationRate),vencimento_dias:Number(form.dueDays),reposicao_dias:Number(form.replacementDays)})
  } else {
    if(form.description.trim().length<3||form.value===''||!Number.isFinite(Number(form.value))||Number(form.value)<0) throw new Error('Informe descrição e valor válidos.')
    Object.assign(payload,{descricao:form.description.trim(),valor:Number(form.value)})
  }
  const query=id ? supabase.from('comercial_propostas').update(payload).eq('id',id).eq('empresa_id',companyId).eq('tipo',type) : supabase.from('comercial_propostas').insert({...payload,empresa_id:companyId,tipo:type,criada_por:user.id})
  return check(await query.select('*').single())
}
