import { supabase } from './supabase.js'
import { onlyDigits, validPhone } from './inputMasks.js'

export async function signIn(email, password) {
  const normalizedEmail = email.trim().toLowerCase()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  })

  if (error) {
    throw new Error('E-mail ou senha inválidos.')
  }

  if (!data.user) {
    throw new Error('Não foi possível identificar o usuário.')
  }

  const { data: usuario, error: usuarioError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_user_id', data.user.id)
    .single()

  if (usuarioError) {
    console.error(usuarioError)
    throw new Error('Usuário autenticado, mas o cadastro não foi encontrado.')
  }

  return {
    id: usuario.id,
    auth_user_id: data.user.id,
    name: usuario.nome,
    email: usuario.email,
    account: 'candidato',
    usuario,
  }
}

export async function signUpCandidate({
  name,
  email,
  password,
}) {
  const normalizedEmail = email.trim().toLowerCase()

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        name: name.trim(),
      },
    },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      throw new Error('Este e-mail já está cadastrado.')
    }

    throw new Error(error.message)
  }

  if (!data.user) {
    throw new Error('Não foi possível criar a conta.')
  }

  if (!data.session) {
    throw new Error(
      'Conta criada! Verifique seu e-mail para confirmar a conta e depois faça o login.'
    )
  }

  return {
    id: data.user.id,
    auth_user_id: data.user.id,
    name: name.trim(),
    email: normalizedEmail,
    account: 'candidato',
  }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    console.error(error)
    return null
  }

  return data.session
}

export async function getCurrentUser() {
  const session = await getSession()

  if (!session?.user) {
    return null
  }

  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_user_id', session.user.id)
    .single()

  if (error) {
    console.error(error)
    return null
  }

  return {
    id: usuario.id,
    auth_user_id: session.user.id,
    name: usuario.nome,
    email: usuario.email,
    account: 'candidato',
    usuario,
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error('Não foi possível sair da conta.')
  }
}

/**
 * ATUALIZA O PERFIL DO USUÁRIO
 */
export async function updateCurrentProfile(updates) {
  const session = await getSession()

  if (!session?.user) {
    throw new Error('Usuário não autenticado.')
  }

  const usuarioUpdates = {}

  if (updates.name !== undefined) {
    usuarioUpdates.nome = updates.name
  }

  let emailChangePending = false
  if (updates.email !== undefined && updates.email.trim().toLowerCase() !== session.user.email?.toLowerCase()) {
    const requestedEmail = updates.email.trim().toLowerCase()
    const { data, error } = await supabase.auth.updateUser({ email: requestedEmail })
    if (error) throw new Error(error.message)
    if (data.user?.email?.toLowerCase() === requestedEmail) {
      usuarioUpdates.email = requestedEmail
    } else {
      emailChangePending = true
    }
  }

  if (updates.phone !== undefined) {
    if (updates.phone && !validPhone(updates.phone)) throw new Error('Informe um telefone com DDD válido.')
    usuarioUpdates.telefone = updates.phone ? onlyDigits(updates.phone) : null
  }

  if (updates.telefone !== undefined) {
    usuarioUpdates.telefone = updates.telefone
  }

  if (updates.cpf !== undefined) {
    const cpf = onlyDigits(updates.cpf)
    if (cpf && cpf.length !== 11) throw new Error('O CPF deve ter 11 dígitos.')
    usuarioUpdates.cpf = cpf || null
  }

  if (updates.birthDate !== undefined) {
    usuarioUpdates.data_nascimento = updates.birthDate
  }

  if (updates.data_nascimento !== undefined) {
    usuarioUpdates.data_nascimento = updates.data_nascimento
  }

  if (Object.keys(usuarioUpdates).length === 0) {
    return { ...(await getCurrentUser()), emailChangePending }
  }

  const { error } = await supabase
    .from('usuarios')
    .update(usuarioUpdates)
    .eq('auth_user_id', session.user.id)

  if (error) {
    console.error(error)
    throw new Error('Não foi possível atualizar o perfil.')
  }

  return { ...(await getCurrentUser()), emailChangePending }
}

/**
 * SOLICITA RECUPERAÇÃO DE SENHA
 */
export async function requestPasswordReset(email) {
  const normalizedEmail = email.trim().toLowerCase()

  const { error } = await supabase.auth.resetPasswordForEmail(
    normalizedEmail,
    {
      redirectTo: `${window.location.origin}/`,
    }
  )

  if (error) {
    throw new Error(error.message)
  }

  return true
}

/**
 * ALTERA A SENHA
 */
export async function resetPassword(newPassword) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    throw new Error(error.message)
  }

  return true
}

/**
 * ATUALIZA OS DADOS PROFISSIONAIS DO CANDIDATO
 */
export async function updateCurrentCandidate(updates) {
  const session = await getSession()

  if (!session?.user) {
    throw new Error('Usuário não autenticado.')
  }

  const { data: usuario, error: usuarioError } = await supabase
    .from('usuarios')
    .select('id')
    .eq('auth_user_id', session.user.id)
    .single()

  if (usuarioError) {
    console.error(usuarioError)
    throw new Error('Não foi possível localizar o usuário.')
  }

  const candidatoUpdates = {}

  if (updates.title !== undefined) {
    candidatoUpdates.cargo_atual = updates.title
  }

  if (updates.city !== undefined) {
    candidatoUpdates.cidade = updates.city
  }

  if (updates.state !== undefined) {
    candidatoUpdates.estado = updates.state
  }

  if (updates.desiredSalary !== undefined) {
    const salaryText = String(updates.desiredSalary).trim()

    if (!salaryText) {
      candidatoUpdates.pretensao_salarial = null
    } else {
      const salaryNumber = Number(
        salaryText
          .replace(/[R$\s]/g, '')
          .replace(/\./g, '')
          .replace(',', '.')
      )

      candidatoUpdates.pretensao_salarial =
        Number.isFinite(salaryNumber) ? salaryNumber : null
    }
  }

  if (updates.availability !== undefined) {
    candidatoUpdates.disponibilidade = updates.availability
  }

  if (updates.workPreference !== undefined) {
    candidatoUpdates.modalidade = updates.workPreference
  }

  if (updates.profileProgress !== undefined) {
    candidatoUpdates.perfil_completo = updates.profileProgress
  }

  if (updates.linkedin !== undefined) {
    candidatoUpdates.linkedin = updates.linkedin
  }

  if (updates.portfolioUrl !== undefined) {
    candidatoUpdates.portfolio = updates.portfolioUrl
  }

  if (Object.keys(candidatoUpdates).length === 0) {
    return true
  }

  const { error } = await supabase
    .from('candidatos')
    .update(candidatoUpdates)
    .eq('usuario_id', usuario.id)

  if (error) {
    console.error(error)
    throw new Error('Não foi possível atualizar os dados profissionais.')
  }

  return true
}
