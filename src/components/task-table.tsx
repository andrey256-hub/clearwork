'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { TaskStatusSelect } from '@/components/task-status-select'
import { TaskDialog, type TaskDialogData } from '@/components/task-dialog'
import { PersonReportDialog } from '@/components/person-report-dialog'
import { TASK_PRIORITY_META, TASK_STATUS_META } from '@/lib/constants'
import { canEditTask } from '@/lib/permissions'
import { cn, formatDateRu, htmlToText, isOverdue } from '@/lib/utils'

export type TaskItem = TaskDialogData & {
  projectName: string
  projectColor: string
  assigneeName: string | null
}

type CurrentUser = { id: string; role: string }

/**
 * Таблица задач для списков (главная, раздел «Задачи»).
 * Редактирование доступно только владельцу задачи (см. canEditTask).
 * Клик по строке (кроме названия своей задачи и селекта статуса)
 * открывает всплывающий отчёт исполнителя.
 */
export function TaskTable({
  tasks,
  projects,
  users,
  currentUser,
}: {
  tasks: TaskItem[]
  projects?: Array<{ id: string; name: string }>
  users?: Array<{ id: string; name: string }>
  currentUser: CurrentUser
}) {
  const [editing, setEditing] = useState<TaskItem | null>(null)
  const [report, setReport] = useState<{ id: string; name: string } | null>(null)
  const canEditList = Boolean(projects && users)

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Статус</th>
              <th className="px-2 py-2.5 font-medium">Задача</th>
              <th className="hidden px-2 py-2.5 font-medium sm:table-cell">
                Проект
              </th>
              <th className="hidden px-2 py-2.5 font-medium md:table-cell">
                Исполнитель
              </th>
              <th className="hidden px-2 py-2.5 font-medium lg:table-cell">
                Срок
              </th>
              <th className="hidden px-4 py-2.5 text-right font-medium lg:table-cell">
                Оценка
              </th>
              <th className="hidden px-4 py-2.5 font-medium xl:table-cell">
                Создана
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((task) => {
              const overdue = isOverdue(task.dueDate, task.status)
              const priority = TASK_PRIORITY_META[task.priority]
              const description = htmlToText(task.description)
              const editable = canEditTask(task, currentUser)
              const openable = editable && canEditList
              const openAssigneeReport =
                task.assigneeId && task.assigneeName
                  ? () =>
                      setReport({ id: task.assigneeId!, name: task.assigneeName! })
                  : undefined
              return (
                <tr
                  key={task.id}
                  className={cn(
                    'group transition-colors hover:bg-muted/50',
                    openAssigneeReport && 'cursor-pointer',
                  )}
                  onClick={openAssigneeReport}
                  title={
                    openAssigneeReport
                      ? `Отчёт: ${task.assigneeName}`
                      : undefined
                  }
                >
                  <td
                    className="px-4 py-2.5"
                    onClick={editable ? (e) => e.stopPropagation() : undefined}
                  >
                    {editable ? (
                      <TaskStatusSelect taskId={task.id} value={task.status} />
                    ) : (
                      <Badge className={TASK_STATUS_META[task.status].badge}>
                        {TASK_STATUS_META[task.status].label}
                      </Badge>
                    )}
                  </td>
                  <td className="max-w-0 px-2 py-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        // Своя задача — открыть на редактирование;
                        // чужая — клик уходит на строку и открывает отчёт исполнителя
                        if (!openable) return
                        e.stopPropagation()
                        setEditing(task)
                      }}
                      title={
                        editable
                          ? 'Открыть задачу'
                          : 'Чужая задача — клик откроет отчёт исполнителя'
                      }
                      className="block w-full max-w-full text-left"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            'h-2 w-2 shrink-0 rounded-full',
                            priority.dot,
                          )}
                          title={`Приоритет: ${priority.label}`}
                        />
                        <span
                          className={cn(
                            'truncate font-medium',
                            openable && 'group-hover:text-primary',
                            task.status === 'done' &&
                              'text-muted-foreground line-through',
                            !editable && 'text-muted-foreground',
                          )}
                        >
                          {task.title}
                        </span>
                      </span>
                      {description && (
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {description}
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="hidden px-2 py-2.5 sm:table-cell">
                    <Badge className="bg-muted text-muted-foreground">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: task.projectColor }}
                      />
                      {task.projectName}
                    </Badge>
                  </td>
                  <td className="hidden px-2 py-2.5 text-[13px] md:table-cell">
                    {task.assigneeId && task.assigneeName ? (
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        title={`Отчёт: ${task.assigneeName}`}
                      >
                        {task.assigneeName}
                      </button>
                    ) : (
                      <span className="text-muted-foreground/60">
                        не назначен
                      </span>
                    )}
                  </td>
                  <td
                    className={cn(
                      'hidden px-2 py-2.5 text-[13px] lg:table-cell',
                      overdue
                        ? 'font-medium text-red-600 dark:text-red-400'
                        : 'text-muted-foreground',
                    )}
                  >
                    {task.dueDate ? formatDateRu(task.dueDate) : '—'}
                  </td>
                  <td className="hidden px-4 py-2.5 text-right text-[13px] tabular-nums text-muted-foreground lg:table-cell">
                    {task.estimate ? `${task.estimate} ч` : '—'}
                  </td>
                  <td className="hidden px-4 py-2.5 text-[13px] tabular-nums text-muted-foreground xl:table-cell">
                    {task.createdAt
                      ? new Date(task.createdAt).toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {editing && projects && users && (
        <TaskDialog
          key={editing.id}
          task={editing}
          projects={projects}
          users={users}
          onClose={() => setEditing(null)}
        />
      )}
      {report && (
        <PersonReportDialog
          key={report.id}
          personId={report.id}
          personName={report.name}
          onClose={() => setReport(null)}
        />
      )}
    </>
  )
}
