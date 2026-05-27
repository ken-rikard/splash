import type { AlertLevel } from '@/types'

const LEVEL_COLORS = ['#34d399', '#fbbf24', '#fb923c', '#fb7185', '#a78bfa']
const LEVEL_LABELS = ['Low', 'Moderate', 'High', 'Very High', 'Extreme']

export function DangerLevelBar({ level }: { level: AlertLevel }) {
  return (
    <div className="flex gap-[3px]" role="img" aria-label={`Danger level ${level}: ${LEVEL_LABELS[level - 1]}`}>
      {LEVEL_COLORS.map((color, i) => {
        const active = i < level
        return (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-sm transition-colors duration-300"
            style={{
              backgroundColor: active ? color : 'rgba(255,255,255,0.06)',
              boxShadow: active ? `0 0 4px ${color}66` : 'none',
            }}
          />
        )
      })}
    </div>
  )
}
