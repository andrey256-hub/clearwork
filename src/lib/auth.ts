import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { withColdStartRetry } from '@/lib/cold-start'

export const SESSION_COOKIE = 'cw_session'
const SESSION_TTL_DAYS = 30

export type SessionUser = {
  id: string
  name: string
  email: string
  role: string
}

export async function createSession(userId: string): Promise<void> {
  const session = await db.session.create({
    data: {
      userId,
      expiresAt: new Date(
        Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
      ),
    },
  })
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
    secure: process.env.NODE_ENV === 'production',
  })
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (!sessionId) return null

  const session = await withColdStartRetry(() =>
    db.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    }),
  )
  if (!session || session.expiresAt < new Date()) return null

  const { id, name, email, role } = session.user
  return { id, name, email, role }
}

/** Для страниц: если не авторизован — редирект на вход */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  return user
}

/** Для страниц администратора */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser()
  if (user.role !== 'admin') redirect('/')
  return user
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (sessionId) {
    await db.session.deleteMany({ where: { id: sessionId } })
    cookieStore.delete(SESSION_COOKIE)
  }
}
