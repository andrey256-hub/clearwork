'use client'

import { useEffect, useState } from 'react'
import { BarChart3, ExternalLink } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { TASK_STATUS_META, isTaskStatus } from '@/lib/constants'
import { cn } from '@/lib/utils'

type PersonTask = {
  id: string
  title: string
  status: string
  dueDate: string | null
  createdAt: string
  projectName: string
  projectColor: string
}

type PersonReport = {
  user: { id: string; name: string }
  stats: { total: number; todo: number; inProgress: number; done: number }
  tasks: PersonTask[]
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Блок просмотра отчёта человека: открывается по клику на имя
 * в списке задач, не уходя со страницы.
 */
export function PersonReportDialog({
  personId,
  personName,
  onClose,
}: {
  personId: string
  personName: string
  onClose: () => void
}) {
  const [data, setData] = useState<PersonReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/reports/person?assignee=${encodeURIComponent(personId)}`)
      .then((r) => {
        if (!r.ok) throw new Error('Не удалось загрузить отчёт')
        return r.json()
      })
      .then((json: PersonReport) => {
        if (!cancelled) setData(json)
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить отчёт')
      })
    return () => {
      cancelled = true
    }
  }, [personId])

  const stats = [
    { label: 'Всего задач', value: data?.stats.total ?? '—' },
    { label: 'Открытые', value: data?.stats.todo ?? '—' },
    { label: 'В работе', value: data?.stats.inProgress ?? '—' },
    { label: 'Готовые', value: data?.stats.done ?? '—' },
  ]

  return (
    <Modal
      open
      onClose={onClose}
      className="max-w-2xl"
      title={`Отчёт: ${personName}`}
    >
      {/* Сводка */}
      <div className="mb-4 grid grid-cols-4 gap-2 text-center">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-muted px-2 py-2.5">
            <p className="text-lg font-semibold tabular-nums">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <a
        href={`/reports?from=2000-01-01&to=2099-12-31&assignee=${personId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Открыть полный отчёт в разделе «Отчёты»
      </a>

      {/* Список задач */}
      {error ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{error}</p>
      ) : !data ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Загрузка…
        </p>
      ) : data.tasks.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          У этого человека пока нет задач
        </p>
      ) : (
        <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-border">
          <ul className="divide-y divide-border">
            {data.tasks.map((t) => {
              const status = isTaskStatus(t.status) ? t.status : 'todo'
              const meta = TASK_STATUS_META[status]
              return (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center gap-2 px-3.5 py-2.5"
                >
                  <span className="w-32 shrink-0 text-xs tabular-nums text-muted-foreground">
                    {fmtDateTime(t.createdAt)}
                  </span>
                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate text-sm font-medium',
                      status === 'done' && 'text-muted-foreground line-through',
                    )}
                    title={t.title}
                  >
                    {t.title}
                  </span>
                  <Badge className={meta.badge}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
                    {meta.label}
                  </Badge>
                  <span className="hidden shrink-0 items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: t.projectColor }}
                    />
                    {t.projectName}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {!data && !error && (
        <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <BarChart3 className="h-3.5 w-3.5" />
          Задачи за всё время
        </p>
      )}
    </Modal>
  )
}
