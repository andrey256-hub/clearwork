import { ListTodo, CircleDot, CheckCircle2 } from 'lucide-react'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { isTaskPriority, isTaskStatus, type TaskPriority, type TaskStatus } from '@/lib/constants'
import { sortTaskMetas } from '@/lib/task-sort'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TaskTable, type TaskItem } from '@/components/task-table'
import { Pagination } from '@/components/pagination'

type Search = { [key: string]: string | string[] | undefined }

function first(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '')
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: string
  hint: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          <p className="truncate text-xs text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const user = await requireUser()
  const sp = await searchParams
  const page = Math.max(1, parseInt(first(sp.page), 10) || 1)
  const perPage = first(sp.perPage) === '50' ? 50 : 20

  const [tasks, totalCount, openCount, doneCount, projects, users] =
    await Promise.all([
      db.task.findMany({
        include: { project: true, assignee: true },
      }),
      db.task.count(),
      db.task.count({ where: { status: { in: ['todo', 'in_progress'] } } }),
      db.task.count({ where: { status: 'done' } }),
      db.project.findMany({
        orderBy: [{ status: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true },
      }),
      db.user.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
    ])

  const allRows: TaskItem[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: isTaskStatus(t.status) ? t.status : ('todo' as TaskStatus),
    priority: isTaskPriority(t.priority) ? t.priority : ('normal' as TaskPriority),
    dueDate: t.dueDate,
    estimate: t.estimate,
    createdAt: t.createdAt.toISOString(),
    createdById: t.createdById,
    projectId: t.projectId,
    projectName: t.project.name,
    projectColor: t.project.color,
    assigneeId: t.assigneeId,
    assigneeName: t.assignee?.name ?? null,
  }))

  // Единый порядок: открытые → по сроку → по приоритету → название
  const order = sortTaskMetas(allRows)
  const byId = new Map(allRows.map((r) => [r.id, r]))
  const sorted = order
    .map((id) => byId.get(id))
    .filter((r): r is TaskItem => Boolean(r))

  const rows = sorted.slice((page - 1) * perPage, page * perPage)

  const dateLabel = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {greeting()}, {user.name.split(' ')[0]}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{dateLabel}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Всего задач"
          value={String(totalCount)}
          hint="во всех проектах"
          icon={ListTodo}
        />
        <StatCard
          label="В работе"
          value={String(openCount)}
          hint="открытые и в работе"
          icon={CircleDot}
        />
        <StatCard
          label="Готовые"
          value={String(doneCount)}
          hint={`выполнено ${totalCount ? Math.round((doneCount / totalCount) * 100) : 0}%`}
          icon={CheckCircle2}
        />
      </div>

      <Card>
        <CardHeader
          title="Все задачи"
          subtitle="Общий список по команде — открытые сверху"
          actions={
            <a
              href="/tasks"
              className="text-[13px] font-medium text-primary hover:underline"
            >
              Открыть раздел «Задачи» →
            </a>
          }
        />
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              Задач пока нет — создайте первую в разделе «Задачи»
            </p>
          ) : (
            <TaskTable
              tasks={rows}
              projects={projects}
              users={users}
              currentUser={{ id: user.id, role: user.role }}
            />
          )}
        </CardContent>
      </Card>

      <Pagination total={sorted.length} page={page} perPage={perPage} />

      <div className="flex flex-wrap gap-2">
        <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          Открыта
        </Badge>
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          В работе
        </Badge>
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Готова
        </Badge>
      </div>
    </div>
  )
}
