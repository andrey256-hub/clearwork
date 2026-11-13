'use client'

import {
  useEffect,
  useActionState,
  useRef,
  useState,
  useTransition,
} from 'react'
import {
  createUserAction,
  resetUserPasswordAction,
  updateProfileAction,
  updateUserRoleAction,
  } from '@/lib/actions/users'
import type { ActionState } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input, Select, Field } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { FormError, FormSuccess } from '@/components/ui/alert'
import { ROLE_META, type UserRole } from '@/lib/constants'
import { formatDateRu } from '@/lib/utils'

type AdminUser = {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export function ProfileForm({
  name,
}: {
  name: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | undefined>()
  const [saved, setSaved] = useState(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current)
    }
  }, [])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateProfileAction(null, formData)
      if (res?.error) {
        setError(res.error)
        setSaved(false)
        return
      }
      setError(undefined)
      setSaved(true)
      if (savedTimer.current) clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setSaved(false), 2500)
    })
  }

  return (
    <form action={undefined} onSubmit={handleSubmit} className="space-y-4">
      <FormError message={error} />
      <FormSuccess message={saved ? 'Профиль обновлён' : undefined} />
      <Field label="Имя" htmlFor="profile-name">
        <Input
          id="profile-name"
          name="name"
          defaultValue={name}
          required
          autoComplete="name"
        />
      </Field>
      <Field label="Новый пароль" htmlFor="profile-password">
        <Input
          id="profile-password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Оставьте пустым, чтобы не менять"
        />
      </Field>
      <Button type="submit" pending={pending}>
        Сохранить
      </Button>
    </form>
  )
}

function RoleSelect({ user, selfId }: { user: AdminUser; selfId: string }) {
  const isSelf = user.id === selfId
  const [role, setRole] = useState(user.role)
  const [error, setError] = useState<string | undefined>()
  const [pending, setPending] = useState(false)

  async function change(next: string) {
    const prev = role
    setRole(next)
    setError(undefined)
    setPending(true)
    const fd = new FormData()
    fd.set('id', user.id)
    fd.set('role', next)
    const res = await updateUserRoleAction(null, fd)
    setPending(false)
    if (res?.error) {
      setRole(prev)
      setError(res.error)
    }
  }

  return (
    <div>
      <Select
        value={role}
        disabled={isSelf || pending}
        aria-label={`Роль ${user.name}`}
        className="h-8 w-40 text-[13px]"
        onChange={(e) => change(e.target.value)}
      >
        {(Object.keys(ROLE_META) as UserRole[]).map((r) => (
          <option key={r} value={r}>
            {ROLE_META[r].label}
          </option>
        ))}
      </Select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {isSelf && (
        <p className="mt-1 text-[11px] text-muted-foreground">вы</p>
      )}
    </div>
  )
}

function ResetPasswordButton({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | undefined>()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await resetUserPasswordAction(null, formData)
      if (res?.error) {
        setError(res.error)
        return
      }
      setError(undefined)
      setOpen(false)
    })
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Сбросить пароль
      </Button>
      {open && (
        <Modal
          open
          onClose={() => setOpen(false)}
          title={`Новый пароль — ${user.name}`}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="id" value={user.id} />
            <FormError message={error} />
            <Field label="Новый пароль" htmlFor="reset-password">
              <Input
                id="reset-password"
                name="password"
                type="password"
                required
                minLength={6}
                autoFocus
                placeholder="Минимум 6 символов"
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              Все активные сессии пользователя будут завершены.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Отмена
              </Button>
              <Button type="submit" pending={pending}>
                Сбросить
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

export function UsersPanel({
  users,
  selfId,
}: {
  users: AdminUser[]
  selfId: string
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createUserAction,
    null,
  )

  return (
    <div className="space-y-5">
      {/* Создание пользователя */}
      <form action={action} className="space-y-3">
        <h3 className="text-sm font-semibold">Добавить участника</h3>
        <FormError message={state?.error} />
        <FormSuccess message={state?.ok ? 'Пользователь создан' : undefined} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Имя" htmlFor="new-name">
            <Input id="new-name" name="name" required placeholder="Иван Петров" />
          </Field>
          <Field label="Email" htmlFor="new-email">
            <Input
              id="new-email"
              name="email"
              type="email"
              required
              placeholder="user@company.ru"
            />
          </Field>
          <Field label="Пароль" htmlFor="new-password">
            <Input
              id="new-password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Минимум 6 символов"
            />
          </Field>
          <Field label="Роль" htmlFor="new-role">
            <Select id="new-role" name="role" defaultValue="member">
              <option value="member">Участник</option>
              <option value="admin">Администратор</option>
            </Select>
          </Field>
        </div>
        <Button type="submit" pending={pending}>
          Создать пользователя
        </Button>
      </form>

      {/* Список */}
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Имя</th>
                <th className="px-2 py-2.5 font-medium">Email</th>
                <th className="px-2 py-2.5 font-medium">Роль</th>
                <th className="hidden px-2 py-2.5 font-medium sm:table-cell">
                  С нами с
                </th>
                <th className="px-4 py-2.5 text-right font-medium">Пароль</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/50">
                  <td className="px-4 py-2.5 font-medium">{u.name}</td>
                  <td className="px-2 py-2.5 text-[13px] text-muted-foreground">
                    {u.email}
                  </td>
                  <td className="px-2 py-2.5">
                    <RoleSelect user={u} selfId={selfId} />
                  </td>
                  <td className="hidden px-2 py-2.5 text-[13px] text-muted-foreground sm:table-cell">
                    {formatDateRu(u.createdAt.slice(0, 10))}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <ResetPasswordButton user={u} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
