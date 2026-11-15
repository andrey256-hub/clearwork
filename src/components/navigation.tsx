'use client'

import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ListTodo,
  FolderKanban,
  BarChart3,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/logo'

const NAV = [
  { href: '/', label: 'Главная', icon: LayoutDashboard },
  { href: '/tasks', label: 'Задачи', icon: ListTodo },
  { href: '/projects', label: 'Проекты', icon: FolderKanban },
  { href: '/reports', label: 'Отчёты', icon: BarChart3 },
  { href: '/settings', label: 'Настройки', icon: Settings },
]

export function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-14 items-center border-b border-border px-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <a
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </a>
          )
        })}
      </nav>
      <div className="border-t border-border px-5 py-3">
        <p className="text-[11px] text-muted-foreground">
          ClearWork v1.0 · облачная версия
        </p>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 overflow-x-auto md:hidden">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href)
        return (
          <a
            key={href}
            href={href}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors',
              active
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </a>
        )
      })}
    </nav>
  )
}
