export function daysBetween(start,end) {
 return start && end ? Math.round((Date.parse(end+'T00:00:00Z')-Date.parse(start+'T00:00:00Z'))/86400000) : null
}
export const deadlineField={alinhamento:'previsao_alinhamento',rs:'previsao_entrega',entrevista_gestor:'previsao_entrevista',admissao:'previsao_admissao'}
export function deadlineLabel(row,today) {
 const due=row[deadlineField[row.andamento]]
 if(!due)return 'Sem previsão'
 const days=daysBetween(today,due)
 return days===0?'Vence hoje':days<0?`${-days} dia(s) de atraso`:`${days} dia(s) restantes`
}
