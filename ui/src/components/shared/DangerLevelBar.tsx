import type { AlertLevel } from '@/types'

const LEVEL_COLORS = ['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500', 'bg-purple-600']
const LEVEL_LABELS = ['Low', 'Moderate', 'High', 'Very High', 'Extreme']

export function DangerLevelBar({ level }: { level: AlertLevel }) {
  return (
    <div className="flex gap-1" role="img" aria-label={`Danger level ${level}: ${LEVEL_LABELS[level - 1]}`}>
      {LEVEL_COLORS.map((color, i) => (
        <div
          key={i}
          className={`h-3 flex-1 rounded-sm ${i < level ? color : 'bg-neutral-200'}`}
        />
      ))}
    </div>
  )
}
