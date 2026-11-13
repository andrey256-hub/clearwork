import { TASK_PRIORITY_META, isTaskPriority, isTaskStatus } from '@/lib/constants'

export type TaskMeta = {
  id: string
  status: string
  priority: string
  dueDate: string | null
  title: string
}

const STATUS_ORDER: Record<string, number> = { todo: 0, in_progress: 1, done: 2 }

/**
 * Единый порядок для списков задач:
 * статус (открытые сверху) → срок (просроченные и с ближайшим сроком первыми)
 * → приоритет → название.
 * Возвращает отсортированный список id.
 */
export function sortTaskMetas(metas: TaskMeta[]): string[] {
  return [...metas]
    .sort((a, b) => {
      const sa = isTaskStatus(a.status) ? STATUS_ORDER[a.status] : 9
      const sb = isTaskStatus(b.status) ? STATUS_ORDER[b.status] : 9
      if (sa !== sb) return sa - sb

      const aDue = a.dueDate ?? '9999-12-31'
      const bDue = b.dueDate ?? '9999-12-31'
      if (aDue !== bDue) return aDue < bDue ? -1 : 1

      const aP = isTaskPriority(a.priority) ? TASK_PRIORITY_META[a.priority].weight : 0
      const bP = isTaskPriority(b.priority) ? TASK_PRIORITY_META[b.priority].weight : 0
      if (aP !== bP) return bP - aP

      return a.title.localeCompare(b.title, 'ru')
    })
    .map((m) => m.id)
}
