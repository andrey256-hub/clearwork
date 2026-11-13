'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { isTaskPriority, isTaskStatus } from '@/lib/constants'
import { canEditTask } from '@/lib/permissions'
import type { ActionState } from '@/lib/actions/auth'

function readTaskFields(formData: FormData) {
  const projectId = String(formData.get('projectId') ?? '')
  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const statusRaw = String(formData.get('status') ?? 'todo')
  const priorityRaw = String(formData.get('priority') ?? 'normal')
  const assigneeRaw = String(formData.get('assigneeId') ?? '').trim()
  const dueDateRaw = String(formData.get('dueDate') ?? '').trim()
  const estimateRaw = String(formData.get('estimate') ?? '').trim()

  const status = isTaskStatus(statusRaw) ? statusRaw : 'todo'
  const priority = isTaskPriority(priorityRaw) ? priorityRaw : 'normal'
  const assigneeId = assigneeRaw ? assigneeRaw : null
  const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(dueDateRaw) ? dueDateRaw : null
  const estimate = estimateRaw ? Number(estimateRaw.replace(',', '.')) : null

  return {
    projectId,
    title,
    description,
    status,
    priority,
    assigneeId,
    dueDate,
    estimate: estimate !== null && Number.isFinite(estimate) && estimate > 0 ? estimate : null,
  }
}

export async function createTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const fields = readTaskFields(formData)

  if (!fields.projectId) return { error: 'Выберите проект' }
  if (fields.title.length < 2) return { error: 'Укажите название задачи' }

  const project = await db.project.findUnique({
    where: { id: fields.projectId },
  })
  if (!project) return { error: 'Проект не найден' }

  // При создании исполнитель — всегда тот, кто создаёт задачу
  const assigneeId = fields.assigneeId ?? user.id
  if (assigneeId) {
    const assignee = await db.user.findUnique({
      where: { id: assigneeId },
    })
    if (!assignee) return { error: 'Исполнитель не найден' }
  }

  await db.task.create({
    data: {
      ...fields,
      assigneeId,
      createdById: user.id,
    },
  })

  revalidatePath('/tasks')
  revalidatePath('/')
  return { ok: true }
}

export async function updateTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const id = String(formData.get('id') ?? '')
  if (!id) return { error: 'Задача не найдена' }

  const existing = await db.task.findUnique({ where: { id } })
  if (!existing) return { error: 'Задача не найдена' }
  if (!canEditTask(existing, user)) {
    return { error: 'Редактировать задачу может только её исполнитель' }
  }

  const fields = readTaskFields(formData)
  if (!fields.projectId) return { error: 'Выберите проект' }
  if (fields.title.length < 2) return { error: 'Укажите название задачи' }

  await db.task.update({ where: { id }, data: fields })

  revalidatePath('/tasks')
  revalidatePath('/')
  return { ok: true }
}

export async function deleteTaskAction(id: string): Promise<void> {
  const user = await requireUser()
  const existing = await db.task.findUnique({ where: { id } })
  if (!existing || !canEditTask(existing, user)) return
  await db.task.deleteMany({ where: { id } })
  revalidatePath('/tasks')
  revalidatePath('/')
}

/** Быстрая смена статуса из списка задач */
export async function updateTaskStatusAction(
  taskId: string,
  status: string,
): Promise<void> {
  const user = await requireUser()
  if (!isTaskStatus(status)) return
  const existing = await db.task.findUnique({ where: { id: taskId } })
  if (!existing || !canEditTask(existing, user)) return
  await db.task.updateMany({ where: { id: taskId }, data: { status } })
  revalidatePath('/tasks')
  revalidatePath('/')
}
