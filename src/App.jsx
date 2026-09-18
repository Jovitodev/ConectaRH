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
import { user as initialUser, jobs, initialApplications, initialResume } from '@/data/mockData.js'
import { colaborador as colaboradorUser } from '@/data/adminData.js'
import { readStore, writeStore, uid } from '@/lib/localStore.js'
import { getCurrentUser, signOut, updateCurrentProfile } from '@/lib/authStore.js'

const candidateTabs = [
  { id: 'jobs', label: 'Buscar Vagas', icon: 'search' },
  { id: 'applications', label: 'Minhas Candidaturas', icon: 'briefcase' },
  { id: 'profile', label: 'Meu Perfil', icon: 'profile' },
  { id: 'resumes', label: 'Currículos', icon: 'resumes', highlight: true },
]

export default function App() {
  const [account, setAccount] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [activeTab, setActiveTab] = useState('jobs')
  const [adminView, setAdminView] = useState('dashboard')
  const [user, setUser] = useState(initialUser)
  const [applications, setApplications] = useState(initialApplications)
  const [resumes, setResumes] = useState([{ ...initialResume, name: initialResume.name || 'Currículo Geral', id: initialResume.id || 'resume-main' }])
  const [activeResumeId, setActiveResumeId] = useState(initialResume.id || 'resume-main')
  const [notifications, setNotifications] = useState(3)
  const [notificationItems, setNotificationItems] = useState([])

  useEffect(() => {
    getCurrentUser().then((sessionUser) => {
      if (sessionUser) {
        setAccount(sessionUser)
        setUser(sessionUser)
        const savedResumes = readStore(`candidate.resumes.${sessionUser.id}`, null)
        if (savedResumes?.length) { setResumes(savedResumes); setActiveResumeId(savedResumes[0].id) }
        const savedApplications = readStore(`candidate.applications.${sessionUser.id}`, null)
        if (savedApplications) setApplications(savedApplications)
        const savedNotifications = readStore(`candidate.notifications.${sessionUser.id}`, null)
        if (savedNotifications) { setNotificationItems(savedNotifications); setNotifications(savedNotifications.filter((n) => !n.read).length) }
      }
    }).finally(() => setLoadingSession(false))
  }, [])

  useEffect(() => {
    if (!account?.id) return
    writeStore(`candidate.resumes.${account.id}`, resumes)
    writeStore(`candidate.applications.${account.id}`, applications)
    writeStore(`candidate.notifications.${account.id}`, notificationItems)
  }, [account?.id, resumes, applications, notificationItems])

  const resume = resumes.find((r) => r.id === activeResumeId) || resumes[0]

  const applyToJob = (jobId) => {
    const already = applications.find((a) => a.jobId === jobId)
    if (already) return
    const job = jobs.find((j) => j.id === jobId)
    if (!job) return
    const id = uid('app')
    const application = {
      id, jobId, resumeId: activeResumeId, appliedAt: new Date().toISOString(), currentStep: 0,
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

  const handleProfileSave = ({ user: newUser, resume: newResume }) => {
    setUser(newUser)
    updateCurrentProfile(newUser)
    setResumes((prev) => prev.map((r) => (r.id === activeResumeId ? newResume : r)))
  }

  const handleResumeChange = (updater) => {
    setResumes((prev) => prev.map((r) => (r.id === activeResumeId ? updater(r) : r)))
  }

  const createResume = (name = 'Novo currículo') => {
    const newResume = { id: uid('resume'), name, summary: '', experiences: [], education: [], skills: [], languages: [], portfolio: [], certificates: [] }
    setResumes((prev) => [...prev, newResume]); setActiveResumeId(newResume.id); toast.success('Novo currículo criado!')
  }

  const duplicateResume = (source) => {
    const copy = JSON.parse(JSON.stringify(source)); copy.id = uid('resume'); copy.name = `${source.name || 'Currículo'} — Cópia`
    setResumes((prev) => [...prev, copy]); setActiveResumeId(copy.id); toast.success('Currículo duplicado!')
  }

  const deleteResume = (id) => {
    if (resumes.length <= 1) { toast.error('Mantenha pelo menos um currículo.'); return }
    setResumes((prev) => prev.filter((r) => r.id !== id)); if (activeResumeId === id) setActiveResumeId(resumes.find((r) => r.id !== id)?.id || resumes[0].id); toast.success('Currículo removido.')
  }

  const markNotificationsRead = () => {
    setNotificationItems((prev) => prev.map((n) => ({ ...n, read: true }))); setNotifications(0)
  }

  const handleLogout = () => {
    signOut()
    setAccount(null)
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
          {activeTab === 'profile' && (
            <ProfileRegistration user={user} resume={resume} onSave={handleProfileSave} />
          )}
          {activeTab === 'resumes' && <Resume user={user} resume={resume} resumes={resumes} activeResumeId={activeResumeId} onSelectResume={setActiveResumeId} onCreateResume={createResume} onDuplicateResume={duplicateResume} onDeleteResume={deleteResume} onChange={handleResumeChange} />}
        </AppShell>
      )}
    </ThemeProvider>
  )
}
