import { useEffect, useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { AppShell } from '@/components/app-shell'
import { CollaboratorShell } from '@/components/collaborator-shell'
import AuthScreen from '@/pages/AuthScreen.jsx'
import JobsSearch from '@/pages/JobsSearch.jsx'
import Applications from '@/pages/Applications.jsx'
import ProfileRegistration from '@/pages/ProfileRegistration.jsx'
import Resume from '@/pages/Resume.jsx'
import ResumeOnboarding from '@/pages/ResumeOnboarding.jsx'
import CandidateSettings from '@/pages/CandidateSettings.jsx'
import CandidateSupport from '@/pages/CandidateSupport.jsx'
import CandidateMessages from '@/pages/CandidateMessages.jsx'
import CollaboratorLogin from '@/pages/CollaboratorLogin.jsx'
import CommercialPortal from '@/pages/CommercialPortal.jsx'
import Dashboard from '@/pages/admin/Dashboard.jsx'
import Vacancies from '@/pages/admin/Vacancies.jsx'
import CreateVacancy from '@/pages/admin/CreateVacancy.jsx'
import EditVacancy from '@/pages/admin/EditVacancy.jsx'
import Templates from '@/pages/admin/Templates.jsx'
import RecruitmentCandidates from '@/pages/admin/RecruitmentCandidates.jsx'
import VacancyApplications from '@/pages/admin/VacancyApplications.jsx'
import Kanban from '@/pages/admin/Kanban.jsx'
import Agenda from '@/pages/admin/Agenda.jsx'
import Reports from '@/pages/admin/Reports.jsx'
import Team from '@/pages/admin/Team.jsx'
import Settings from '@/pages/admin/Settings.jsx'
import { user as initialUser } from '@/data/mockData.js'
import { readStore, writeStore } from '@/lib/localStore.js'
import { loadCandidateResume, importLocalResumes, saveResumeItem, deleteResumeItem, saveProfessionalData, savePcdProfile, completeInitialResume } from '@/lib/candidateStore.js'
import { uploadPcdPdf, removePcdPdf, signedPcdUrl } from '@/lib/profileFiles.js'
import { loadAreas, loadNotifications, markNotificationsRead } from '@/lib/candidateExtras.js'
import { syncCandidateCompleteness } from '@/lib/candidateCompleteness.js'
import { enrollmentStatus } from '@/lib/jobSearchRules.js'
import { RECRUITMENT_PAGE_SIZE, applyToVacancy, loadAppliedVacancyIds, loadPublicVacancies, toPublicJob } from '@/lib/recruitmentStore.js'

import {
  getCurrentUser,
  signOut,
  updateCurrentProfile,
  updateCurrentCandidate,
} from '@/lib/authStore.js'

const candidateTabs = [
  { id: 'jobs', label: 'Buscar Vagas', icon: 'search' },
  { id: 'applications', label: 'Minhas Candidaturas', icon: 'briefcase' },
  { id: 'profile', label: 'Meu Perfil', icon: 'profile' },
  { id: 'resumes', label: 'Meu Currículo', icon: 'resumes', highlight: true },
  { id: 'settings', label: 'Configurações', icon: 'settings' },
  { id: 'support', label: 'Suporte', icon: 'support' },
  { id: 'messages', label: 'Central de Mensagens', icon: 'messages' },
]

export default function App() {
  const [account, setAccount] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [activeTab, setActiveTab] = useState('jobs')
  const [adminView, setAdminView] = useState('dashboard')
  const [user, setUser] = useState(initialUser)
  const [realJobs, setRealJobs] = useState([])
  const [publicPage, setPublicPage] = useState(0)
  const [publicCount, setPublicCount] = useState(0)
  const [appliedVacancyIds, setAppliedVacancyIds] = useState([])
  const [applicationRevision, setApplicationRevision] = useState(0)
  const [editingVacancyId, setEditingVacancyId] = useState(null)
  const [selectedVacancyId, setSelectedVacancyId] = useState(null)
  const [vacancyFilter, setVacancyFilter] = useState({ filter: 'todas', status: 'todas' })
  const [agendaDate, setAgendaDate] = useState('')
  const [resume, setResume] = useState(null)
  const [resumeLoaded, setResumeLoaded] = useState(false)
  const [resumeOwner, setResumeOwner] = useState(null)
  const [notificationItems, setNotificationItems] = useState([])
  const [candidateAreas, setCandidateAreas] = useState([])
  const [route, setRoute] = useState(window.location.pathname)
  const [pendingJobId, setPendingJobId] = useState(null)
  const navigate = (path) => { window.history.pushState({}, '', path); setRoute(path) }

  useEffect(() => {
    const onPopState = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    getCurrentUser().then((sessionUser) => {
      if (sessionUser) {
        setAccount(sessionUser)
        setUser(sessionUser)
      }
    }).finally(() => setLoadingSession(false))
  }, [])

  useEffect(() => {
    let active = true
    loadPublicVacancies(publicPage).then(({ rows, count }) => { if (active) { setRealJobs(rows.map(toPublicJob)); setPublicCount(count) } }).catch((error) => toast.error('Não foi possível carregar vagas reais: ' + error.message))
    return () => { active = false }
  }, [account?.id, publicPage])

  useEffect(() => {
    if (account?.account !== 'candidato' || realJobs.length === 0) { setAppliedVacancyIds([]); return }
    loadAppliedVacancyIds(realJobs.map((job) => Number(job.id.slice(3)))).then(setAppliedVacancyIds).catch((error) => toast.error('Não foi possível verificar candidaturas: ' + error.message))
  }, [account?.id, account?.account, realJobs, applicationRevision])

  useEffect(() => {
    if (!account || account.account !== 'candidato') return
    syncCandidateCompleteness().then(loadNotifications).then(setNotificationItems).catch((error) => toast.error('Não foi possível atualizar mensagens: ' + error.message))
  }, [account?.id, user?.id, user?.profileProgress, resume])

  useEffect(() => {
    if (!account || account.account !== 'candidato' || activeTab !== 'jobs') return
    loadAreas().then(({ areas, selectedIds }) => setCandidateAreas(areas.filter((area) => selectedIds.includes(area.id)).map((area) => area.nome))).catch(console.error)
  }, [account?.id, activeTab])

  useEffect(() => {
    if (!account?.id || account.account !== 'candidato') return
    let cancelled = false
    setResumeLoaded(false)
    ;(async () => {
      try {
        let loaded = await loadCandidateResume()
        const legacy = [
          ...(readStore(`candidate.resumes.${account.id}`, []) || []),
          ...(account.auth_user_id && account.auth_user_id !== account.id
            ? readStore(`candidate.resumes.${account.auth_user_id}`, []) || []
            : []),
        ]
        const marker = `candidate.resumeMigration.v2.${account.id}`
        if (legacy?.length && !readStore(marker, false)) {
          const skipped = await importLocalResumes(legacy, loaded.resume)
          writeStore(marker, true)
          loaded = await loadCandidateResume()
          if (skipped && !cancelled) toast.warning(`${skipped} experiência(s) local(is) sem data válida ficaram na cópia do navegador.`)
        }
        if (!cancelled) { setUser(loaded.user); setResume(loaded.resume); setResumeOwner(account.id) }
      } catch (error) {
        console.error(error)
        if (!cancelled) toast.error('Não foi possível carregar o currículo: ' + error.message)
      } finally { if (!cancelled) setResumeLoaded(true) }
    })()
    return () => { cancelled = true }
  }, [account?.id])

  useEffect(() => {
    if (!account || account.account !== 'candidato' || !resumeLoaded || resumeOwner !== account.id) return
    if (user.profileProgress === 0 && route !== '/cadastro-curriculo') navigate('/cadastro-curriculo')
    if (user.profileProgress > 0 && route === '/cadastro-curriculo') navigate('/')
  }, [account?.id, resumeLoaded, resumeOwner, user.profileProgress, route])

  const applyToJob = async (jobId) => {
    if (!account) { setPendingJobId(jobId); navigate('/login'); return false }
    if (account.account !== 'candidato' || !resumeLoaded || !resume || resumeOwner !== account.id || !Number(user.profileProgress)) {
      setPendingJobId(jobId); navigate('/cadastro-curriculo'); return false
    }
    const already = appliedVacancyIds.includes(Number(String(jobId).slice(3)))
    if (already) return false
    const job = realJobs.find((j) => j.id === jobId)
    if (!job) return false
    if (enrollmentStatus(job) !== 'aberta') { toast.error('Esta vaga está fora do período de inscrição.'); return false }
    await applyToVacancy(Number(String(jobId).slice(3)))
    setAppliedVacancyIds((current) => [...current, Number(String(jobId).slice(3))])
    setApplicationRevision((current) => current + 1)
    return true
  }

  useEffect(() => {
    if (!pendingJobId || !account || account.account !== 'candidato' || !resumeLoaded || resumeOwner !== account.id || user.profileProgress === 0) return
    applyToJob(pendingJobId).then((applied) => { if (applied) toast.success('Candidatura confirmada!') }).catch((error) => toast.error('Não foi possível candidatar-se: ' + error.message))
    setPendingJobId(null)
  }, [pendingJobId, account?.id, resumeLoaded, resumeOwner, user.profileProgress])

  const handleProfileSave = async (values) => {
    let newDocumentPath = null
    let pcdSaved = false
    const oldDocumentPath = user.pcdDocumentPath
    try {
      if (values.pcd && values.pcdFile) newDocumentPath = await uploadPcdPdf(values.pcdFile)
      const documentPath = newDocumentPath || values.documentPath
      await savePcdProfile({ pcd: values.pcd, disabilityType: values.disabilityType, documentPath })
      pcdSaved = true
      const result = await updateCurrentProfile(values)
      await updateCurrentCandidate({ linkedin: values.linkedin })
      const loaded = await loadCandidateResume()
      setUser(loaded.user)
      if (newDocumentPath && oldDocumentPath && oldDocumentPath !== newDocumentPath) {
        try { await removePcdPdf(oldDocumentPath) }
        catch (error) { console.error('Não foi possível remover o comprovante anterior.', error) }
      }
      return { ...result, documentPath: loaded.user.pcdDocumentPath }
    } catch (error) {
      if (newDocumentPath && !pcdSaved) await removePcdPdf(newDocumentPath)
      if (pcdSaved) {
        try { setUser((await loadCandidateResume()).user) } catch (reloadError) { console.error(reloadError) }
      }
      throw error
    }
  }

  const handleOpenPcd = async (path) => {
    const tab = window.open('', '_blank')
    try {
      const url = await signedPcdUrl(path)
      if (tab) tab.location.href = url
      else window.location.href = url
    } catch (error) {
      tab?.close()
      toast.error(error.message || 'Não foi possível abrir o comprovante.')
    }
  }

  const handleSaveProfessional = async (values) => {
    await saveProfessionalData(values)
    setUser((previous) => ({ ...previous, ...values }))
  }

  const handleSaveResumeItem = async (section, item) => {
    const saved = await saveResumeItem(section, item)
    setResume((previous) => ({ ...previous, [section]: item.id
      ? previous[section].map((entry) => entry.id === item.id ? saved : entry)
      : [...previous[section], saved] }))
  }

  const handleDeleteResumeItem = async (section, id) => {
    await deleteResumeItem(section, id)
    setResume((previous) => ({ ...previous, [section]: previous[section].filter((entry) => entry.id !== id) }))
  }

  const markRead = async (ids) => {
    await markNotificationsRead(ids)
    setNotificationItems((prev) => prev.map((item) => ids.includes(item.id) ? { ...item, lida: true } : item))
  }
  const markAllRead = () => markRead(notificationItems.filter((item) => !item.lida).map((item) => item.id))
  const refreshNotifications = async () => { await syncCandidateCompleteness(); setNotificationItems(await loadNotifications()) }
  const openNotification = async (item) => {
    if (!item.lida) await markRead([item.id])
    const [destination, section] = (item.destino || '').split(':')
    if (destination === 'profile') setActiveTab('profile')
    if (destination === 'resume') { setActiveTab('resumes'); if (section) setTimeout(() => document.querySelector(`[data-resume-section="${section}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100) }
  }

  const handleLogout = async () => {
    try { await signOut() }
    catch (error) { toast.error(error.message || 'Não foi possível sair da conta.'); return }
    setAccount(null)
    setResume(null)
    setResumeOwner(null)
    setActiveTab('jobs')
    setAdminView('dashboard')
    navigate('/')
  }

  const handleAuthenticated = async (authenticated) => {
    const current = authenticated.account === 'candidato' ? (await getCurrentUser()) || authenticated : authenticated
    setAccount(current)
    setUser(current)
    setResumeLoaded(false)
    if (current.account === 'colaborador') navigate('/colaborador')
    else if (current.account === 'comercial') navigate('/comercial')
    else navigate('/')
  }

  const handleFinishOnboarding = async (redirect = false, verified = null) => {
    if (redirect) { if (verified?.user) { setUser(verified.user); setResume(verified.resume) }; setPendingJobId(null); navigate('/'); return }
    await completeInitialResume()
    const reloaded = await loadCandidateResume()
    if (reloaded.user.profileProgress !== 100 || !reloaded.user.cityId || !reloaded.user.stateId) throw new Error('O currículo não foi confirmado após recarregar os dados do banco.')
    return reloaded
  }

  const isCollaborator = account?.account === 'colaborador'
  const isCommercial = account?.account === 'comercial'
  const openVacancyApplications = (id) => { setSelectedVacancyId(id); setAdminView('vacancy-applications') }
  const editVacancy = (id) => { setEditingVacancyId(id); setAdminView('vacancy-edit') }
  const navigateAdmin = (view) => {
    if (view === 'vacancies') setVacancyFilter({ filter: 'todas', status: 'todas' })
    if (view === 'agenda') setAgendaDate('')
    setAdminView(view)
  }

  if (loadingSession) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando sessão...</div>

  return (
    <ThemeProvider defaultTheme="light">
      <TooltipProvider delayDuration={300}>
      <Toaster position="top-right" richColors />

      {!account ? (
        route === '/colaborador/login' || route === '/comercial/login' ? <CollaboratorLogin onAuthenticated={handleAuthenticated} onCandidateLogin={() => navigate('/login')} />
          : route === '/login' || route === '/cadastro' || route === '/cadastro-curriculo' ? <AuthScreen key={route} initialMode={route === '/cadastro' ? 'signup' : 'signin'} onAuthenticated={handleAuthenticated} onBack={() => navigate('/')} />
            : <main className="min-h-screen bg-background"><header className="border-b bg-card"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4"><div><p className="font-poppins text-xl font-bold">Conecta<span className="text-primary">RH</span></p><p className="text-xs text-muted-foreground">Encontre sua próxima oportunidade</p></div><div className="flex gap-2"><button className="rounded-md px-4 py-2 text-sm font-medium text-primary" onClick={() => navigate('/login')}>Entrar</button><button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" onClick={() => navigate('/cadastro')}>Criar conta</button></div></div></header><div className="mx-auto max-w-7xl space-y-6 px-4 py-8"><div><h1 className="font-poppins text-3xl font-semibold">Buscar vagas</h1><p className="text-muted-foreground">Explore oportunidades sem precisar entrar.</p></div><JobsSearch jobs={realJobs} applications={[]} onApply={applyToJob} page={publicPage} total={publicCount} pageSize={RECRUITMENT_PAGE_SIZE} onPageChange={setPublicPage} /></div></main>
      ) : isCommercial ? <CommercialPortal user={account} onLogout={handleLogout} /> : isCollaborator ? (
        <CollaboratorShell
          user={account}
          notifications={0}
          notificationItems={notificationItems}
          onMarkNotificationsRead={() => {}}
          onLogout={handleLogout}
          view={adminView}
          onNavigate={navigateAdmin}
        >
          {['templates', 'reports', 'team', 'settings'].includes(adminView) && <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Esta tela contém dados e ações demonstrativos de uma funcionalidade futura.</p>}
          {adminView === 'dashboard' && <Dashboard onNavigate={navigateAdmin} onVacancies={(filter,status) => { setVacancyFilter({filter,status});setAdminView('vacancies') }} onAgenda={(date) => {setAgendaDate(date);setAdminView('agenda')}} onOpen={openVacancyApplications} />}
          {adminView === 'vacancies' && <Vacancies onNavigate={navigateAdmin} onEdit={editVacancy} onOpen={openVacancyApplications} filter={vacancyFilter.filter} status={vacancyFilter.status} />}
          {adminView === 'vacancy-applications' && selectedVacancyId && <VacancyApplications key={selectedVacancyId} vacancyId={selectedVacancyId} onBack={() => setAdminView('vacancies')} />}
          {adminView === 'vacancy-create' && (
            <CreateVacancy onBack={() => setAdminView('vacancies')} onDone={() => setAdminView('vacancies')} />
          )}
          {adminView === 'vacancy-edit' && (
            <EditVacancy vacancyId={editingVacancyId} onBack={() => setAdminView('vacancies')} onSaved={() => setAdminView('vacancies')} />
          )}
          {adminView === 'templates' && <Templates onNavigate={setAdminView} />}
          {adminView === 'candidates' && <RecruitmentCandidates onEdit={editVacancy} />}
          {adminView === 'candidate-detail' && <RecruitmentCandidates onEdit={editVacancy} />}
          {adminView === 'kanban' && <Kanban onEdit={editVacancy} />}
          {adminView === 'agenda' && <Agenda key={agendaDate} initialDate={agendaDate} onOpen={openVacancyApplications} />}
          {adminView === 'reports' && <Reports />}
          {adminView === 'team' && <Team />}
          {adminView === 'settings' && <Settings />}
        </CollaboratorShell>
      ) : route === '/cadastro-curriculo' || (resumeLoaded && resumeOwner === account.id && user.profileProgress === 0) ? (
        resumeLoaded && resume && resumeOwner === account.id
          ? <ResumeOnboarding user={user} resume={resume} onSaveItem={handleSaveResumeItem} onDeleteItem={handleDeleteResumeItem} onSaveProfessional={handleSaveProfessional} onRefreshNotifications={refreshNotifications} onFinish={handleFinishOnboarding} onLogout={handleLogout} />
          : <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando currículo...</div>
      ) : (
        <AppShell
          tabs={candidateTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          user={user}
          notifications={notificationItems.filter((item) => !item.lida).length}
          notificationItems={notificationItems}
          onMarkNotificationsRead={markAllRead}
          onOpenMessages={() => setActiveTab('messages')}
          onLogout={handleLogout}
        >
          {activeTab === 'jobs' && <JobsSearch jobs={realJobs} applications={appliedVacancyIds.map((id) => ({ jobId: `db-${id}` }))} onApply={applyToJob} candidateAreas={candidateAreas} page={publicPage} total={publicCount} pageSize={RECRUITMENT_PAGE_SIZE} onPageChange={setPublicPage} />}
          {activeTab === 'applications' && (
            <Applications key={applicationRevision} />
          )}
          {activeTab === 'profile' && (resumeLoaded && resume && resumeOwner === account.id
            ? <ProfileRegistration key={user.id} user={user} onSave={handleProfileSave} onLogout={handleLogout} onOpenPcd={handleOpenPcd} />
            : <p className="p-5 text-sm text-muted-foreground">Carregando perfil...</p>)}
          {activeTab === 'resumes' && (resumeLoaded && resume && resumeOwner === account.id
            ? <Resume user={user} resume={resume} onSaveItem={handleSaveResumeItem} onDeleteItem={handleDeleteResumeItem} onSaveProfessional={handleSaveProfessional} onRefreshNotifications={refreshNotifications} />
            : <p className="p-5 text-sm text-muted-foreground">Carregando currículo...</p>)}
          {activeTab === 'settings' && <CandidateSettings onNavigate={setActiveTab} />}
          {activeTab === 'support' && <CandidateSupport />}
          {activeTab === 'messages' && <CandidateMessages items={notificationItems} onMarkRead={markRead} onOpen={openNotification} />}
        </AppShell>
      )}
      </TooltipProvider>
    </ThemeProvider>
  )
}
