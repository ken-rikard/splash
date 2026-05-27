import type { AlertLevel, RiverStatus } from '@/types'

export const DANGER_COLORS: Record<AlertLevel, string> = {
  1: 'bg-green-500',
  2: 'bg-yellow-500',
  3: 'bg-orange-500',
  4: 'bg-red-500',
  5: 'bg-purple-600',
}

export const STATUS_COLORS: Record<RiverStatus, string> = {
  ok: 'bg-green-500',
  stale: 'bg-amber-500',
  error: 'bg-red-500',
}

export function StatusDot({ level, status }: { level: AlertLevel; status: RiverStatus }) {
  const color = status === 'ok' ? DANGER_COLORS[level] : STATUS_COLORS[status]
  return <span className={`inline-block h-3 w-3 rounded-full ${color}`} aria-hidden="true" />
}
