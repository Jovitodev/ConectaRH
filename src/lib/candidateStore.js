import { supabase } from './supabase.js'
import { parseSalary } from './inputMasks.js'
import { validatePcd } from './pcdRules.js'
import { availabilityChoices } from './professionalOptions.js'

const tables = {
  experiences: 'experiencias',
  education: 'formacoes',
  skills: 'habilidades',
  languages: 'idiomas',
  portfolio: 'portfolio_links',
  certificates: 'conquistas_certificados',
}

function check({ error, data }) {
  if (error) throw error
  return data
}

export async function getCandidateRecord() {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Sessão expirada. Entre novamente.')
  const usuario = check(await supabase.from('usuarios').select('*').eq('auth_user_id', user.id).single())
  if (user.email && usuario.email !== user.email) {
    check(await supabase.from('usuarios').update({ email: user.email }).eq('id', usuario.id).select('id').single())
    usuario.email = user.email
  }
  const candidato = check(await supabase.from('candidatos').select('*').eq('usuario_id', usuario.id).single())
  return { usuario, candidato }
}

const months = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 }
function toDate(value) {
  if (!value || value === 'Presente') return null
  if (/^\d{4}-\d{2}$/.test(value)) return `${value}-01`
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const match = String(value).toLowerCase().match(/^([a-z]{3})\s+(\d{4})$/)
  return match && months[match[1]] ? `${match[2]}-${String(months[match[1]]).padStart(2, '0')}-01` : null
}

const mapping = {
  experiences: {
    from: (r) => ({ id: r.id, role: r.cargo, company: r.empresa, modality: r.modalidade || '', period: { start: r.data_inicio, end: r.atual ? 'Presente' : r.data_fim || '' }, current: !!r.atual, description: r.descricao || '', skills: r.habilidades || [] }),
    to: (x) => ({ cargo: x.role, empresa: x.company, modalidade: x.modality || null, data_inicio: toDate(x.period?.start || x.start), data_fim: x.current ? null : toDate(x.period?.end || x.end), atual: !!x.current, descricao: x.description || null, habilidades: x.skills || [] }),
  },
  education: {
    from: (r) => ({ id: r.id, degree: r.curso, institution: r.instituicao || '', period: r.periodo || '', educationLevel: r.grau || '', educationStatus: r.situacao || '', periodNumber: r.periodo_atual || '' }),
    to: (x) => ({ curso: x.degree, instituicao: x.institution || null, periodo: x.period || null, grau: x.educationLevel || null, situacao: x.educationStatus || null, periodo_atual: x.periodNumber ? Number(x.periodNumber) : null }),
  },
  skills: {
    from: (r) => ({ id: r.id, name: r.nome, level: r.nivel || '' }),
    to: (x) => ({ nome: x.name, nivel: x.level || null }),
  },
  languages: {
    from: (r) => ({ id: r.id, name: r.nome, level: r.nivel || '' }),
    to: (x) => ({ nome: x.name, nivel: x.level || null }),
  },
  portfolio: {
    from: (r) => ({ id: r.id, label: r.rotulo, url: r.url }),
    to: (x) => ({ rotulo: x.label, url: x.url }),
  },
  certificates: {
    from: (r) => ({ id: r.id, title: r.titulo, institution: r.instituicao || '', year: r.ano || '', description: r.descricao || '' }),
    to: (x) => ({ titulo: x.title, instituicao: x.institution || null, ano: x.year || null, descricao: x.description || null }),
  },
}

