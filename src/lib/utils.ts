import { twMerge } from 'tailwind-merge'

export function cn(...parts: Array<string | false | null | undefined>): string {
  return twMerge(parts.filter(Boolean).join(' '))
}

/** HTML описания задачи → простой текст для списков */
export function htmlToText(html: string): string {
  if (!html) return ''
  return html
    .replace(/<(br|\/p|\/li|\/h[1-6]|\/div|\/blockquote)[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Ключ дня в формате YYYY-MM-DD (локальное время сервера) */
export function toDayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function todayKey(): string {
  return toDayKey(new Date())
}

/** Понедельник текущей недели (локально) */
export function weekStartKey(d: Date = new Date()): string {
  const day = d.getDay() // 0 = вс
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff)
  return toDayKey(monday)
}

export function monthStartKey(d: Date = new Date()): string {
  return toDayKey(new Date(d.getFullYear(), d.getMonth(), 1))
}

export function addDaysKey(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  return toDayKey(new Date(y, m - 1, d + days))
}

/** 12.5 → "12,5" */
export function formatHours(h: number): string {
  const rounded = Math.round(h * 100) / 100
  return rounded.toFixed(2).replace(/\.?0+$/, '').replace('.', ',')
}

/** "2026-11-13" → "13.11.2026" */
export function formatDateRu(key: string): string {
  const [y, m, d] = key.split('-')
  if (!y || !m || !d) return key
  return `${d}.${m}.${y}`
}

/** "2026-11-13" → "13.11" */
export function formatDayShort(key: string): string {
  const [y, m, d] = key.split('-')
  if (!y || !m || !d) return key
  return `${d}.${m}`
}

const WEEKDAYS_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

export function formatDayWeekday(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${WEEKDAYS_SHORT[date.getDay()]}, ${d}.${pad(m)}`
}

/** 3725 секунд → "1:02:05" */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}:${pad(m)}:${pad(sec)}`
}

export function isOverdue(dueDate: string | null | undefined, status: string): boolean {
  if (!dueDate || status === 'done') return false
  return dueDate < todayKey()
}
