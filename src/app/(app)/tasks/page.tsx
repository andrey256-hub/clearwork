import type { Prisma } from '@prisma/client'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  isTaskPriority,
  isTaskStatus,
  type TaskPriority,
  type TaskStatus,
} from '@/lib/constants'
import { sortTaskMetas } from '@/lib/task-sort'
import { TasksView, type TaskRow } from './tasks-view'

type Search = { [key: string]: string | string[] | undefined }

function first(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '')
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const currentUser = await requireUser()
  const sp = await searchParams

  const q = first(sp.q).trim()
  const projectFilter = first(sp.project)
  const assigneeFilter = first(sp.assignee)
  const statusFilter = first(sp.status) || 'all'
  const page = Math.max(1, parseInt(first(sp.page), 10) || 1)
  const perPage = first(sp.perPage) === '50' ? 50 : 20

  const where: Prisma.TaskWhereInput = {}
  if (projectFilter) where.projectId = projectFilter
  if (assigneeFilter === 'none') where.assigneeId = null
  else if (assigneeFilter) where.assigneeId = assigneeFilter
  if (statusFilter === 'open') where.status = { in: ['todo', 'in_progress'] }
  else if (isTaskStatus(statusFilter)) where.status = statusFilter
  if (q) where.title = { contains: q }

  const [tasks, projects, users] = await Promise.all([
    db.task.findMany({
      where,
      include: { project: true, assignee: true },
    }),
    db.project.findMany({
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, color: true, status: true },
    }),
    db.user.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  const allRows: TaskRow[] = tasks.map((t) => ({
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

  // Единый порядок (статус → срок → приоритет → название), затем страница
  const order = sortTaskMetas(allRows)
  const byId = new Map(allRows.map((r) => [r.id, r]))
  const sorted = order
    .map((id) => byId.get(id))
    .filter((r): r is TaskRow => Boolean(r))

  const rows = sorted.slice((page - 1) * perPage, page * perPage)

  return (
    <TasksView
      tasks={rows}
      projects={projects.map(({ id, name }) => ({ id, name }))}
      users={users}
      filters={{ q, project: projectFilter, assignee: assigneeFilter, status: statusFilter }}
      total={sorted.length}
      page={page}
      perPage={perPage}
      currentUser={{ id: currentUser.id, role: currentUser.role }}
    />
  )
}
