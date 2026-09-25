import { supabase } from './supabase.js'
import { validatePcdPdf } from './fileRules.js'

async function currentUserId() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Sessão expirada. Entre novamente.')
  return user.id
}

function assertSuccess(result) {
  if (result.error) throw result.error
  return result.data
}

export async function signedPcdUrl(path) {
  if (!path) return null
  return assertSuccess(await supabase.storage.from('pcd-documents').createSignedUrl(path, 60)).signedUrl
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
