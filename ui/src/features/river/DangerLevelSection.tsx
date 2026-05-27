import { Card } from '@/components/ui/card'
import { DangerLevelBar } from '@/components/shared/DangerLevelBar'
import type { AlertLevel } from '@/types'

const LEVEL_COLORS = ['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500', 'bg-purple-600']
const LEVEL_LABELS = ['Low', 'Moderate', 'High', 'Very High', 'Extreme']

export function DangerLevelSection({
  level,
  currentLevel,
  unit,
}: {
  level: AlertLevel
  currentLevel: number | null
  unit: string
}) {
  const label = LEVEL_LABELS[level - 1]
  const color = LEVEL_COLORS[level - 1]

  return (
    <Card className="p-6">
      <p className="text-sm font-medium text-neutral-500 uppercase tracking-wide mb-4">
        Danger Level
      </p>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-4xl font-bold text-neutral-900">
          {currentLevel ?? '—'}
        </span>
        <span className="text-lg text-neutral-500">{unit}</span>
      </div>
      <span className={`inline-block rounded-full px-3 py-0.5 text-sm font-medium text-white mb-4 ${color}`}>
        {label}
      </span>
      <DangerLevelBar level={level} />
      <div className="flex justify-between mt-1">
        {LEVEL_LABELS.map((lbl, i) => (
          <span key={i} className="text-xs text-neutral-400 text-center" style={{ width: `${100 / LEVEL_LABELS.length}%` }}>
            {lbl}
          </span>
        ))}
      </div>
    </Card>
  )
}
