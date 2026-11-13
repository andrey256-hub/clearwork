'use client'

import { useActionState } from 'react'
import { loginAction, type ActionState } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'
import { FormError } from '@/components/ui/alert'

export function LoginForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    loginAction,
    null,
  )

  return (
    <form action={action} className="space-y-4">
      <FormError message={state?.error} />
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
          autoComplete="current-password"
          placeholder="••••••"
        />
      </Field>
      <Button type="submit" className="w-full" pending={pending}>
        Войти
      </Button>
    </form>
  )
}
