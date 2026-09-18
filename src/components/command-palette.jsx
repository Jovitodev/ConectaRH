import { useEffect, useState } from 'react'
import { Search, Moon, Sun, LogOut, Briefcase, User, FileText } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { useTheme } from '@/components/theme-provider'

export function CommandPalette({ open, setOpen, tabs, onNavigate, onLogout }) {
  const { theme, setTheme } = useTheme()
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  const navItems = tabs.map((tab) => ({
    label: tab.label,
    value: tab.label.toLowerCase().replace(/\s/g, '-'),
    icon: tab.icon,
    action: () => onNavigate(tab.id),
  }))

  const icons = { search: Search, briefcase: Briefcase, profile: User, resumes: FileText }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar vagas, ações e atalhos..." value={search} onValueChange={setSearch} />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup heading="Navegação">
          {navItems.map((item) => {
            const Icon = icons[item.icon] || Search
            return (
              <CommandItem
                key={item.value}
                value={`${item.label} ${item.value}`}
                onSelect={() => {
                  item.action()
                  setOpen(false)
                }}
              >
                <Icon />
                {item.label}
                <CommandShortcut>G{item.label.slice(0, 1)}</CommandShortcut>
              </CommandItem>
            )
          })}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Ações">
          <CommandItem
            value="alternar-tema tema claro escuro"
            onSelect={() => {
              setTheme(theme === 'dark' ? 'light' : 'dark')
              setOpen(false)
            }}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
            {theme === 'dark' ? 'Alternar para tema Claro' : 'Alternar para tema Escuro'}
            <CommandShortcut>⇧T</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="sair logout encerrar sessao"
            onSelect={() => {
              setOpen(false)
              onLogout()
            }}
          >
            <LogOut />
            Sair da conta
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
