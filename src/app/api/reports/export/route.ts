import type { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { groupTasks, type ReportGroup } from '@/lib/report'
import { TASK_STATUS_META, isTaskStatus } from '@/lib/constants'

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/

const GROUP_LABELS: Record<ReportGroup, string> = {
  user: 'Участник',
  project: 'Проект',
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  let from = searchParams.get('from') ?? ''
  let to = searchParams.get('to') ?? ''
  const groupParam = searchParams.get('group') ?? 'user'
  const group: ReportGroup = groupParam === 'project' ? 'project' : 'user'
  const assigneeId = searchParams.get('assignee') ?? ''

  if (!DAY_RE.test(from)) from = '2000-01-01'
  if (!DAY_RE.test(to)) to = '2099-12-31'
  if (from > to) [from, to] = [to, from]

  const fromTs = new Date(from + 'T00:00:00')
  const toTs = new Date(to + 'T23:59:59.999')

  const [tasks, users] = await Promise.all([
    db.task.findMany({
      where: {
        createdAt: { gte: fromTs, lte: toTs },
        ...(assigneeId ? { assigneeId } : {}),
      },
      include: { assignee: true, project: true },
      orderBy: { createdAt: 'asc' },
    }),
    db.user.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  const zeroRows =
    group === 'user'
      ? users.map((u) => ({
          key: u.id,
          name: u.name,
          userId: u.id,
          total: 0,
          todo: 0,
          inProgress: 0,
          done: 0,
        }))
      : []

  const rows = groupTasks(tasks, group, zeroRows)
  const total = tasks.length

  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const lines: string[] = []

  lines.push(
    [
      esc('ClearWork — отчёт по задачам'),
      esc(GROUP_LABELS[group]),
      esc(`Период: ${from} — ${to}`),
      ...(assigneeId
        ? [esc(`Человек: ${users.find((u) => u.id === assigneeId)?.name ?? ''}`)]
        : []),
    ].join(';'),
  )
  lines.push('')
  lines.push(
    [
      esc(GROUP_LABELS[group]),
      esc('Всего задач'),
      esc('Открытые'),
      esc('В работе'),
      esc('Готовые'),
      esc('Доля, %'),
    ].join(';'),
  )

  for (const row of rows) {
    const share = total > 0 ? ((row.total / total) * 100).toFixed(1) : '0.0'
    lines.push(
      [
        esc(row.name),
        esc(String(row.total)),
        esc(String(row.todo)),
        esc(String(row.inProgress)),
        esc(String(row.done)),
        esc(share.replace('.', ',')),
      ].join(';'),
    )
  }

  lines.push('')
  lines.push(
    [
      esc('Итого'),
      esc(String(total)),
      esc(String(rows.reduce((s, r) => s + r.todo, 0))),
      esc(String(rows.reduce((s, r) => s + r.inProgress, 0))),
      esc(String(rows.reduce((s, r) => s + r.done, 0))),
      esc('100,0'),
    ].join(';'),
  )

  // Детализация: каждая задача периода
  lines.push('')
  lines.push(
    [
      esc('Дата создания'),
      esc('Задача'),
      esc('Проект'),
      esc('Исполнитель'),
      esc('Статус'),
    ].join(';'),
  )
  for (const t of tasks) {
    const status = isTaskStatus(t.status) ? t.status : 'todo'
    lines.push(
      [
        esc(t.createdAt.toISOString().slice(0, 10)),
        esc(t.title),
        esc(t.project.name),
        esc(t.assignee?.name ?? 'Не назначен'),
        esc(TASK_STATUS_META[status].label),
      ].join(';'),
    )
  }

  // BOM + разделитель «;» — Excel (RU) открывает без импорта
  const csv = '\uFEFF' + lines.join('\r\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="clearwork-${from}-${to}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
