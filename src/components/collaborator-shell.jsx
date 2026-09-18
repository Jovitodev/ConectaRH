import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  KanbanSquare,
  CalendarClock,
  BarChart3,
  Shield,
  Settings,
  FilePlus2,
  FileStack,
  LogOut,
  Bell,
  ChevronDown,
  Search,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar'

const navSections = [
  {
    label: 'Visão Geral',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    ],
  },
  {
    label: 'Recrutamento',
    items: [
      {
        id: 'vacancies',
        label: 'Controle de Vagas',
        icon: Briefcase,
        badge: '7',
        children: [
          { id: 'vacancy-create', label: 'Criar Nova Vaga', icon: FilePlus2 },
          { id: 'templates', label: 'Templates de Vagas', icon: FileStack },
        ],
      },
      {
        id: 'candidates',
        label: 'Gestão de Candidatos',
        icon: Users,
        badge: '128',
      },
      { id: 'kanban', label: 'Fluxo de Vagas', icon: KanbanSquare },
      { id: 'agenda', label: 'Agenda de Entrevistas', icon: CalendarClock, badge: '3' },
    ],
  },
  {
    label: 'Governança',
    items: [
      { id: 'reports', label: 'Relatórios', icon: BarChart3 },
      { id: 'team', label: 'Equipe e Acessos', icon: Shield },
      { id: 'settings', label: 'Configurações', icon: Settings },
    ],
  },
]

const titles = {
  dashboard: 'Dashboard',
  vacancies: 'Controle de Vagas',
  'vacancy-create': 'Criar Nova Vaga',
  'vacancy-edit': 'Editar Vaga',
  templates: 'Templates de Vagas',
  candidates: 'Gestão de Candidatos',
  'candidate-detail': 'Perfil do Candidato',
  kanban: 'Fluxo de Vagas',
  agenda: 'Agenda de Entrevistas',
  reports: 'Relatórios Gerais',
  team: 'Equipe e Níveis de Acesso',
  settings: 'Configurações',
}

export function CollaboratorShell({ user, notifications, notificationItems = [], onMarkNotificationsRead, onLogout, view, onNavigate, children }) {
  const [openGroups, setOpenGroups] = useState(['recrutamento'])
  const [mobileSearch, setMobileSearch] = useState(false)
  const initials = user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')

  const toggleGroup = (label) => {
    setOpenGroups((g) => (g.includes(label) ? g.filter((x) => x !== label) : [...g, label]))
  }

  const isActive = (id) => {
    if (view === id) return true
    if (view === 'vacancy-edit') return id === 'vacancies'
    if (view === 'candidate-detail') return id === 'candidates'
    return false
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <button type="button" onClick={() => onNavigate('dashboard')} className="data-[active=true]:bg-transparent">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <span className="font-poppins text-base font-bold">C</span>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-poppins font-semibold">
                      Conecta<span className="text-primary">RH</span>
                    </span>
                    <span className="truncate text-xs text-muted-foreground">Área do Colaborador</span>
                  </div>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarSeparator />
        </SidebarHeader>

        <SidebarContent>
          {navSections.map((section) => (
            <SidebarGroup key={section.label}>
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => {
                    if (item.children) {
                      return (
                        <Collapsible
                          key={item.id}
                          asChild
                          defaultOpen
                          open={openGroups.includes(item.label)}
                          onOpenChange={() => toggleGroup(item.label)}
                          className="group/collapsible"
                        >
                          <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton
                                tooltip={item.label}
                                isActive={isActive(item.id)}
                                className="data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground"
                              >
                                <item.icon />
                                <span>{item.label}</span>
                                {item.badge && (
                                  <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                                )}
                                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {item.children.map((child) => (
                                  <SidebarMenuSubItem key={child.id}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={view === child.id}
                                      onClick={() => onNavigate(child.id)}
                                    >
                                      <button type="button">
                                        <child.icon />
                                        <span>{child.label}</span>
                                      </button>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      )
                    }
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          asChild
                          tooltip={item.label}
                          isActive={isActive(item.id)}
                          onClick={() => onNavigate(item.id)}
                        >
                          <button type="button">
                            <item.icon />
                            <span>{item.label}</span>
                            {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <button type="button" className="cursor-default">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.position}</span>
                  </div>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton variant="outline" asChild onClick={onLogout} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                <button type="button">
                  <LogOut />
                  <span>Sair da conta</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-14">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb className="hidden sm:block">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#" onClick={(e) => e.preventDefault()}>
                    ConectaRH
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{titles[view] || 'Dashboard'}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar candidato, vaga..." className="h-9 w-56 pl-8" />
            </div>
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
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
                    { id: 'admin-1', title: 'Nova candidatura', message: 'Há novas candidaturas para avaliação.' },
                    { id: 'admin-2', title: 'Entrevista hoje', message: 'Confira a agenda de entrevistas.' },
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 pl-1 pr-2" aria-label="Menu do perfil">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium md:inline">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onNavigate('settings')}>
                  <Settings /> Configurações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate('team')}>
                  <Shield /> Equipe e Acessos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                  <LogOut /> Sair da conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
