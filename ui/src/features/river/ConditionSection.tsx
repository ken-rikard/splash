import { FlowLevelBar } from '@/components/shared/FlowLevelBar'
import type { FlowLevel } from '@/types'

const LEVEL_COLORS: Record<FlowLevel, string> = {
  1: '#34d399',
  2: '#fbbf24',
  3: '#22d3ee',
  4: '#fb923c',
  5: '#fb7185',
}

const LEVEL_LABELS = ['Empty', 'Low', 'Perfect', 'High', 'Extreme']

export function ConditionSection({
  level,
  currentLevel,
  unit,
}: {
  level: FlowLevel
  currentLevel: number | null
  unit: string
}) {
  const label = LEVEL_LABELS[level - 1]
  const color = LEVEL_COLORS[level]

  return (
    <div className="rounded-lg border border-white/5 bg-surface p-6 sm:p-8">
      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-6">
        Flow Condition
      </p>
      <div className="flex items-baseline gap-3 mb-1">
        <span className="text-5xl sm:text-6xl font-display font-bold text-white leading-none tracking-tight">
          {currentLevel ?? '—'}
        </span>
        <span className="text-base text-slate-400 font-body">{unit}</span>
      </div>
      <span
        className="inline-block mt-4 mb-6 px-3 py-1 text-xs font-semibold uppercase tracking-widest"
        style={{
          color,
          backgroundColor: `${color}15`,
          boxShadow: `0 0 8px ${color}30`,
        }}
      >
        {label}
      </span>
      <FlowLevelBar level={level} />
      <div className="flex justify-between mt-2">
        {LEVEL_LABELS.map((lbl, i) => (
          <span
            key={i}
            className="text-[10px] text-slate-600 text-center uppercase tracking-wider"
            style={{ width: `${100 / LEVEL_LABELS.length}%` }}
          >
            {lbl}
          </span>
        ))}
      </div>
    </div>
  )
}
