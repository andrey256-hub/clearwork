'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { PROJECT_COLORS } from '@/lib/constants'
import type { ActionState } from '@/lib/actions/auth'

export async function createProjectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin()

  const name = String(formData.get('name') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const color = String(formData.get('color') ?? '')

  if (name.length < 2) return { error: 'Укажите название проекта' }

  await db.project.create({
    data: {
      name,
      description,
      color: PROJECT_COLORS.includes(color) ? color : PROJECT_COLORS[0],
    },
  })

  revalidatePath('/projects')
  revalidatePath('/')
  return { ok: true }
}

export async function updateProjectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin()

  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const color = String(formData.get('color') ?? '')
  const status = String(formData.get('status') ?? 'active')

  if (!id) return { error: 'Проект не найден' }
  if (name.length < 2) return { error: 'Укажите название проекта' }

  const project = await db.project.findUnique({ where: { id } })
  if (!project) return { error: 'Проект не найден' }

  await db.project.update({
    where: { id },
    data: {
      name,
      description,
      color: PROJECT_COLORS.includes(color) ? color : project.color,
      status: status === 'archived' ? 'archived' : 'active',
    },
  })

  revalidatePath('/projects')
  revalidatePath('/tasks')
  revalidatePath('/')
  return { ok: true }
}

/** Архивирование/восстановление проекта */
export async function toggleProjectStatusAction(id: string): Promise<void> {
  await requireAdmin()
  const project = await db.project.findUnique({ where: { id } })
  if (!project) return
  await db.project.update({
    where: { id },
    data: { status: project.status === 'archived' ? 'active' : 'archived' },
  })
  revalidatePath('/projects')
  revalidatePath('/tasks')
}
