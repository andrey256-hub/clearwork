import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { Logo } from '@/components/logo'
import { LoginForm } from './login-form'

export const metadata = { title: 'Вход' }

export default async function LoginPage() {
  const user = await getSessionUser()
  if (user) redirect('/')

  // Без запросов к базе: экран входа открывается мгновенно,
  // даже когда база спит. Пробуждение происходит при нажатии «Войти».

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
          <h1 className="mb-1 text-base font-semibold">С возвращением</h1>
          <p className="mb-5 text-[13px] text-muted-foreground">
            Войдите, чтобы продолжить работу
          </p>
          <LoginForm />
          <p className="mt-4 text-center text-[13px] text-muted-foreground">
            Нет аккаунта?{' '}
            <a
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              Зарегистрироваться
            </a>
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          ClearWork — задачи, время и отчёты вашей команды
        </p>
      </div>
    </div>
  )
}
