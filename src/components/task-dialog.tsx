'use client'

import { useEffect, useState, useActionState } from 'react'
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  } from '@/lib/actions/tasks'
import type { ActionState } from '@/lib/actions/auth'
import {
  TASK_STATUS_META,
  TASK_PRIORITY_META,
  type TaskStatus,
  type TaskPriority,
} from '@/lib/constants'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input, Select, Field } from '@/components/ui/input'
import { FormError } from '@/components/ui/alert'
import { RichTextEditor } from '@/components/rich-text-editor'

export type TaskDialogData = {
  id: string
  projectId: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId: string | null
  createdById: string | null // кто создал (для прав редактирования)
  dueDate: string | null
  estimate: number | null
  createdAt?: string // ISO — ставится автоматически при создании
}

type Option = { id: string; name: string }
type UserOption = { id: string; name: string }

export function TaskDialog({
  task,
  projects,
  users,
  defaultProjectId,
  onClose,
}: {
  task?: TaskDialogData | null
  projects: Option[]
  users: UserOption[]
  defaultProjectId?: string
  onClose: () => void
}) {
  const action = task ? updateTaskAction : createTaskAction
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    null,
  )
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (state?.ok) onClose()
  }, [state?.ok, onClose])

  async function handleDelete() {
    if (!task) return
    if (!window.confirm('Удалить задачу? Это действие нельзя отменить.')) return
    setDeleting(true)
    await deleteTaskAction(task.id)
    setDeleting(false)
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      className="max-w-3xl"
      title={task ? 'Редактирование задачи' : 'Новая задача'}
    >
      <form action={formAction} className="space-y-4">
        {task && <input type="hidden" name="id" value={task.id} />}
        <FormError message={state?.error} />

        <Field label="Название" htmlFor="task-title">
          <Input
            id="task-title"
            name="title"
            defaultValue={task?.title ?? ''}
            required
            placeholder="Что нужно сделать?"
            autoFocus
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Проект">
            <Select
              name="projectId"
              defaultValue={task?.projectId ?? defaultProjectId ?? ''}
              required
            >
              <option value="" disabled>
                Выберите проект
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          {task && (
            <Field label="Исполнитель">
              <Select
                name="assigneeId"
                defaultValue={task?.assigneeId ?? ''}
              >
                <option value="">Не назначен</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Статус">
            <Select name="status" defaultValue={task?.status ?? 'todo'}>
              {(Object.keys(TASK_STATUS_META) as TaskStatus[]).map((s) => (
                <option key={s} value={s}>
                  {TASK_STATUS_META[s].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Приоритет">
            <Select name="priority" defaultValue={task?.priority ?? 'normal'}>
              {(Object.keys(TASK_PRIORITY_META) as TaskPriority[]).map((p) => (
                <option key={p} value={p}>
                  {TASK_PRIORITY_META[p].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Срок">
            <Input
              type="date"
              name="dueDate"
              defaultValue={task?.dueDate ?? ''}
            />
          </Field>
          <Field label="Оценка, часов">
            <Input
              type="number"
              name="estimate"
              step="0.25"
              min="0"
              defaultValue={task?.estimate ?? ''}
              placeholder="8"
            />
          </Field>
        </div>

        <Field label="Описание">
          <RichTextEditor
            name="description"
            defaultValue={task?.description ?? ''}
            minHeight={140}
          />
        </Field>

        {task?.createdAt && (
          <p className="text-xs text-muted-foreground">
            Создана автоматически:{' '}
            {new Date(task.createdAt).toLocaleString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <div>
            {task && (
              <Button
                type="button"
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                onClick={handleDelete}
                pending={deleting}
              >
                Удалить
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" pending={pending}>
              {task ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
