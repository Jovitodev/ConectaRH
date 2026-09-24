export async function validateAvatarFile(file) {
  const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
  if (!extensions[file?.type]) throw new Error('Escolha uma imagem JPG, PNG ou WebP.')
  if (file.size > 2 * 1024 * 1024) throw new Error('A foto deve ter até 2 MB.')
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const isPng = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)
  const text = new TextDecoder().decode(bytes)
  const isWebp = text.startsWith('RIFF') && text.slice(8, 12) === 'WEBP'
  if (!({ 'image/jpeg': isJpeg, 'image/png': isPng, 'image/webp': isWebp })[file.type]) {
    throw new Error('O arquivo não corresponde ao formato de imagem selecionado.')
  }
  return extensions[file.type]
}

export async function validatePcdPdf(file) {
  if (!file || file.type !== 'application/pdf' || !/\.pdf$/i.test(file.name)) throw new Error('Escolha um arquivo PDF.')
  if (file.size > 5 * 1024 * 1024) throw new Error('O comprovante deve ter até 5 MB.')
  const header = new TextDecoder().decode(await file.slice(0, 4).arrayBuffer())
  if (header !== '%PDF') throw new Error('O arquivo selecionado não é um PDF válido.')
}
