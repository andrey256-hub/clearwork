'use client'

import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { TaskDialog } from '@/components/task-dialog'
import { TaskTable, type TaskItem } from '@/components/task-table'
import { Pagination } from '@/components/pagination'
import { cn } from '@/lib/utils'

export type TaskRow = TaskItem

type Filters = { q: string; project: string; assignee: string; status: string }

const TABS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'open', label: 'Открытые' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'done', label: 'Готовые' },
]

function tabHref(filters: Filters, status: string): string {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.project) params.set('project', filters.project)
  if (filters.assignee) params.set('assignee', filters.assignee)
  if (status !== 'all') params.set('status', status)
  const qs = params.toString()
  return qs ? `/tasks?${qs}` : '/tasks'
}

export function TasksView({
  tasks,
  projects,
  users,
  filters,
  total,
  page,
  perPage,
  currentUser,
}: {
  tasks: TaskRow[]
  projects: Array<{ id: string; name: string }>
  users: Array<{ id: string; name: string }>
  filters: Filters
  total: number
  page: number
  perPage: number
  currentUser: { id: string; role: string }
}) {
  const [creating, setCreating] = useState(false)

  const hasFilters = Boolean(filters.q || filters.project || filters.assignee)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Задачи</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {total} {total === 1 ? 'задача' : total < 5 ? 'задачи' : 'задач'} в списке
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Новая задача
        </Button>
      </div>

      {/* Фильтры */}
      <form
        method="get"
        className="flex flex-wrap items-center gap-2"
        action="/tasks"
      >
        <div className="relative min-w-52 flex-1 sm:max-w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={filters.q}
            placeholder="Поиск по названию…"
            className="pl-8"
          />
        </div>
        <Select
          name="project"
          defaultValue={filters.project}
          className="w-44"
          aria-label="Проект"
        >
          <option value="">Все проекты</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Select
          name="assignee"
          defaultValue={filters.assignee}
          className="w-44"
          aria-label="Исполнитель"
        >
          <option value="">Все исполнители</option>
          <option value="none">Без исполнителя</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </Select>
        <input type="hidden" name="status" value={filters.status} />
        <Button type="submit" variant="secondary" size="sm">
          Применить
        </Button>
        {hasFilters && (
          <a
            href="/tasks"
            className="px-1 text-[13px] text-muted-foreground hover:text-foreground"
          >
            Сбросить
          </a>
        )}
      </form>

      {/* Вкладки статусов */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {TABS.map((tab) => (
          <a
            key={tab.value}
            href={tabHref(filters, tab.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
              filters.status === tab.value
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {/* Список */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        {tasks.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium">Задач не найдено</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Измените фильтры или создайте новую задачу
            </p>
          </div>
        ) : (
          <TaskTable
            tasks={tasks}
            projects={projects}
            users={users}
            currentUser={currentUser}
          />
        )}
      </div>

      <Pagination total={total} page={page} perPage={perPage} />

      {creating && (
        <TaskDialog
          projects={projects}
          users={users}
          defaultProjectId={filters.project || projects[0]?.id}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  )
}
