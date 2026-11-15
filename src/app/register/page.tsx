import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { Logo } from '@/components/logo'
import { RegisterForm } from './register-form'

export const metadata = { title: 'Регистрация' }

export default async function RegisterPage() {
  const user = await getSessionUser()
  if (user) redirect('/')

  // Без запросов к базе: страница открывается мгновенно, даже когда база спит.
  // Первый зарегистрированный всё равно становится админом — это решает
  // само действие регистрации.

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
          <h1 className="mb-1 text-base font-semibold">Регистрация</h1>
          <p className="mb-5 text-[13px] text-muted-foreground">
            Создайте аккаунт, чтобы начать работу в команде
          </p>
          <RegisterForm />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Уже есть аккаунт? Войдите на странице входа
        </p>
        <p className="mt-2 text-center text-[13px]">
          <a href="/login" className="font-medium text-primary hover:underline">
            Войти
          </a>
        </p>
      </div>
    </div>
  )
}
