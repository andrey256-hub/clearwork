'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'

const MAX_AUTO_RETRIES = 3
const RETRY_DELAY_MS = 3000

/**
 * Счётчик серии авто-попыток живёт вне компонента: каждая попытка retry()
 * перемонтирует экран, и обычное состояние компонента её бы не пережило.
 * Читается через useSyncExternalStore — так требует React.
 */
let autoRetries = 0
const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): number {
  return autoRetries
}

function bumpAndRetry(retry: () => void): void {
  autoRetries += 1
  for (const notify of listeners) notify()
  retry()
}

/**
 * Экран восстановления: если база Neon просыпается после простоя,
 * страница сама пробует открыться несколько раз, а затем предлагает
 * обновить вручную. Данные при этом не затрагиваются.
 */
export default function Error({
  error,
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  const attempts = useSyncExternalStore(subscribe, getSnapshot)
  const stuck = attempts >= MAX_AUTO_RETRIES

  useEffect(() => {
    console.error(error)
  }, [error])

  useEffect(() => {
    if (stuck) return
    const timer = setTimeout(() => bumpAndRetry(retry), RETRY_DELAY_MS)
    return () => clearTimeout(timer)
  }, [retry, stuck])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
          {stuck ? (
            <>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                <RefreshCw className="h-5 w-5" />
              </div>
              <h1 className="mb-1 text-base font-semibold">
                Не получилось открыть автоматически
              </h1>
              <p className="mb-5 text-[13px] text-muted-foreground">
                Нажмите «Обновить страницу» — обычно помогает. Если нет:
                проверьте интернет (включён ли VPN) и попробуйте через минуту.
                Ваши данные в порядке.
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4" />
                Обновить страницу
              </Button>
            </>
          ) : (
            <>
              <div className="mb-4 flex h-10 w-10 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <h1 className="mb-1 text-base font-semibold">
                ClearWork просыпается…
              </h1>
              <p className="text-[13px] text-muted-foreground">
                База данных запускается после паузы — обычно это несколько
                секунд. Страница откроется сама: попытка {attempts + 1} из{' '}
                {MAX_AUTO_RETRIES}.
              </p>
            </>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          ClearWork — задачи, время и отчёты вашей команды
        </p>
      </div>
    </div>
  )
}
