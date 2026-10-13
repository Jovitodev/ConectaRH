import assert from 'node:assert/strict'
import test from 'node:test'
import { validCnpj, maskCnpj } from '../src/lib/commercialValidation.js'

test('aceita CNPJ numérico válido e rejeita dígito alterado',()=>{
  assert.equal(validCnpj('11.222.333/0001-81'),true)
  assert.equal(validCnpj('11.222.333/0001-82'),false)
})
test('aceita o exemplo alfanumérico publicado pela Receita Federal',()=>{
  assert.equal(validCnpj('00.000.000/E08G-12'),true)
  assert.equal(validCnpj('00.000.000/E08G-13'),false)
})
test('rejeita sequências repetidas, tamanhos incorretos e ausência de documento',()=>{
  for(const document of ['00000000000000','11111111111111','1122233300018','112223330001810','']) assert.equal(validCnpj(document),false)
})
test('máscara mantém letras, números e separadores nas posições corretas',()=>{
  assert.equal(maskCnpj('11222333000181'),'11.222.333/0001-81')
  assert.equal(maskCnpj('00000000e08g12'),'00.000.000/E08G-12')
  assert.equal(maskCnpj('11222'),'11.222')
})
