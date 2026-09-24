import { useEffect, useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { AppShell } from '@/components/app-shell'
import { CollaboratorShell } from '@/components/collaborator-shell'
import AuthScreen from '@/pages/AuthScreen.jsx'
import JobsSearch from '@/pages/JobsSearch.jsx'
import Applications from '@/pages/Applications.jsx'
import ProfileRegistration from '@/pages/ProfileRegistration.jsx'
import Resume from '@/pages/Resume.jsx'
import CandidateSettings from '@/pages/CandidateSettings.jsx'
import CandidateSupport from '@/pages/CandidateSupport.jsx'
import Dashboard from '@/pages/admin/Dashboard.jsx'
import Vacancies from '@/pages/admin/Vacancies.jsx'
import CreateVacancy from '@/pages/admin/CreateVacancy.jsx'
import EditVacancy from '@/pages/admin/EditVacancy.jsx'
import Templates from '@/pages/admin/Templates.jsx'
import CandidateBase from '@/pages/admin/CandidateBase.jsx'
import CandidateDetail from '@/pages/admin/CandidateDetail.jsx'
import Kanban from '@/pages/admin/Kanban.jsx'
import Agenda from '@/pages/admin/Agenda.jsx'
import Reports from '@/pages/admin/Reports.jsx'
import Team from '@/pages/admin/Team.jsx'
import Settings from '@/pages/admin/Settings.jsx'
import { user as initialUser, jobs, initialApplications } from '@/data/mockData.js'
import { colaborador as colaboradorUser } from '@/data/adminData.js'
import { readStore, writeStore, uid } from '@/lib/localStore.js'
import { loadCandidateResume, importLocalResumes, saveResumeItem, deleteResumeItem, saveProfessionalData, savePcdProfile } from '@/lib/candidateStore.js'
import { uploadAvatar, removeAvatar, uploadPcdPdf, removePcdPdf, signedPcdUrl } from '@/lib/profileFiles.js'

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
]

