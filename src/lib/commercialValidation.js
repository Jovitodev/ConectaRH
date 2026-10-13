export const normalizeCnpj = (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g,'')
export function maskCnpj(value) {
  const raw=normalizeCnpj(value).slice(0,14)
  return raw.slice(0,2)+(raw.length>2 ? '.'+raw.slice(2,5) : '')+(raw.length>5 ? '.'+raw.slice(5,8) : '')+(raw.length>8 ? '/'+raw.slice(8,12) : '')+(raw.length>12 ? '-'+raw.slice(12,14) : '')
}
export function validCnpj(value) {
  const cnpj = normalizeCnpj(value)
  if (!/^[A-Z0-9]{12}\d{2}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false
  for (const length of [12,13]) {
    const weights = length === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2]
    const sum = [...cnpj.slice(0,length)].reduce((total,char,index) => total+(char.charCodeAt(0)-48)*weights[index],0)
    const remainder = sum%11
    if (Number(cnpj[length]) !== (remainder<2 ? 0 : 11-remainder)) return false
  }
  return true
}