export async function loadCandidateResume() {
  const { usuario, candidato } = await getCandidateRecord()
  const { data: availabilityRows, error: availabilityError } = await supabase.from('candidato_disponibilidades').select('opcao').eq('candidato_id', candidato.id)
  if (availabilityError) throw availabilityError
  const entries = await Promise.all(Object.entries(tables).map(async ([section, table]) => {
    const rows = check(await supabase.from(table).select('*').eq('candidato_id', candidato.id).order('id'))
    return [section, rows.map(mapping[section].from)]
  }))
  const sections = Object.fromEntries(entries)
  return {
    user: {
      id: usuario.id, auth_user_id: usuario.auth_user_id, name: usuario.nome, email: usuario.email,
      phone: usuario.telefone || '', cpf: usuario.cpf || '', birthDate: usuario.data_nascimento || '',
      pcd: candidato.pcd, disabilityType: candidato.tipo_deficiencia || '',
      pcdDocumentPath: candidato.comprovante_pcd_path || null,
      title: candidato.cargo_atual || '', city: candidato.cidade || '', state: candidato.estado || '',
      cityId: candidato.cidade_id || null, stateId: candidato.estado_id || null,
      desiredSalary: candidato.pretensao_salarial?.toString() || '', availability: candidato.disponibilidade || '',
      availabilityOptions: availabilityRows.length ? availabilityRows.map((row) => row.opcao) : availabilityChoices.includes(candidato.disponibilidade) ? [candidato.disponibilidade] : [],
      workPreference: candidato.modalidade || '', linkedin: candidato.linkedin || '',
      portfolioUrl: candidato.portfolio || '', profileProgress: candidato.perfil_completo || 0,
    },
    resume: { id: `candidate-${candidato.id}`, name: 'Meu Currículo', ...sections },
  }
}

export async function saveResumeItem(section, item) {
  const table = tables[section]
  if (!table) throw new Error('Seção desconhecida.')
  const { candidato } = await getCandidateRecord()
  const payload = mapping[section].to(item)
  const isStored = Number.isInteger(Number(item.id)) && Number(item.id) > 0
  if (section === 'experiences' && (!payload.cargo?.trim() || !payload.empresa?.trim())) throw new Error('Informe cargo e empresa.')
  if (section === 'experiences' && !payload.data_inicio) throw new Error('Informe uma data de início válida (ex.: Jan 2023).')
  if (section === 'education' && !payload.curso?.trim()) throw new Error('Informe o curso.')
  if (section === 'education' && !isStored && (!payload.grau || !payload.situacao)) throw new Error('Selecione grau e situação da formação.')
  if ((section === 'skills' || section === 'languages') && !payload.nome?.trim()) throw new Error('Informe o nome.')
  if ((section === 'skills' || section === 'languages') && !payload.nivel) throw new Error('Selecione o nível.')
  if (section === 'portfolio') {
    if (!payload.rotulo?.trim() || !payload.url?.trim()) throw new Error('Informe nome e URL do link.')
    try { if (!['http:', 'https:'].includes(new URL(payload.url).protocol)) throw new Error() }
    catch { throw new Error('Informe uma URL válida iniciada por https:// ou http://.') }
  }
  if (section === 'certificates' && !payload.titulo?.trim()) throw new Error('Informe o título da conquista.')
  const query = isStored
    ? supabase.from(table).update(payload).eq('id', item.id).eq('candidato_id', candidato.id).select().single()
    : supabase.from(table).insert({ ...payload, candidato_id: candidato.id }).select().single()
  return mapping[section].from(check(await query))
}

export async function deleteResumeItem(section, id) {
  const table = tables[section]
  if (!table) throw new Error('Seção desconhecida.')
  const { candidato } = await getCandidateRecord()
  const deleted = check(await supabase.from(table).delete().eq('id', id).eq('candidato_id', candidato.id).select('id'))
  if (deleted.length !== 1) throw new Error('O item não foi encontrado ou não pôde ser excluído.')
}

