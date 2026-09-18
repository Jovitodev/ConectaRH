import { Search, Briefcase, User, FileText, Bell, LogOut } from 'lucide-react'

const iconMap = {
  search: Search,
  briefcase: Briefcase,
  profile: User,
  resumes: FileText,
}

export default function Navbar({ activeTab, onTabChange, notifications, user, tabs, onLogout }) {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => onTabChange('jobs')}
          className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-85"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-poppins text-base font-bold text-primary-foreground">
            C
          </div>
          <div className="hidden text-left sm:block">
            <p className="font-poppins text-sm font-bold leading-tight text-foreground">
              Conecta<span className="text-primary">RH</span>
            </p>
            <p className="text-[9px] uppercase leading-tight tracking-[0.2em] text-muted-foreground">By Serhum Consultoria</p>
          </div>
        </button>

        <nav className="flex min-w-0 items-center gap-1 overflow-x-auto lg:gap-2">
          {tabs.map((tab) => {
            const Icon = iconMap[tab.icon]
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`group relative flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all sm:px-3 ${
                  tab.highlight && !active
                    ? 'text-primary hover:bg-primary/10'
                    : active
                      ? 'text-slate-800'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
                title={tab.label}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{tab.label}</span>
                {active && (
                  <span className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            )
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2.5">
          <button
            className="relative rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            aria-label="Notificações"
          >
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                {notifications}
              </span>
            )}
          </button>

          <button className="hidden items-center gap-2 rounded-lg border border-border bg-card py-1.5 pl-1.5 pr-2.5 transition-colors hover:border-primary/40 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary font-poppins text-xs font-bold text-primary-foreground">
              {initials}
            </div>
            <div className="hidden text-left lg:block">
              <p className="text-xs font-semibold leading-tight text-foreground">{user.name}</p>
              <p className="text-[10px] leading-tight text-muted-foreground">{user.title}</p>
            </div>
          </button>

          <button
            onClick={onLogout}
            className="rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:border-amber-400/50 hover:text-amber-600"
            title="Sair"
            aria-label="Sair da conta"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
