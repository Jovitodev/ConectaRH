import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase.js'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const pageSize = 12

export default function CommercialPortal({ user, onLogout }) {
  const [companies, setCompanies] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(0)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    supabase.from('empresas').select('id,nome,ativa,created_at', { count: 'exact' })
      .order('nome').range(page * pageSize, (page + 1) * pageSize - 1)
      .then(({ data, count: total, error }) => {
        if (error) throw error
        if (active) { setCompanies(data || []); setCount(total || 0) }
      }).catch((error) => toast.error('Não foi possível carregar empresas: ' + error.message))
    return () => { active = false }
  }, [page, revision])

  const addCompany = async (event) => {
    event.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      const { error } = await supabase.from('empresas').insert({ nome: name.trim(), cadastrada_por: user.id }).select('id').single()
      if (error) throw error
      setName('')
      setPage(0)
      setRevision((current) => current + 1)
      toast.success('Empresa cadastrada no Supabase.')
    } catch (error) { toast.error('Não foi possível cadastrar: ' + error.message) }
    finally { setBusy(false) }
  }

  const setActive = async (company) => {
    const { error } = await supabase.from('empresas').update({ ativa: !company.ativa, updated_at: new Date().toISOString() }).eq('id', company.id).select('id').single()
    if (error) toast.error('Não foi possível atualizar: ' + error.message)
    else setRevision((current) => current + 1)
  }

  return <main className="min-h-screen bg-background">
    <header className="border-b bg-card"><div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4"><div><p className="font-poppins text-xl font-bold">Conecta<span className="text-primary">RH</span></p><p className="text-xs text-muted-foreground">Área Comercial · Empresas</p></div><Button variant="outline" onClick={onLogout}>Sair</Button></div></header>
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div><h1 className="font-poppins text-2xl font-semibold">Empresas</h1><p className="text-sm text-muted-foreground">Cadastre as empresas que poderão ser selecionadas nas vagas.</p></div>
      <Card className="p-5"><form onSubmit={addCompany} className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="flex-1 space-y-1.5"><Label htmlFor="company-name">Nome da empresa</Label><Input id="company-name" required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} /></div><Button disabled={busy}>{busy ? 'Salvando...' : 'Cadastrar empresa'}</Button></form></Card>
      <Card className="divide-y">{companies.length === 0 ? <p className="p-5 text-sm text-muted-foreground">Nenhuma empresa nesta página.</p> : companies.map((company) => <div key={company.id} className="flex items-center justify-between gap-3 p-4"><div><p className="font-medium">{company.nome}</p><p className="text-xs text-muted-foreground">{company.ativa ? 'Ativa' : 'Inativa'}</p></div><Button variant="outline" size="sm" onClick={() => setActive(company)}>{company.ativa ? 'Desativar' : 'Ativar'}</Button></div>)}</Card>
      {count > pageSize && <div className="flex items-center justify-end gap-2 text-sm"><span>Página {page + 1} de {Math.ceil(count / pageSize)}</span><Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</Button><Button variant="outline" size="sm" disabled={(page + 1) * pageSize >= count} onClick={() => setPage(page + 1)}>Próxima</Button></div>}
    </div>
  </main>
}
