export function validatePcd(pcd, disabilityType, hasProof) {
  if (typeof pcd !== 'boolean') throw new Error('Responda se você é Pessoa com Deficiência (PcD).')
  if (pcd && !disabilityType?.trim()) throw new Error('Informe o tipo de deficiência.')
  if (pcd && !hasProof) throw new Error('Envie o comprovante de PcD em PDF.')
}
