import { Download, BarChart3, ListTodo } from 'lucide-react'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { buildBuckets, groupTasks, type ReportGroup } from '@/lib/report'
import {
  formatDateRu,
  monthStartKey,
  todayKey,
  weekStartKey,
  cn,
} from '@/lib/utils'
import { isTaskStatus, TASK_STATUS_META } from '@/lib/constants'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select, Field } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ReportsTable } from '@/components/reports-table'

export const metadata = { title: 'Отчёты' }

type Search = { [key: string]: string | string[] | undefined }

function first(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '')
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  await requireUser()
  const sp = await searchParams

  const groupParam = first(sp.group)
  const group: ReportGroup = groupParam === 'project' ? 'project' : 'user'

  const defaultFrom = monthStartKey()
  const defaultTo = todayKey()
  let from = first(sp.from)
  let to = first(sp.to)
  if (!DAY_RE.test(from)) from = defaultFrom
  if (!DAY_RE.test(to)) to = defaultTo
  if (from > to) [from, to] = [to, from]

  // Фильтр «проверяемый человек»: только его задачи за период
  const assigneeFilter = first(sp.assignee)
  const assigneeFilterId =
    assigneeFilter && assigneeFilter !== 'all' ? assigneeFilter : ''

  const fromTs = new Date(from + 'T00:00:00')
  const toTs = new Date(to + 'T23:59:59.999')

  const [allTasks, users] = await Promise.all([
    db.task.findMany({
      where: { createdAt: { gte: fromTs, lte: toTs } },
      include: { assignee: true, project: true },
      orderBy: { createdAt: 'desc' },
    }),
    db.user.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  // Задачи проверяемого человека (или все)
  const tasks = assigneeFilterId
    ? allTasks.filter((t) => t.assigneeId === assigneeFilterId)
    : allTasks

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

  const { mode, buckets } = buildBuckets(tasks, from, to)
  const maxBucket = Math.max(...buckets.map((b) => b.count), 1)

  const filteredUser = assigneeFilterId
    ? users.find((u) => u.id === assigneeFilterId)
    : null

  const hrefWith = (overrides: Record<string, string>) => {
    const params = new URLSearchParams({ from, to, group, ...overrides })
    if (assigneeFilterId && !('assignee' in overrides)) {
      params.set('assignee', assigneeFilterId)
    }
    return `/reports?${params.toString()}`
  }

  const presets = [
    { label: 'Эта неделя', from: weekStartKey(), to: todayKey() },
    { label: 'Этот месяц', from: monthStartKey(), to: todayKey() },
    {
      label: 'Прошлый месяц',
      from: monthStartKey(
        new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      ),
      to: (() => {
        const last = new Date(new Date().getFullYear(), new Date().getMonth(), 0)
        return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
      })(),
    },
    { label: 'Всё время', from: '2000-01-01', to: '2099-12-31' },
  ]

  const groupTabs: Array<{ value: ReportGroup; label: string }> = [
    { value: 'user', label: 'По людям' },
    { value: 'project', label: 'По проектам' },
  ]

  const csvHref = `/api/reports/export?${new URLSearchParams({
    from,
    to,
    group,
    ...(assigneeFilterId ? { assignee: assigneeFilterId } : {}),
  })}`

  const periodLabel =
    from === '2000-01-01' && to === '2099-12-31'
      ? 'за всё время'
      : `${formatDateRu(from)} — ${formatDateRu(to)}`

  const doneCount = tasks.filter((t) => t.status === 'done').length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Отчёты</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Задачи за период {periodLabel}
          {filteredUser && ` · ${filteredUser.name}`}
        </p>
      </div>

      {/* Управление: группировка + пресеты + даты + человек */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {groupTabs.map((tab) => (
              <a
                key={tab.value}
                href={hrefWith({ group: tab.value })}
                className={cn(
                  'rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
                  group === tab.value
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </a>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <a
                key={p.label}
                href={hrefWith({ from: p.from, to: p.to })}
                className={cn(
                  'rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  from === p.from &&
                    to === p.to &&
                    'border-primary/40 bg-accent text-accent-foreground',
                )}
              >
                {p.label}
              </a>
            ))}
          </div>
        </div>

        <form
          method="get"
          action="/reports"
          className="flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="group" value={group} />
          <Field label="С" htmlFor="rep-from" className="w-40">
            <Input id="rep-from" name="from" type="date" defaultValue={from} />
          </Field>
          <Field label="По" htmlFor="rep-to" className="w-40">
            <Input id="rep-to" name="to" type="date" defaultValue={to} />
          </Field>
          <Field label="Человек" className="w-52">
            <Select name="assignee" defaultValue={assigneeFilterId}>
              <option value="">Все участники</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" variant="secondary" size="sm" className="mb-0.5">
            Показать
          </Button>
          {assigneeFilterId && (
            <a
              href={hrefWith({ assignee: 'all' })}
              className="pb-2.5 text-[13px] text-muted-foreground hover:text-foreground"
            >
              Сбросить человека
            </a>
          )}
        </form>
      </div>

      {/* Итог + экспорт */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5 shadow-xs">
        <div>
          <p className="text-[13px] text-muted-foreground">
            Итого {periodLabel}
            {filteredUser && ` · ${filteredUser.name}`}
          </p>
          <p className="mt-0.5 text-3xl font-semibold tracking-tight tabular-nums">
            {total}{' '}
            <span className="text-base font-normal text-muted-foreground">
              задач
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {doneCount} готово ({total ? Math.round((doneCount / total) * 100) : 0}%) ·{' '}
            {rows.length} {group === 'user' ? 'участник(ов)' : 'проект(ов)'}
          </p>
        </div>
        <a href={csvHref}>
          <Button variant="outline">
            <Download className="h-4 w-4" />
            Скачать для Excel
          </Button>
        </a>
      </div>

      {/* График: сколько задач создано по датам */}
      <Card>
        <CardHeader
          title="Динамика создания задач"
          subtitle={
            mode === 'day'
              ? 'По дням'
              : mode === 'week'
                ? 'По неделям'
                : 'По месяцам'
          }
        />
        <CardContent>
          {total === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <BarChart3 className="mx-auto mb-2 h-6 w-6 opacity-50" />
              За выбранный период задач нет
            </div>
          ) : (
            <div>
              <div className="flex h-36 items-end gap-[3px]">
                {buckets.map((b) => (
                  <div
                    key={b.key}
                    className="group relative flex h-full min-w-[3px] flex-1 items-end"
                    title={`${b.label}: ${b.count} задач`}
                  >
                    <div
                      className="w-full rounded-t-sm bg-primary/70 transition-colors group-hover:bg-primary"
                      style={{
                        height: `${Math.max(2, (b.count / maxBucket) * 100)}%`,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
                <span>{buckets[0]?.label}</span>
                <span>макс. {maxBucket} задач</span>
                <span>{buckets[buckets.length - 1]?.label}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Таблица с сортировкой по столбцам */}
      <Card>
        <CardHeader
          title={group === 'user' ? 'По людям' : 'По проектам'}
          subtitle="Кликните по заголовку столбца, чтобы отсортировать"
        />
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              Нет данных за выбранный период
            </p>
          ) : (
            <ReportsTable rows={rows} total={total} />
          )}
        </CardContent>
      </Card>

      {/* Задачи проверяемого человека по датам */}
      {filteredUser && (
        <Card>
          <CardHeader
            title={`Задачи: ${filteredUser.name}`}
            subtitle={`${total} за период ${periodLabel}, новые сверху`}
          />
          <CardContent className="p-0">
            {tasks.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                У этого человека за период задач нет
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {tasks.map((t) => {
                  const status = isTaskStatus(t.status) ? t.status : 'todo'
                  const meta = TASK_STATUS_META[status]
                  return (
                    <li
                      key={t.id}
                      className="flex flex-wrap items-center gap-3 px-5 py-3"
                    >
                      <span className="w-32 shrink-0 text-[13px] tabular-nums text-muted-foreground">
                        {t.createdAt.toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {t.title}
                      </span>
                      <Badge className={meta.badge}>
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </Badge>
                      <span className="hidden text-[13px] text-muted-foreground sm:inline">
                        {t.project.name}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {!filteredUser && (
        <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <ListTodo className="h-4 w-4" />
          Выберите человека в фильтре — увидите список его задач по датам
        </p>
      )}
    </div>
  )
}
