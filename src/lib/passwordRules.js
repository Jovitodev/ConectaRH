export const passwordRules = [
  ['Mínimo de 8 caracteres', (value) => value.length >= 8],
  ['Uma letra maiúscula', (value) => /[A-Z]/.test(value)],
  ['Um número', (value) => /\d/.test(value)],
  ['Um caractere especial', (value) => /[^\p{L}\p{N}\s]/u.test(value)],
]

export function validatePassword(password) {
  if (!passwordRules.every(([, check]) => check(password))) throw new Error('A senha deve cumprir todos os requisitos exibidos.')
}
