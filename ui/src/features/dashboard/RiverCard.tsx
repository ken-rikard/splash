import { StatusDot } from '@/components/shared/StatusIndicator'
import { FlowLevelBar } from '@/components/shared/FlowLevelBar'
import { FavoriteButton } from '@/components/shared/FavoriteButton'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import type { RiverData } from '@/types'

const LEVEL_LABELS = ['Empty', 'Low', 'Perfect', 'High', 'Extreme']

export function RiverCard({
  river,
  index = 0,
  isFavorite,
  onToggleFavorite,
}: {
  river: RiverData
  index?: number
  isFavorite: boolean
  onToggleFavorite: (id: string) => void
}) {
  return (
    <div
      className="group rounded-lg border border-white/5 bg-surface p-5 hover:border-white/10 hover:bg-surface-elevated transition-all duration-300 opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-center gap-3 min-w-0 mb-3">
        <StatusDot level={river.conditionLevel} status={river.status} />
        <p className="font-medium text-white truncate flex-1">{river.name}</p>
        <FavoriteButton
          riverId={river.id}
          isFavorite={isFavorite}
          onToggle={onToggleFavorite}
        />
      </div>

      <div className="flex items-baseline gap-1.5 mb-4">
        <p className="text-2xl sm:text-3xl font-display font-bold text-white leading-none tracking-tight">
          {river.currentLevel != null ? river.currentLevel.toFixed(2) : '—'}
        </p>
        <span className="text-sm text-slate-500 flex-1">{river.unit}</span>
        {river.grade && <span className="text-sm text-slate-500" title="Grade" >{river.grade}</span>}
      </div>

      <FlowLevelBar level={river.conditionLevel} />

      <Link
        to={`/river/${river.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-water hover:text-cyan-300 transition-colors mt-4 min-h-11 tracking-widest uppercase"
      >
        View Details
        <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  )
}
