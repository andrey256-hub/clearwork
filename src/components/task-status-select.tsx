'use client'

import { useTransition, useState } from 'react'
import { updateTaskStatusAction } from '@/lib/actions/tasks'
import { TASK_STATUS_META, type TaskStatus } from '@/lib/constants'
import { cn } from '@/lib/utils'

const ORDER: TaskStatus[] = ['todo', 'in_progress', 'done']

export function TaskStatusSelect({
  taskId,
  value,
}: {
  taskId: string
  value: TaskStatus
}) {
  const [status, setStatus] = useState<TaskStatus>(value)
  const [pending, startTransition] = useTransition()

  return (
    <select
      value={status}
      aria-label="Статус задачи"
      className={cn(
        'h-7 cursor-pointer rounded-md border border-transparent bg-transparent px-2 text-xs font-medium outline-none transition-colors',
        TASK_STATUS_META[status].badge,
        pending && 'opacity-60',
      )}
      onChange={(e) => {
        const next = e.target.value as TaskStatus
        setStatus(next)
        startTransition(() => updateTaskStatusAction(taskId, next))
      }}
    >
      {ORDER.map((s) => (
        <option key={s} value={s} className="bg-card text-foreground">
          {TASK_STATUS_META[s].label}
        </option>
      ))}
    </select>
  )
}
