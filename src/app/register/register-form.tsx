'use client'

import { useActionState } from 'react'
import { registerAction, type ActionState } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'
import { FormError } from '@/components/ui/alert'

export function RegisterForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    registerAction,
    null,
  )

  return (
    <form action={action} className="space-y-4">
      <FormError message={state?.error} />
      <Field label="Ваше имя" htmlFor="name">
        <Input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder="Иван Петров"
        />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.ru"
        />
      </Field>
      <Field label="Пароль" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="Минимум 6 символов"
        />
      </Field>
      <Button type="submit" className="w-full" pending={pending}>
        Создать аккаунт и войти
      </Button>
    </form>
  )
}