export async function saveProfessionalData(values) {
  const { candidato } = await getCandidateRecord()
  if (values.stateId && !values.cityId) throw new Error('Selecione uma cidade da lista antes de salvar.')
  const salary = parseSalary(values.desiredSalary)
  check(await supabase.from('candidatos').update({
    cargo_atual: values.title || null,
    cidade: values.city || null,
    estado: values.state || null,
    cidade_id: values.cityId || null,
    estado_id: values.stateId || null,
    pretensao_salarial: salary,
    modalidade: values.workPreference || null,
    portfolio: values.portfolioUrl || null,
  }).eq('id', candidato.id).select('id').single())
  const selected = [...new Set(values.availabilityOptions || [])]
  const { data: stored, error: availabilityError } = await supabase.from('candidato_disponibilidades').select('opcao').eq('candidato_id', candidato.id)
  if (availabilityError) throw availabilityError
  const current = stored.map((row) => row.opcao)
  const added = selected.filter((option) => !current.includes(option))
  const removed = current.filter((option) => !selected.includes(option))
  if (added.length) check(await supabase.from('candidato_disponibilidades').insert(added.map((opcao) => ({ candidato_id: candidato.id, opcao }))))
  if (removed.length) check(await supabase.from('candidato_disponibilidades').delete().eq('candidato_id', candidato.id).in('opcao', removed))
}

export async function completeInitialResume() {
  const { candidato } = await getCandidateRecord()
  const areas = check(await supabase.from('candidato_areas').select('area_id').eq('candidato_id', candidato.id).limit(1))
  if (!candidato.cargo_atual?.trim() || !candidato.cidade_id || !candidato.estado_id || areas.length === 0) {
    throw new Error('Salve cargo atual, estado, uma cidade selecionada da lista e ao menos uma área de interesse antes de finalizar.')
  }
  check(await supabase.from('candidatos').update({ perfil_completo: 100 }).eq('id', candidato.id).select('id').single())
}

export async function savePcdProfile({ pcd, disabilityType, documentPath }) {
  validatePcd(pcd, disabilityType, Boolean(documentPath))
  const { candidato } = await getCandidateRecord()
  const updates = pcd
    ? { pcd: true, tipo_deficiencia: disabilityType.trim(), comprovante_pcd_path: documentPath }
    : { pcd: false }
  check(await supabase.from('candidatos').update(updates).eq('id', candidato.id).select('id').single())
}

// Importa dados antigos do navegador sem remover os registros já existentes no banco.
// A cópia em localStorage permanece disponível para recuperação manual.
export async function importLocalResumes(resumes, remoteResume) {
  if (!Array.isArray(resumes) || resumes.length === 0) return 0
  let skipped = 0
  const { candidato } = await getCandidateRecord()
  if (!candidato.linkedin) {
    const linkedin = resumes.flatMap((resume) => resume.portfolio || []).find((item) => /linkedin/i.test(`${item.label || ''} ${item.url || ''}`))
    if (linkedin?.url) check(await supabase.from('candidatos').update({ linkedin: linkedin.url }).eq('id', candidato.id))
  }
  const sections = Object.keys(tables)
  for (const section of sections) {
    const fingerprint = (item) => {
      const payload = mapping[section].to(item)
      return section === 'experiences'
        ? JSON.stringify([payload.cargo, payload.empresa, payload.data_inicio])
        : JSON.stringify(payload)
    }
    const existing = new Map((remoteResume[section] || []).map((item) => [fingerprint(item), item]))
    for (const resume of resumes) {
      for (const item of resume[section] || []) {
        if (section === 'portfolio' && /linkedin/i.test(`${item.label || ''} ${item.url || ''}`)) continue
        const payload = mapping[section].to(item)
        if (section === 'experiences' && !payload.data_inicio) { skipped += 1; continue }
        const key = fingerprint(item)
        if (existing.has(key)) {
          if (section === 'experiences') {
            const current = existing.get(key)
            const merged = {
              ...current,
              modality: current.modality || item.modality || '',
              description: current.description || item.description || '',
              skills: current.skills?.length ? current.skills : item.skills || [],
            }
            if (JSON.stringify(merged) !== JSON.stringify(current)) {
              const saved = await saveResumeItem(section, merged)
              existing.set(key, saved)
            }
          }
          continue
        }
        const saved = await saveResumeItem(section, { ...item, id: null })
        existing.set(key, saved)
      }
    }
  }
  return skipped
}
