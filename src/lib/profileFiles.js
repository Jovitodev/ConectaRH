import { supabase } from './supabase.js'
import { validateAvatarFile, validatePcdPdf } from './fileRules.js'

async function currentUserId() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Sessão expirada. Entre novamente.')
  return user.id
}

function assertSuccess(result) {
  if (result.error) throw result.error
  return result.data
}

export async function signedAvatarUrl(path) {
  if (!path) return null
  return assertSuccess(await supabase.storage.from('avatars').createSignedUrl(path, 3600)).signedUrl
}

export async function signedPcdUrl(path) {
  if (!path) return null
  return assertSuccess(await supabase.storage.from('pcd-documents').createSignedUrl(path, 60)).signedUrl
}

export async function uploadAvatar(file) {
  const extension = await validateAvatarFile(file)
  const uid = await currentUserId()
  const old = assertSuccess(await supabase.from('usuarios').select('avatar_path').eq('auth_user_id', uid).single())?.avatar_path
  const path = `${uid}/${crypto.randomUUID()}.${extension}`
  assertSuccess(await supabase.storage.from('avatars').upload(path, file, { contentType: file.type, upsert: false }))
  try {
    assertSuccess(await supabase.from('usuarios').update({ avatar_path: path }).eq('auth_user_id', uid).select('avatar_path').single())
  } catch (error) {
    await supabase.storage.from('avatars').remove([path])
    throw error
  }
  if (old && old !== path) assertSuccess(await supabase.storage.from('avatars').remove([old]))
  return { path, url: await signedAvatarUrl(path) }
}

export async function removeAvatar() {
  const uid = await currentUserId()
  const old = assertSuccess(await supabase.from('usuarios').select('avatar_path').eq('auth_user_id', uid).single())?.avatar_path
  if (!old) return
  assertSuccess(await supabase.from('usuarios').update({ avatar_path: null }).eq('auth_user_id', uid).select('avatar_path').single())
  assertSuccess(await supabase.storage.from('avatars').remove([old]))
}

export async function uploadPcdPdf(file) {
  await validatePcdPdf(file)
  const uid = await currentUserId()
  const path = `${uid}/${crypto.randomUUID()}.pdf`
  assertSuccess(await supabase.storage.from('pcd-documents').upload(path, file, { contentType: 'application/pdf', upsert: false }))
  return path
}

export async function removePcdPdf(path) {
  if (path) assertSuccess(await supabase.storage.from('pcd-documents').remove([path]))
}
