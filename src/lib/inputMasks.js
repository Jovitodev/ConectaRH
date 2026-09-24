export const onlyDigits = (value) => String(value || '').replace(/\D/g, '')

export function maskPhone(value) {
  const digits = onlyDigits(value).slice(0, 11)
  if (!digits) return ''
  if (digits.length < 3) return `(${digits}`
  const prefix = `(${digits.slice(0, 2)}) `
  if (digits.length <= 7) return prefix + digits.slice(2)
  const split = digits.length === 11 ? 7 : 6
  return prefix + digits.slice(2, split) + '-' + digits.slice(split)
}

export function validPhone(value) {
  const digits = onlyDigits(value)
  return digits.length === 10 || digits.length === 11
}

export function maskCpf(value) {
  const digits = onlyDigits(value).slice(0, 11)
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

export function formatSalary(value) {
  if (value === null || value === undefined || value === '') return ''
  const number = Number(value)
  if (!Number.isFinite(number)) return ''
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number)
}

export function maskSalaryInput(value) {
  const digits = onlyDigits(value).slice(0, 12)
  return digits ? formatSalary(Number(digits) / 100) : ''
}

export function parseSalary(value) {
  const normalized = String(value || '').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  if (!normalized) return null
  const number = Number(normalized)
  if (!Number.isFinite(number) || number < 0) throw new Error('Informe uma pretensão salarial válida.')
  return number
}
