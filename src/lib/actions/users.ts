'use server'

import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import type { ActionState } from '@/lib/actions/auth'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function createUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser()

  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const password = String(formData.get('password') ?? '')
  const role = String(formData.get('role') ?? 'member') === 'admin' ? 'admin' : 'member'

  if (name.length < 2) return { error: 'Укажите имя (минимум 2 символа)' }
  if (!EMAIL_RE.test(email)) return { error: 'Некорректный email' }
  if (password.length < 6) return { error: 'Пароль — минимум 6 символов' }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) return { error: 'Пользователь с таким email уже существует' }

  const passwordHash = await bcrypt.hash(password, 10)
  await db.user.create({ data: { name, email, passwordHash, role } })

  revalidatePath('/settings')
  return { ok: true }
}

export async function updateUserRoleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const current = await requireUser()

  const id = String(formData.get('id') ?? '')
  const role = String(formData.get('role') ?? '') === 'admin' ? 'admin' : 'member'

  if (!id) return { error: 'Пользователь не найден' }
  if (id === current.id && role === 'member') {
    return { error: 'Нельзя понизить собственную роль' }
  }
  if (role === 'member') {
    const target = await db.user.findUnique({ where: { id } })
    if (target?.role === 'admin') {
      const adminCount = await db.user.count({ where: { role: 'admin' } })
      if (adminCount <= 1) return { error: 'Нельзя оставить систему без администратора' }
    }
  }

  await db.user.update({ where: { id }, data: { role } })

  revalidatePath('/settings')
  revalidatePath('/')
  return { ok: true }
}

export async function resetUserPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser()

  const id = String(formData.get('id') ?? '')
  const password = String(formData.get('password') ?? '')

  if (!id) return { error: 'Пользователь не найден' }
  if (password.length < 6) return { error: 'Пароль — минимум 6 символов' }

  const target = await db.user.findUnique({ where: { id } })
  if (!target) return { error: 'Пользователь не найден' }

  const passwordHash = await bcrypt.hash(password, 10)
  await db.user.update({ where: { id }, data: { passwordHash } })
  await db.session.deleteMany({ where: { userId: id } })

  revalidatePath('/settings')
  return { ok: true }
}

/** Смена собственного имени/пароля */
export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const current = await requireUser()

  const name = String(formData.get('name') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (name.length < 2) return { error: 'Укажите имя (минимум 2 символа)' }

  const data: { name: string; passwordHash?: string } = { name }
  if (password) {
    if (password.length < 6) return { error: 'Новый пароль — минимум 6 символов' }
    data.passwordHash = await bcrypt.hash(password, 10)
  }

  await db.user.update({ where: { id: current.id }, data })

  revalidatePath('/settings')
  revalidatePath('/')
  return { ok: true }
}
