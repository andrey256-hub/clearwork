import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ProfileForm, UsersPanel } from './settings-client'

export const metadata = { title: 'Настройки' }

export default async function SettingsPage() {
  const user = await requireUser()
  const isAdmin = user.role === 'admin'

  const users = isAdmin
    ? await db.user.findMany({
        orderBy: [{ role: 'desc' }, { name: 'asc' }],
      })
    : []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Настройки</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Профиль, участники и роли
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className={isAdmin ? '' : 'max-w-lg'}>
          <CardHeader
            title="Мой профиль"
            subtitle={user.email}
          />
          <CardContent>
            <ProfileForm name={user.name} />
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="lg:col-span-2">
            <CardHeader
              title="Пользователи"
              subtitle={`${users.length} участников в системе`}
            />
            <CardContent>
              <UsersPanel
                selfId={user.id}
                users={users.map((u) => ({
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  role: u.role,
                  createdAt: u.createdAt.toISOString(),
                }))}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
