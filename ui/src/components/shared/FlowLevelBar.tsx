import type { FlowLevel } from '@/types'

const LEVEL_LABELS = ['Empty', 'Low', 'Perfect', 'High', 'Extreme']

export function FlowLevelBar({ level }: { level: FlowLevel }) {
  return (
    <div className="flex gap-[3px]" role="img" aria-label={`Flow condition ${level}: ${LEVEL_LABELS[level - 1]}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-[5px] flex-1 rounded-full transition-colors duration-300"
          style={{
            backgroundColor: i <= level ? LEVEL_COLORS[i as FlowLevel] : 'rgba(255,255,255,0.08)',
            boxShadow: i <= level ? `0 0 4px ${LEVEL_COLORS[i as FlowLevel]}66` : 'none',
          }}
        />
      ))}
    </div>
  )
}

const LEVEL_COLORS: Record<FlowLevel, string> = {
  1: '#34d399',
  2: '#fbbf24',
  3: '#22d3ee',
  4: '#fb923c',
  5: '#fb7185',
}
