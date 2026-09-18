import { readStore, writeStore, uid } from './localStore.js'
import { user as initialUser } from '@/data/mockData.js'
import { colaborador, authAccounts } from '@/data/adminData.js'

const USERS_KEY = 'auth.users'
const SESSION_KEY = 'auth.session'
const RESET_KEY = 'auth.resetTokens'

async function hashPassword(password) {
  const data = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function seedUsers() {
  const existing = readStore(USERS_KEY, null)
  if (existing) return existing
  const users = [
    {
      id: initialUser.id,
      account: 'candidato',
      name: initialUser.name,
      email: initialUser.email,
      passwordHash: null,
      role: 'candidato',
      profile: initialUser,
    },
    {
      id: colaborador.id || 'colab-1',
      account: 'colaborador',
      name: colaborador.name,
      email: colaborador.email,
      passwordHash: null,
      role: colaborador.role || 'admin',
      profile: colaborador,
    },
  ]
  writeStore(USERS_KEY, users)
  return users
}

export async function ensureSeedPasswords() {
  const users = seedUsers()
  let changed = false
  for (const u of users) {
    if (!u.passwordHash) {
      const source = u.account === 'candidato' ? authAccounts.candidato.password : authAccounts.colaborador.password
      u.passwordHash = await hashPassword(source)
      changed = true
    }
  }
  if (changed) writeStore(USERS_KEY, users)
  return users
}

export async function signIn(email, password) {
  const users = await ensureSeedPasswords()
  const normalized = email.trim().toLowerCase()
  const passwordHash = await hashPassword(password)
  const found = users.find((u) => u.email.toLowerCase() === normalized && u.passwordHash === passwordHash)
  if (!found) throw new Error('Credenciais inválidas.')
  const session = { userId: found.id, account: found.account, role: found.role, createdAt: new Date().toISOString() }
  writeStore(SESSION_KEY, session)
  return { ...found.profile, id: found.id, email: found.email, account: found.account, role: found.role }
}

export async function signUpCandidate({ name, email, password }) {
  const users = await ensureSeedPasswords()
  const normalized = email.trim().toLowerCase()
  if (users.some((u) => u.email.toLowerCase() === normalized)) throw new Error('Este e-mail já está cadastrado.')
  const id = uid('cand')
  const passwordHash = await hashPassword(password)
  const profile = {
    ...initialUser,
    id,
    name,
    email: normalized,
    phone: '', birthDate: '', gender: '', pcdOption: 'Não', cep: '', address: '', city: '', state: '',
    title: '', desiredSalary: '', availability: 'Imediata', workPreference: 'Não definido',
    nationality: 'Brasileira', cpf: '', neighborhood: '', number: '', complement: '',
    summary: '', linkedin: '', portfolioUrl: '', profileProgress: 15, profileMissingHint: 'Complete seus dados pessoais para avançar.',
  }
  users.push({ id, account: 'candidato', name, email: normalized, passwordHash, role: 'candidato', profile })
  writeStore(USERS_KEY, users)
  const session = { userId: id, account: 'candidato', role: 'candidato', createdAt: new Date().toISOString() }
  writeStore(SESSION_KEY, session)
  return { ...profile, account: 'candidato', role: 'candidato' }
}

export function getSession() {
  return readStore(SESSION_KEY, null)
}

export async function getCurrentUser() {
  const session = getSession()
  if (!session) return null
  const users = await ensureSeedPasswords()
  const found = users.find((u) => u.id === session.userId)
  return found ? { ...found.profile, id: found.id, email: found.email, account: found.account, role: found.role } : null
}

export function signOut() {
  localStorage.removeItem('conectarh:auth.session')
}

export function updateCurrentProfile(profile) {
  const session = getSession()
  if (!session) return
  const users = readStore(USERS_KEY, [])
  const index = users.findIndex((u) => u.id === session.userId)
  if (index < 0) return
  users[index] = { ...users[index], name: profile.name, email: profile.email, profile: { ...users[index].profile, ...profile } }
  writeStore(USERS_KEY, users)
}

export async function requestPasswordReset(email) {
  const users = await ensureSeedPasswords()
  const normalized = email.trim().toLowerCase()
  const found = users.find((u) => u.email.toLowerCase() === normalized)
  if (!found) return { ok: true, token: null }
  const token = String(Math.floor(100000 + Math.random() * 900000))
  const tokens = readStore(RESET_KEY, [])
  tokens.push({ id: uid('reset'), userId: found.id, token, expiresAt: Date.now() + 15 * 60 * 1000 })
  writeStore(RESET_KEY, tokens.slice(-10))
  return { ok: true, token }
}

export async function resetPassword(email, token, newPassword) {
  const users = await ensureSeedPasswords()
  const tokens = readStore(RESET_KEY, [])
  const normalized = email.trim().toLowerCase()
  const match = tokens.find((t) => t.token === token && t.expiresAt > Date.now() && users.some((u) => u.id === t.userId && u.email.toLowerCase() === normalized))
  if (!match) throw new Error('Token inválido ou expirado.')
  const user = users.find((u) => u.id === match.userId)
  user.passwordHash = await hashPassword(newPassword)
  writeStore(USERS_KEY, users)
  writeStore(RESET_KEY, tokens.filter((t) => t !== match))
}
