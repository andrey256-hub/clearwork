'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const SIZES = [20, 50]

/** Нумерация страниц: генерирует список с многоточиями */
function pageList(current: number, total: number): Array<number | '…'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const items: Array<number | '…'> = [1]
  const from = Math.max(2, current - 1)
  const to = Math.min(total - 1, current + 1)
  if (from > 2) items.push('…')
  for (let i = from; i <= to; i++) items.push(i)
  if (to < total - 1) items.push('…')
  items.push(total)
  return items
}

/**
 * Пагинация списков: размер страницы 20/50 + номера страниц.
 * Хранит состояние в URL (?page=&perPage=), чтобы ссылки были обычными.
 */
export function Pagination({
  total,
  page,
  perPage,
  className,
}: {
  total: number
  page: number
  perPage: number
  className?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const current = Math.min(Math.max(1, page), totalPages)

  function go(nextPage: number, nextSize?: number) {
    const params = new URLSearchParams(searchParams.toString())
    const size = nextSize ?? perPage
    if (nextPage <= 1) params.delete('page')
    else params.set('page', String(nextPage))
    if (size === SIZES[0]) params.delete('perPage')
    else params.set('perPage', String(size))
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  if (total === 0) return null

  const firstItem = (current - 1) * perPage + 1
  const lastItem = Math.min(current * perPage, total)

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 pt-1',
        className,
      )}
    >
      <p className="text-[13px] text-muted-foreground tabular-nums">
        {firstItem}–{lastItem} из {total}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {/* Размер страницы */}
        <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <span>Показывать:</span>
          <div className="flex rounded-md border border-border bg-card">
            {SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => go(1, size)}
                className={cn(
                  'px-2.5 py-1 tabular-nums transition-colors',
                  size === perPage
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Номера страниц */}
        {totalPages > 1 && (
          <nav className="flex items-center gap-1" aria-label="Страницы">
            <button
              type="button"
              aria-label="Предыдущая страница"
              disabled={current <= 1}
              onClick={() => go(current - 1)}
              className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {pageList(current, totalPages).map((item, i) =>
              item === '…' ? (
                <span
                  key={`gap-${i}`}
                  className="px-1.5 text-muted-foreground select-none"
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => go(item)}
                  aria-current={item === current ? 'page' : undefined}
                  className={cn(
                    'min-w-8 rounded-md border border-border px-2 py-1 text-[13px] tabular-nums transition-colors',
                    item === current
                      ? 'bg-primary font-medium text-primary-foreground'
                      : 'bg-card text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item}
                </button>
              ),
            )}

            <button
              type="button"
              aria-label="Следующая страница"
              disabled={current >= totalPages}
              onClick={() => go(current + 1)}
              className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        )}
      </div>
    </div>
  )
}
