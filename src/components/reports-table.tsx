'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ReportRow } from '@/lib/report'
import { cn } from '@/lib/utils'

type SortKey = 'name' | 'total' | 'todo' | 'inProgress' | 'done' | 'share'

type Column = {
  key: SortKey
  label: string
  numeric?: boolean
  align?: 'left' | 'right'
}

const COLUMNS: Column[] = [
  { key: 'name', label: 'Участник' },
  { key: 'total', label: 'Всего задач', numeric: true, align: 'right' },
  { key: 'todo', label: 'Открытые', numeric: true, align: 'right' },
  { key: 'inProgress', label: 'В работе', numeric: true, align: 'right' },
  { key: 'done', label: 'Готовые', numeric: true, align: 'right' },
  { key: 'share', label: 'Доля', numeric: true, align: 'right' },
]

/**
 * Таблица отчёта с сортировкой по столбцам (клик по заголовку).
 * Если передан userHrefBase — имя сотрудника кликабельно и открывает
 * его отчёт (для администратора и для просмотра своих задач).
 */
export function ReportsTable({
  rows,
  total,
  userHrefBase,
}: {
  rows: ReportRow[]
  total: number
  userHrefBase?: string
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'total',
    dir: 'desc',
  })

  const sorted = useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      let cmp = 0
      if (sort.key === 'name') cmp = a.name.localeCompare(b.name, 'ru')
      else if (sort.key === 'share') {
        const sa = total > 0 ? a.total / total : 0
        const sb = total > 0 ? b.total / total : 0
        cmp = sa - sb
      } else cmp = a[sort.key] - b[sort.key]
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [rows, sort, total])

  function toggle(key: SortKey) {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'name' ? 'asc' : 'desc' },
    )
  }

  const max = Math.max(...rows.map((r) => r.total), 1)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            {COLUMNS.map((col) => {
              const active = sort.key === col.key
              return (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-2.5 font-medium',
                    col.align === 'right' && 'text-right',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggle(col.key)}
                    className={cn(
                      'inline-flex items-center gap-1 transition-colors hover:text-foreground',
                      active && 'text-foreground',
                    )}
                    title="Сортировать"
                  >
                    {col.label}
                    {active ? (
                      sort.dir === 'asc' ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )
                    ) : (
                      <ChevronDown className="h-3 w-3 opacity-25" />
                    )}
                  </button>
                </th>
              )
            })}
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((row) => (
            <tr key={row.key} className="hover:bg-muted/50">
              <td className="max-w-56 px-4 py-2.5">
                <span className="flex items-center gap-2">
                  {row.color && (
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                  )}
                  {userHrefBase && row.userId ? (
                    <a
                      href={`${userHrefBase}${row.userId}`}
                      className="truncate font-medium text-primary hover:underline"
                      title={`Показать отчёт: ${row.name}`}
                    >
                      {row.name}
                    </a>
                  ) : (
                    <span className="truncate font-medium">{row.name}</span>
                  )}
                </span>
              </td>
              <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                {row.total}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                {row.todo || '—'}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                {row.inProgress || '—'}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                {row.done || '—'}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                {total > 0
                  ? `${((row.total / total) * 100).toFixed(1).replace('.', ',')}%`
                  : '—'}
              </td>
              <td className="w-32 px-4 py-2.5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.max(2, (row.total / max) * 100)}%`,
                    }}
                  />
                </div>
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-border bg-muted/50 font-semibold">
            <td className="px-4 py-2.5">Итого</td>
            <td className="px-4 py-2.5 text-right tabular-nums">{total}</td>
            <td className="px-4 py-2.5 text-right tabular-nums">
              {rows.reduce((s, r) => s + r.todo, 0)}
            </td>
            <td className="px-4 py-2.5 text-right tabular-nums">
              {rows.reduce((s, r) => s + r.inProgress, 0)}
            </td>
            <td className="px-4 py-2.5 text-right tabular-nums">
              {rows.reduce((s, r) => s + r.done, 0)}
            </td>
            <td className="px-4 py-2.5 text-right tabular-nums">100%</td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  )
}
