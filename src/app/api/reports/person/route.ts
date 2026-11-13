import type { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * Отчёт одного человека: его задачи за всё время + сводка по статусам.
 * Используется блоком просмотра отчёта в разделе «Задачи».
 */
export async function GET(request: NextRequest) {
  const viewer = await getSessionUser()
  if (!viewer) {
    return new Response('Unauthorized', { status: 401 })
  }

  const assigneeId = new URL(request.url).searchParams.get('assignee') ?? ''
  if (!assigneeId) {
    return new Response('Bad request', { status: 400 })
  }

  const person = await db.user.findUnique({
    where: { id: assigneeId },
    select: { id: true, name: true },
  })
  if (!person) {
    return new Response('Not found', { status: 404 })
  }

  const tasks = await db.task.findMany({
    where: { assigneeId: person.id },
    include: { project: { select: { name: true, color: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const stats = { total: tasks.length, todo: 0, inProgress: 0, done: 0 }
  for (const t of tasks) {
    if (t.status === 'done') stats.done += 1
    else if (t.status === 'in_progress') stats.inProgress += 1
    else stats.todo += 1
  }

  return Response.json({
    user: person,
    stats,
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      dueDate: t.dueDate,
      createdAt: t.createdAt.toISOString(),
      projectName: t.project.name,
      projectColor: t.project.color,
    })),
  })
}
