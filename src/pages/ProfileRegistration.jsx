import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { resetPassword } from '@/lib/authStore.js'
import { maskCpf, maskPhone, onlyDigits, validPhone } from '@/lib/inputMasks.js'
import { validatePcd } from '@/lib/pcdRules.js'

const disabilityOptions = [
  'Deficiência física', 'Deficiência visual', 'Baixa visão', 'Cegueira', 'Deficiência auditiva', 'Surdez',
  'Deficiência intelectual', 'Deficiência psicossocial', 'Deficiência múltipla',
  'Transtorno do Espectro Autista (TEA)',
]

export default function ProfileRegistration({ user, onSave, onLogout, onUploadAvatar, onRemoveAvatar, onOpenPcd }) {
  const fileRef = useRef(null)
  const [form, setForm] = useState({ name: user.name || '', birthDate: user.birthDate || '', cpf: maskCpf(user.cpf), email: user.email || '', phone: maskPhone(user.phone), linkedin: user.linkedin || '' })
  const [pcdAnswer, setPcdAnswer] = useState(user.pcd === null || user.pcd === undefined ? '' : user.pcd ? 'yes' : 'no')
  const [disabilityType, setDisabilityType] = useState(user.disabilityType || '')
  const [pcdFile, setPcdFile] = useState(null)
  const [documentPath, setDocumentPath] = useState(user.pcdDocumentPath || null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  const uploadPhoto = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotoBusy(true)
    try { await onUploadAvatar(file); toast.success('Foto de perfil atualizada.') }
    catch (error) { toast.error(error.message || 'Não foi possível enviar a foto.') }
    finally { setPhotoBusy(false); event.target.value = '' }
  }
  const removePhoto = async () => {
    if (!window.confirm('Remover sua foto de perfil?')) return
    setPhotoBusy(true)
    try { await onRemoveAvatar(); toast.success('Foto removida.') }
    catch (error) { toast.error(error.message || 'Não foi possível remover a foto.') }
    finally { setPhotoBusy(false) }
  }
  const save = async (event) => {
    event.preventDefault()
    if (form.name.trim().length < 3) return toast.error('Informe seu nome completo.')
    if (form.phone && !validPhone(form.phone)) return toast.error('Informe um telefone com DDD válido.')
    if (form.cpf && onlyDigits(form.cpf).length !== 11) return toast.error('O CPF deve ter 11 dígitos.')
    try { validatePcd(pcdAnswer ? pcdAnswer === 'yes' : null, disabilityType, Boolean(pcdFile || documentPath)) }
    catch (error) { return toast.error(error.message) }
    setSaving(true)
    try {
      const result = await onSave({ ...form, pcd: pcdAnswer === 'yes', disabilityType, pcdFile, documentPath })
      if (result?.documentPath) setDocumentPath(result.documentPath)
      setPcdFile(null)
      toast.success(result?.emailChangePending ? 'Dados salvos. Confirme a alteração de e-mail pela mensagem enviada.' : 'Dados pessoais atualizados.')
    } catch (error) { toast.error(error.message || 'Não foi possível salvar o perfil.') }
    finally { setSaving(false) }
  }
  const changePassword = async (event) => {
    event.preventDefault()
    if (password.length < 8) return toast.error('A senha deve ter pelo menos 8 caracteres.')
    if (password !== confirm) return toast.error('As senhas não coincidem.')
    setSaving(true)
    try { await resetPassword(password); setPassword(''); setConfirm(''); toast.success('Senha alterada com sucesso.') }
    catch (error) { toast.error(error.message || 'Não foi possível alterar a senha.') }
    finally { setSaving(false) }
  }
  return <div className="space-y-5">
    <div className="flex items-center gap-4"><Avatar className="h-16 w-16"><AvatarImage src={user.photoUrl || undefined} alt={`Foto de ${user.name}`} /><AvatarFallback className="bg-primary/15 font-semibold text-primary">{(user.name || '').split(' ').map((part) => part[0]).slice(0, 2).join('')}</AvatarFallback></Avatar><div><h1 className="font-poppins text-2xl font-semibold">Meu Perfil</h1><p className="text-sm text-muted-foreground">Seus dados pessoais e acesso à conta.</p></div></div>
    <Card className="space-y-3 p-5"><h2 className="font-poppins font-semibold">Foto de perfil</h2><p className="text-xs text-muted-foreground">JPG, PNG ou WebP, até 2 MB.</p><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadPhoto} /><div className="flex gap-2"><Button type="button" variant="outline" disabled={photoBusy} onClick={() => fileRef.current?.click()}>{user.avatarPath ? 'Alterar foto' : 'Adicionar foto'}</Button>{user.avatarPath && <Button type="button" variant="ghost" disabled={photoBusy} onClick={removePhoto}>Remover foto</Button>}</div></Card>
    <form onSubmit={save} className="space-y-5">
      <Card className="space-y-4 p-5"><h2 className="font-poppins font-semibold">Dados pessoais</h2><div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="profile-name">Nome completo</Label><Input id="profile-name" value={form.name} onChange={set('name')} required /></div>
        <div className="space-y-1.5"><Label htmlFor="profile-birth">Data de nascimento</Label><Input id="profile-birth" type="date" value={form.birthDate} onChange={set('birthDate')} /></div>
        <div className="space-y-1.5"><Label htmlFor="profile-cpf">CPF</Label><Input id="profile-cpf" inputMode="numeric" maxLength={14} value={form.cpf} onChange={(e) => setForm((current) => ({ ...current, cpf: maskCpf(e.target.value) }))} placeholder="000.000.000-00" /></div>
      </div></Card>
      <Card className="space-y-4 p-5"><h2 className="font-poppins font-semibold">Contato</h2><div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="profile-email">E-mail</Label><Input id="profile-email" type="email" value={form.email} onChange={set('email')} required /></div>
        <div className="space-y-1.5"><Label htmlFor="profile-phone">Telefone / WhatsApp</Label><Input id="profile-phone" inputMode="numeric" maxLength={15} value={form.phone} onChange={(e) => setForm((current) => ({ ...current, phone: maskPhone(e.target.value) }))} placeholder="(11) 99999-9999" /></div>
      </div></Card>
      <Card className="space-y-4 p-5"><h2 className="font-poppins font-semibold">Rede profissional</h2><div className="space-y-1.5"><Label htmlFor="profile-linkedin">LinkedIn</Label><Input id="profile-linkedin" value={form.linkedin} onChange={set('linkedin')} placeholder="linkedin.com/in/seuperfil" /></div></Card>
      <Card className="space-y-4 p-5"><h2 className="font-poppins font-semibold">Pessoa com Deficiência (PcD)</h2><fieldset><legend className="text-sm font-medium">Você é Pessoa com Deficiência (PcD)? <span className="text-destructive">*</span></legend><div className="mt-2 flex gap-5"><label className="flex items-center gap-2 text-sm"><input type="radio" name="pcd" checked={pcdAnswer === 'yes'} onChange={() => setPcdAnswer('yes')} />Sim</label><label className="flex items-center gap-2 text-sm"><input type="radio" name="pcd" checked={pcdAnswer === 'no'} onChange={() => setPcdAnswer('no')} />Não</label></div></fieldset>
        {pcdAnswer === 'yes' && <div className="space-y-4 border-t pt-4">
          <div className="space-y-1.5"><Label htmlFor="disability-type">Qual é a sua deficiência? <span className="text-destructive">*</span></Label><Input id="disability-type" list="disability-options" value={disabilityType} onChange={(e) => setDisabilityType(e.target.value)} placeholder="Digite ou escolha uma opção" required /><datalist id="disability-options">{disabilityOptions.map((option) => <option key={option} value={option} />)}</datalist></div>
          <div className="space-y-1.5"><Label htmlFor="pcd-proof">Comprovante de PcD (PDF) <span className="text-destructive">*</span></Label><Input id="pcd-proof" type="file" accept="application/pdf,.pdf" onChange={(e) => setPcdFile(e.target.files?.[0] || null)} /><p className="text-xs text-muted-foreground">Até 5 MB. Apenas você pode acessar este arquivo.</p>{documentPath && <Button type="button" variant="outline" size="sm" onClick={() => onOpenPcd(documentPath)}>Visualizar comprovante atual</Button>}{pcdFile && <p className="text-xs">Novo arquivo: {pcdFile.name}</p>}</div>
        </div>}
        {pcdAnswer === 'no' && documentPath && <p className="text-xs text-muted-foreground">O comprovante anterior permanecerá privado e não será apagado automaticamente.</p>}
      </Card>
      <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar dados'}</Button>
    </form>
    <Card className="space-y-4 p-5"><h2 className="font-poppins font-semibold">Segurança da conta</h2><form onSubmit={changePassword} className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="profile-password">Nova senha</Label><Input id="profile-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="profile-confirm">Confirmar nova senha</Label><Input id="profile-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div><div className="sm:col-span-2"><Button type="submit" variant="outline" disabled={saving}>Alterar senha</Button></div></form></Card>
    <Card className="space-y-3 p-5"><h2 className="font-poppins font-semibold">Configurações da conta</h2><Button variant="outline" onClick={onLogout}>Sair da conta</Button></Card>
  </div>
}
