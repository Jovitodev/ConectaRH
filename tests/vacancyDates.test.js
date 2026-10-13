import {test} from 'node:test'
import assert from 'node:assert/strict'
import {daysBetween,deadlineLabel} from '../src/lib/vacancyDates.js'
test('prazos por datas civis, incluindo virada de mês e ano',()=>{
 assert.equal(daysBetween('2026-12-31','2027-01-01'),1)
 assert.equal(daysBetween('2024-02-28','2024-03-01'),2)
 assert.equal(daysBetween('', '2026-10-13'),null)
})
test('prazo correto para cada andamento, sem metas presumidas',()=>{
 assert.equal(deadlineLabel({andamento:'rs',previsao_entrega:'2026-10-15'},'2026-10-13'),'2 dia(s) restantes')
 assert.equal(deadlineLabel({andamento:'admissao',previsao_admissao:'2026-10-12'},'2026-10-13'),'1 dia(s) de atraso')
 assert.equal(deadlineLabel({andamento:'alinhamento',previsao_alinhamento:'2026-10-13'},'2026-10-13'),'Vence hoje')
 assert.equal(deadlineLabel({andamento:'entrevista_gestor'},'2026-10-13'),'Sem previsão')
 assert.equal(deadlineLabel({andamento:'suspensa',previsao_entrega:'2026-10-01'},'2026-10-13'),'Sem previsão')
})
