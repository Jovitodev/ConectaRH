import { useState } from 'react'
import {
  Search,
  Briefcase,
  User,
  FileText,
  Bell,
  LogOut,
  Menu,
  ChevronsLeft,
  ChevronsRight,
  Home,
  Moon,
  Sun,
  UserRound,
  FileBadge,
  Settings,
  CircleHelp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ModeToggle } from '@/components/mode-toggle'

const icons = { search: Search, briefcase: Briefcase, profile: User, resumes: FileText, settings: Settings, support: CircleHelp }

const navGroups = [
  {
    label: 'Principal',
    items: ['jobs', 'applications'],
  },
  {
    label: 'Candidato',
    items: ['profile', 'resumes'],
  },
  {
    label: 'Conta',
    items: ['settings', 'support'],
  },
]

export function AppShell({ tabs, activeTab, onTabChange, user, notifications, notificationItems = [], onMarkNotificationsRead, onLogout, children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const currentTab = tabs.find((t) => t.id === activeTab)
  const initials = user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')

  const nav = (
    <>
      <div className={cn('flex items-center gap-2.5 px-4 py-5', collapsed && 'justify-center px-2')}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary font-poppins text-base font-bold text-primary-foreground">
          C
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate font-poppins text-sm font-bold leading-tight">
              Conecta<span className="text-primary">RH</span>
            </p>
            <p className="truncate text-[9px] uppercase tracking-[0.2em] text-muted-foreground">By Serhum Consultoria</p>
          </div>
        )}
      </div>
      <Separator />
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</p>
            )}
            <nav className="space-y-1">
              {group.items.map((id) => {
                const tab = tabs.find((t) => t.id === id)
                const Icon = icons[tab.icon]
                const active = activeTab === id
                const item = (
                  <button
                    key={id}
                    onClick={() => {
                      onTabChange(id)
                      setMobileOpen(false)
                    }}
                    className={cn(
                      'relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-sky-50 text-slate-800'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      collapsed && 'justify-center px-0',
                    )}
                    title={tab.label}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', active && 'text-primary')} />
                    {!collapsed && <span className="truncate">{tab.label}</span>}
                    {active && !collapsed && (
                      <span className="ml-auto h-5 w-0.5 rounded-full bg-primary" />
                    )}
                    {tab.highlight && !active && !collapsed && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                )
                return collapsed ? (
                  <Tooltip key={id}>
                    <TooltipTrigger asChild>{item}</TooltipTrigger>
                    <TooltipContent side="right">{tab.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  item
                )
              })}
            </nav>
          </div>
        ))}
      </div>
      <div className="border-t p-3">
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onLogout}
                className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Sair</TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-2 rounded-lg p-1">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoUrl || undefined} alt={`Foto de ${user.name}`} />
              <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
            </div>
            <button
              onClick={onLogout}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </>
  )

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-background">
        {/* Sidebar desktop */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r bg-sidebar transition-all duration-300 lg:flex',
            collapsed && 'w-[68px]',
          )}
        >
          {nav}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="absolute -right-3 top-16 flex h-6 w-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-md transition-colors hover:text-primary"
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
          </button>
        </aside>

        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur-md sm:px-6 lg:pl-[272px]">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-72 flex-col p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              {nav}
            </SheetContent>
          </Sheet>

          <Breadcrumb className="hidden sm:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink className="flex items-center gap-1" href="#" onClick={(e) => e.preventDefault()}>
                  <Home className="h-3.5 w-3.5" />
                  Início
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentTab?.label}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center gap-1.5">
            <ModeToggle />

            {/* Notificações */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notificações" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {notifications}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between"><span>Notificações</span>{onMarkNotificationsRead && <button type="button" onClick={onMarkNotificationsRead} className="text-[11px] font-normal text-primary hover:underline">Marcar como lidas</button>}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="space-y-1 p-1">
                  {(notificationItems.length ? notificationItems : [
                    { id: 'seed-1', title: 'Nova etapa no processo', message: 'Sua candidatura recebeu uma atualização.' },
                    { id: 'seed-2', title: 'Entrevista agendada', message: 'Você possui uma entrevista pendente de confirmação.' },
                  ]).map((n) => (
                    <button key={n.id} className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent">
                      <Badge variant="info" className="mt-0.5 h-1.5 w-1.5 rounded-full p-0" />
                      <div>
                        <p className="text-sm font-medium">{n.title || n.t}</p>
                        <p className="text-xs text-muted-foreground">{n.message || n.d}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Perfil do usuário */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-accent" aria-label="Menu do perfil">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoUrl || undefined} alt={`Foto de ${user.name}`} />
                    <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium lg:inline">{user.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { onTabChange('profile'); setMobileOpen(false) }}>
                  <UserRound /> Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { onTabChange('resumes'); setMobileOpen(false) }}>
                  <FileBadge /> Meu Currículo
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                  <LogOut /> Sair da conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className={cn('px-4 py-6 transition-all sm:px-6 lg:pl-[272px]', collapsed && 'lg:pl-[76px]')}>
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>

    </TooltipProvider>
  )
}