export default function App() {
  const [account, setAccount] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [activeTab, setActiveTab] = useState('jobs')
  const [adminView, setAdminView] = useState('dashboard')
  const [user, setUser] = useState(initialUser)
  const [applications, setApplications] = useState(initialApplications)
  const [resume, setResume] = useState(null)
  const [resumeLoaded, setResumeLoaded] = useState(false)
  const [resumeOwner, setResumeOwner] = useState(null)
  const [notifications, setNotifications] = useState(3)
  const [notificationItems, setNotificationItems] = useState([])

  useEffect(() => {
    getCurrentUser().then((sessionUser) => {
      if (sessionUser) {
        setAccount(sessionUser)
        setUser(sessionUser)
        const savedApplications = readStore(`candidate.applications.${sessionUser.id}`, null)
        if (savedApplications) setApplications(savedApplications)
        const savedNotifications = readStore(`candidate.notifications.${sessionUser.id}`, null)
        if (savedNotifications) { setNotificationItems(savedNotifications); setNotifications(savedNotifications.filter((n) => !n.read).length) }
      }
    }).finally(() => setLoadingSession(false))
  }, [])

  useEffect(() => {
    if (!account?.id) return
    writeStore(`candidate.applications.${account.id}`, applications)
    writeStore(`candidate.notifications.${account.id}`, notificationItems)
  }, [account?.id, applications, notificationItems])

  useEffect(() => {
    if (!account?.id) return
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

  const applyToJob = (jobId) => {
    const already = applications.find((a) => a.jobId === jobId)
    if (already) return
    const job = jobs.find((j) => j.id === jobId)
    if (!job) return
    const id = uid('app')
    const application = {
      id, jobId, resumeId: resume?.id, appliedAt: new Date().toISOString(), currentStep: 0,
      status: 'Em andamento', interviews: [], tasks: [], documents: [],
      history: [{ id: uid('history'), type: 'application', label: 'Candidatura enviada', date: new Date().toISOString(), description: `Candidatura enviada para ${job.title}.` }],
    }
    setApplications((prev) => [application, ...prev])
    setNotificationItems((prev) => [{ id: uid('notif'), title: 'Candidatura enviada', message: `Sua candidatura para ${job.title} foi registrada.`, read: false, createdAt: new Date().toISOString(), link: 'applications' }, ...prev])
    setNotifications((n) => n + 1)
  }

  const jobStepsList = (jobId) => {
    const job = jobs.find((j) => j.id === jobId)
    return job ? job.pipeline.steps : []
  }

  const jobSteps = (jobId) => {
    const job = jobs.find((j) => j.id === jobId)
    return job ? job.pipeline.totalSteps : 3
  }

  const setStep = (appId, step) => {
    setApplications((prev) => prev.map((a) => {
      if (a.id !== appId) return a
      const nextStep = Math.max(0, Math.min(step, jobSteps(a.jobId) - 1))
      if (nextStep === a.currentStep) return a
      const job = jobs.find((j) => j.id === a.jobId)
      const stage = job?.pipeline?.steps?.[nextStep] || 'Nova etapa'
      return { ...a, currentStep: nextStep, history: [...(a.history || []), { id: uid('history'), type: 'stage', label: `Avançou para ${stage}`, date: new Date().toISOString(), description: `A candidatura foi movida para ${stage}.` }] }
    }))
  }

  const updateApp = (appId, updater) => {
    setApplications((prev) => prev.map((a) => (a.id === appId ? updater(a) : a)))
  }

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

  const handleUploadAvatar = async (file) => {
    const avatar = await uploadAvatar(file)
    setUser((previous) => ({ ...previous, avatarPath: avatar.path, photoUrl: avatar.url }))
  }

  const handleRemoveAvatar = async () => {
    await removeAvatar()
    setUser((previous) => ({ ...previous, avatarPath: null, photoUrl: null }))
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

  const markNotificationsRead = () => {
    setNotificationItems((prev) => prev.map((n) => ({ ...n, read: true }))); setNotifications(0)
  }

  const handleLogout = () => {
    signOut()
    setAccount(null)
    setResume(null)
    setResumeOwner(null)
    setActiveTab('jobs')
    setAdminView('dashboard')
  }

  const isCollaborator = account?.account === 'colaborador'

  if (loadingSession) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando sessão...</div>

  return (
    <ThemeProvider defaultTheme="light">
      <Toaster position="top-right" richColors />

      {!account ? (
        <AuthScreen onAuthenticated={setAccount} />
      ) : isCollaborator ? (
        <CollaboratorShell
          user={colaboradorUser}
          notifications={notifications}
          notificationItems={notificationItems}
          onMarkNotificationsRead={markNotificationsRead}
          onLogout={handleLogout}
          view={adminView}
          onNavigate={setAdminView}
        >
          {adminView === 'dashboard' && <Dashboard onNavigate={setAdminView} />}
          {adminView === 'vacancies' && <Vacancies onNavigate={setAdminView} />}
          {adminView === 'vacancy-create' && (
            <CreateVacancy onBack={() => setAdminView('vacancies')} onDone={() => setAdminView('vacancies')} />
          )}
          {adminView === 'vacancy-edit' && (
            <EditVacancy onBack={() => setAdminView('vacancies')} onNavigate={setAdminView} />
          )}
          {adminView === 'templates' && <Templates onNavigate={setAdminView} />}
          {adminView === 'candidates' && <CandidateBase onNavigate={setAdminView} />}
          {adminView === 'candidate-detail' && (
            <CandidateDetail onBack={() => setAdminView('candidates')} onNavigate={setAdminView} />
          )}
          {adminView === 'kanban' && <Kanban onNavigate={setAdminView} />}
          {adminView === 'agenda' && <Agenda />}
          {adminView === 'reports' && <Reports />}
          {adminView === 'team' && <Team />}
          {adminView === 'settings' && <Settings />}
        </CollaboratorShell>
      ) : (
        <AppShell
          tabs={candidateTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          user={user}
          notifications={notifications}
          notificationItems={notificationItems}
          onMarkNotificationsRead={markNotificationsRead}
          onLogout={handleLogout}
        >
          {activeTab === 'jobs' && <JobsSearch jobs={jobs} applications={applications} onApply={applyToJob} />}
          {activeTab === 'applications' && (
            <Applications
              applications={applications}
              jobs={jobs}
              jobStepsList={jobStepsList}
              updateApp={updateApp}
              setStep={setStep}
            />
          )}
          {activeTab === 'profile' && (resumeLoaded && resume && resumeOwner === account.id
            ? <ProfileRegistration key={user.id} user={user} onSave={handleProfileSave} onLogout={handleLogout} onUploadAvatar={handleUploadAvatar} onRemoveAvatar={handleRemoveAvatar} onOpenPcd={handleOpenPcd} />
            : <p className="p-5 text-sm text-muted-foreground">Carregando perfil...</p>)}
          {activeTab === 'resumes' && (resumeLoaded && resume && resumeOwner === account.id
            ? <Resume user={user} resume={resume} onSaveItem={handleSaveResumeItem} onDeleteItem={handleDeleteResumeItem} onSaveProfessional={handleSaveProfessional} />
            : <p className="p-5 text-sm text-muted-foreground">Carregando currículo...</p>)}
          {activeTab === 'settings' && <CandidateSettings onNavigate={setActiveTab} />}
          {activeTab === 'support' && <CandidateSupport />}
        </AppShell>
      )}
    </ThemeProvider>
  )
}
