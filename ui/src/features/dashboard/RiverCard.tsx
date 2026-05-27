import { StatusDot } from '@/components/shared/StatusIndicator'
import { DangerLevelBar } from '@/components/shared/DangerLevelBar'
import { FavoriteButton } from '@/components/shared/FavoriteButton'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import type { RiverData } from '@/types'

const LEVEL_LABELS = ['Low', 'Moderate', 'High', 'Very High', 'Extreme']

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
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-3 min-w-0">
          <StatusDot level={river.alertLevel} status={river.status} />
          <p className="font-medium text-white truncate">{river.name}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          <FavoriteButton
            riverId={river.id}
            isFavorite={isFavorite}
            onToggle={onToggleFavorite}
          />
          <p className="text-2xl sm:text-3xl font-display font-bold text-white leading-none tracking-tight">
            {river.currentLevel ?? '—'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-1 mb-4">
        <p className="text-xs text-slate-500 tracking-wide">
          {river.grade && <span>{river.grade} · </span>}
          {river.unit}
        </p>
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
          {river.alertLevel}/5 · {LEVEL_LABELS[river.alertLevel - 1]}
        </span>
      </div>

      <DangerLevelBar level={river.alertLevel} />

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
