import { db } from '@/lib/db'
import { withColdStartRetry } from '@/lib/cold-start'

/**
 * Проверка живости: будит базу после простоя.
 * Используется утренним пингом GitHub Actions (ПН–ПТ 08:00–10:00 МСК)
 * и удобна для ручных проверок доступности. Данных не раскрывает.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  await withColdStartRetry(() => db.$queryRaw`SELECT 1`)
  return Response.json({ ok: true })
}
