'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { createSession, destroySession } from '@/lib/auth'
import { withColdStartRetry } from '@/lib/cold-start'

export type ActionState = { error?: string; ok?: boolean } | null

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Укажите email и пароль' }
  }

  const user = await db.user.findUnique({ where: { email } })
  if (!user) {
    // Система ещё не настроена (первый запуск) — отправляем создать первый аккаунт
    const userCount = await withColdStartRetry(() => db.user.count())
    if (userCount === 0) redirect('/register')
    return { error: 'Неверный email или пароль' }
  }
  if (!(await bcrypt.compare(password, user.passwordHash))) {
    return { error: 'Неверный email или пароль' }
  }

  await createSession(user.id)
  redirect('/')
}

/** Первая регистрация в пустой системе — администратор, дальше — участники */
export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (name.length < 2) return { error: 'Укажите имя (минимум 2 символа)' }
  if (!EMAIL_RE.test(email)) return { error: 'Некорректный email' }
  if (password.length < 6) return { error: 'Пароль — минимум 6 символов' }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) return { error: 'Пользователь с таким email уже существует' }

  const userCount = await db.user.count()
  const passwordHash = await bcrypt.hash(password, 10)
  await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: userCount === 0 ? 'admin' : 'member',
    },
  })

  // Входим сразу: сначала находим созданного пользователя
  const user = await db.user.findUnique({ where: { email } })
  if (user) await createSession(user.id)
  redirect('/')
}

export async function logoutAction(): Promise<void> {
  await destroySession()
  redirect('/login')
}
