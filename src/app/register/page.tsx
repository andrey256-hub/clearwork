import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { withColdStartRetry } from '@/lib/cold-start'
import { Logo } from '@/components/logo'
import { RegisterForm } from './register-form'

export const metadata = { title: 'Регистрация' }

export default async function RegisterPage() {
  const user = await getSessionUser()
  if (user) redirect('/')

  const userCount = await withColdStartRetry(() => db.user.count())
  const isFirst = userCount === 0

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
          <h1 className="mb-1 text-base font-semibold">
            {isFirst ? 'Первый запуск ClearWork' : 'Регистрация'}
          </h1>
          <p className="mb-5 text-[13px] text-muted-foreground">
            {isFirst
              ? 'Создайте аккаунт администратора — им вы управляете командой и проектами'
              : 'Создайте аккаунт, чтобы начать работу в команде'}
          </p>
          <RegisterForm />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {isFirst
            ? 'Остальных пользователей вы сможете добавить в настройках'
            : 'Уже есть аккаунт? Войдите на странице входа'}
        </p>
        {!isFirst && (
          <p className="mt-2 text-center text-[13px]">
            <a
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Войти
            </a>
          </p>
        )}
      </div>
    </div>
  )
}
