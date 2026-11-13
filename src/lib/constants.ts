export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical'
export type UserRole = 'admin' | 'member'

export const TASK_STATUS_META: Record<
  TaskStatus,
  { label: string; badge: string; dot: string }
> = {
  todo: {
    label: 'Открыта',
    badge:
      'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
  in_progress: {
    label: 'В работе',
    badge:
      'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  done: {
    label: 'Готова',
    badge:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
}

export const TASK_PRIORITY_META: Record<
  TaskPriority,
  { label: string; dot: string; weight: number }
> = {
  low: { label: 'Низкий', dot: 'bg-slate-400', weight: 0 },
  normal: { label: 'Обычный', dot: 'bg-blue-500', weight: 1 },
  high: { label: 'Высокий', dot: 'bg-amber-500', weight: 2 },
  critical: { label: 'Критический', dot: 'bg-red-500', weight: 3 },
}

export const ROLE_META: Record<UserRole, { label: string }> = {
  admin: { label: 'Администратор' },
  member: { label: 'Участник' },
}

/** Цветовая палитра для проектов и графиков */
export const PROJECT_COLORS = [
  '#6366f1', // indigo
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#64748b', // slate
]

export const CHART_COLORS = [
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#64748b',
  '#0891b2',
  '#84cc16',
]

export function isTaskStatus(v: unknown): v is TaskStatus {
  return v === 'todo' || v === 'in_progress' || v === 'done'
}

export function isTaskPriority(v: unknown): v is TaskPriority {
  return v === 'low' || v === 'normal' || v === 'high' || v === 'critical'
}
