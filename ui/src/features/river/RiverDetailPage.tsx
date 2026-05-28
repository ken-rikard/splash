import { useParams, Link } from 'react-router'
import { useRiver } from '@/hooks/useRiver'
import { useFavorites } from '@/hooks/useFavorites'
import { FavoriteButton } from '@/components/shared/FavoriteButton'
import { ConditionSection } from './ConditionSection'
import { StatusDot } from '@/components/shared/StatusIndicator'
import ErrorState from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MapPin, Clock } from 'lucide-react'
import { useAlertConfig } from '@/hooks/useAlertConfig'
import { AlertConfigSection } from '@/features/alerts/AlertConfigSection'

function RiverDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { river, status } = useRiver(id!)
  const { isFavorite, toggleFavorite } = useFavorites()
  const { config: alertConfig, loading: configLoading, updateConfig, removeConfig } = useAlertConfig(id!)

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-3xl">
        <Skeleton className="h-3 w-24 bg-white/10 mb-8" />
        <Skeleton className="h-10 w-64 bg-white/10 mb-3" />
        <Skeleton className="h-4 w-40 bg-white/10 mb-8" />
        <div className="p-8 rounded-lg border border-white/5 bg-surface">
          <Skeleton className="h-3 w-20 bg-white/10 mb-6" />
          <Skeleton className="h-14 w-36 bg-white/10 mb-2" />
          <Skeleton className="h-4 w-24 bg-white/10 mb-6" />
          <Skeleton className="h-2 w-full bg-white/10 mb-3" />
          <Skeleton className="h-2 w-full bg-white/10" />
        </div>
      </div>
    )
  }

  if (status === 'error' || !river) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-white transition-colors mb-8 min-h-11 tracking-wide"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to all rivers
        </Link>
        <ErrorState type="error" message="Could not load river data." />
      </div>
    )
  }

  const formattedDate = new Date(river.lastUpdated).toLocaleString()
  const staleWarning = river.status === 'stale'

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-8 min-h-11 tracking-widest uppercase"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to all rivers
      </Link>

      <div className="rounded-lg border border-white/5 bg-gradient-to-b from-surface to-surface/80 p-6 sm:p-8 mb-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight leading-tight">
              {river.name}
            </h1>
            {river.stationName && river.stationName !== river.name && (
              <p className="text-xs text-slate-500 mt-1">NVE station: {river.stationName}</p>
            )}
          </div>
          <FavoriteButton
            riverId={river.id}
            isFavorite={isFavorite(river.id)}
            onToggle={toggleFavorite}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          {river.grade && (
            <Badge variant="outline" className="text-[10px] uppercase tracking-widest text-slate-300 border-white/10">
              Grade {river.grade}
            </Badge>
          )}
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="h-3 w-3" />
            {river.source}
          </span>
          <Badge variant="outline" className="text-[10px] font-mono text-slate-500 border-white/5">
            {river.stationId}
          </Badge>
        </div>

        {river.description && (
          <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-prose">
            {river.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <StatusDot level={river.conditionLevel} status={river.status} />
            {river.status}
          </span>
        </div>
      </div>

      <ConditionSection
        level={river.conditionLevel}
        currentLevel={river.currentLevel}
        unit={river.unit}
      />

      <AlertConfigSection
        config={alertConfig}
        loading={configLoading}
        riverId={id!}
        updateConfig={updateConfig}
        removeConfig={removeConfig}
      />

      {staleWarning && (
        <div className="mt-4 rounded-lg border border-amber-500/10 bg-amber-500/5 px-4 py-3 text-sm text-amber-400/80">
          Data may be stale. Last updated: {formattedDate}
        </div>
      )}

      <div className="mt-8 border-t border-white/5 pt-6">
        <div className="space-y-3">
          <h2 className="text-sm font-display font-semibold text-white tracking-wide">River Information</h2>
          <div className="inline-flex items-center gap-2 text-xs text-slate-500">
            <Clock className="h-3 w-3" />
            Last updated: {formattedDate}
          </div>
          <div className="text-xs text-slate-500">
            Status: <span className="font-medium text-slate-300 capitalize">{river.status}</span>
          </div>
          {river.error && (
            <p className="text-xs text-danger-4">{river.error}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default RiverDetailPage
