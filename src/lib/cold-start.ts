/** Коды ошибок Prisma, при которых база Neon «просыпается» после простоя */
const COLD_START_CODES = new Set(['P1001', 'P1017'])

/**
 * Повторяет запрос, пока база Neon просыпается после простоя
 * (засыпает после 5 минут без обращений, просыпается за доли секунды).
 * Пользователь этого не замечает: попытки идут с короткой паузой.
 */
export async function withColdStartRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const code = (error as { code?: string } | null)?.code
      if (!code || !COLD_START_CODES.has(code)) throw error
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }
  }
  throw lastError
}
