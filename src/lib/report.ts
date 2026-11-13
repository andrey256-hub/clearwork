import { addDaysKey, weekStartKey } from '@/lib/utils'
import { isTaskStatus, type TaskStatus } from '@/lib/constants'

export type ReportGroup = 'user' | 'project'

export type TaskLike = {
  id: string
  status: string
  createdAt: Date
  assignee: { id: string; name: string } | null
  project: { name: string; color: string }
}

export type ReportRow = {
  key: string
  name: string
  userId?: string // для клика «показать отчёт этого человека»
  color?: string
  total: number
  todo: number
  inProgress: number
  done: number
}

function emptyRow(key: string, name: string, color?: string): ReportRow {
  return { key, name, color, total: 0, todo: 0, inProgress: 0, done: 0 }
}

function countInto(row: ReportRow, status: string) {
  row.total += 1
  const s: TaskStatus = isTaskStatus(status) ? status : 'todo'
  if (s === 'todo') row.todo += 1
  else if (s === 'in_progress') row.inProgress += 1
  else row.done += 1
}

/**
 * Группировка задач по человеку / проекту.
 * Для группы «по людям» нулевые строки добавляются для всех участников,
 * чтобы в отчёте видно было и тех, у кого задач нет.
 */
export function groupTasks(
  tasks: TaskLike[],
  group: ReportGroup,
  zeroRows: ReportRow[] = [],
): ReportRow[] {
  const map = new Map<string, ReportRow>()
  for (const row of zeroRows) map.set(row.key, { ...row })

  for (const t of tasks) {
    const key =
      group === 'user'
        ? (t.assignee?.id ?? 'none')
        : t.project.name
    let row = map.get(key)
    if (!row) {
      row = emptyRow(
        key,
        group === 'user' ? (t.assignee?.name ?? 'Не назначен') : key,
        group === 'project' ? t.project.color : undefined,
      )
      if (group === 'user' && t.assignee) row.userId = t.assignee.id
      map.set(key, row)
    }
    if (group === 'project' && !row.color) row.color = t.project.color
    countInto(row, t.status)
  }

  return [...map.values()].sort((a, b) => b.total - a.total)
}

/* ---------- Разбивка по датам (создание задач) ---------- */

function daysBetween(from: string, to: string): number {
  const a = Date.parse(from + 'T00:00:00')
  const b = Date.parse(to + 'T00:00:00')
  if (Number.isNaN(a) || Number.isNaN(b)) return 0
  return Math.max(0, Math.round((b - a) / 86400000))
}

export type BucketMode = 'day' | 'week' | 'month'

export function bucketModeFor(from: string, to: string): BucketMode {
  const days = daysBetween(from, to)
  if (days <= 62) return 'day'
  if (days <= 240) return 'week'
  return 'month'
}

function bucketKey(date: string, mode: BucketMode): string {
  if (mode === 'day') return date
  if (mode === 'month') return date.slice(0, 7)
  const [y, m, d] = date.split('-').map(Number)
  return weekStartKey(new Date(y, m - 1, d))
}

function bucketLabel(key: string, mode: BucketMode): string {
  if (mode === 'month') {
    const [y, m] = key.split('-')
    return `${m}.${y}`
  }
  const [, m, d] = key.split('-')
  return `${d}.${m}`
}

export type Bucket = { key: string; label: string; count: number }

/** Количество задач по дням/неделям/месяцам за период */
export function buildBuckets(
  tasks: Array<{ createdAt: Date }>,
  from: string,
  to: string,
): { mode: BucketMode; buckets: Bucket[] } {
  const mode = bucketModeFor(from, to)
  const map = new Map<string, number>()

  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  if (!fy || !fm || !fd || !ty || !tm || !td) {
    return { mode, buckets: [] }
  }

  // Генерируем все ключи диапазона, чтобы дырок в графике не было
  let cursor = from
  const seen = new Set<string>()
  for (let i = 0; i < 800; i++) {
    const key = bucketKey(cursor, mode)
    if (!seen.has(key)) {
      seen.add(key)
      map.set(key, 0)
    }
    if (cursor >= to) break
    cursor = addDaysKey(cursor, 1)
  }

  for (const t of tasks) {
    const date = t.createdAt.toISOString().slice(0, 10)
    if (date < from || date > to) continue
    const key = bucketKey(date, mode)
    map.set(key, (map.get(key) ?? 0) + 1)
  }

  const buckets: Bucket[] = [...map.entries()].map(([key, count]) => ({
    key,
    label: bucketLabel(key, mode),
    count,
  }))

  return { mode, buckets }
}
