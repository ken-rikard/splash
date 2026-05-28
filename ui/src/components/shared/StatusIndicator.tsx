import type { FlowLevel, RiverStatus } from '@/types'

const LEVEL_COLORS: Record<FlowLevel, string> = {
  1: '#34d399',
  2: '#fbbf24',
  3: '#22d3ee',
  4: '#fb923c',
  5: '#fb7185',
}

const STATUS_COLORS: Record<RiverStatus, string> = {
  ok: '#34d399',
  stale: '#f59e0b',
  error: '#fb7185',
}

export function StatusDot({ level, status }: { level: FlowLevel; status: RiverStatus }) {
  const color = status === 'ok' ? LEVEL_COLORS[level] : STATUS_COLORS[status]
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
