import type { AlertLevel, RiverStatus } from '@/types'

const DANGER_COLORS: Record<AlertLevel, string> = {
  1: '#34d399',
  2: '#fbbf24',
  3: '#fb923c',
  4: '#fb7185',
  5: '#a78bfa',
}

const STATUS_COLORS: Record<RiverStatus, string> = {
  ok: '#34d399',
  stale: '#f59e0b',
  error: '#fb7185',
}

export function StatusDot({ level, status }: { level: AlertLevel; status: RiverStatus }) {
  const color = status === 'ok' ? DANGER_COLORS[level] : STATUS_COLORS[status]
  return (
    <span
      className="inline-block h-3 w-3 rounded-full flex-shrink-0"
      style={{
        backgroundColor: color,
        boxShadow: status === 'ok' ? `0 0 6px ${color}66` : 'none',
      }}
      aria-hidden="true"
    />
  )
}
