import { useParams, Link } from 'react-router'
import { useRiver } from '@/hooks/useRiver'
import { DangerLevelSection } from './DangerLevelSection'
import { StatusDot } from '@/components/shared/StatusIndicator'
import ErrorState from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, MapPin, Clock } from 'lucide-react'

function RiverDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { river, status } = useRiver(id!)

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Skeleton className="h-4 w-32 mb-6" />
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-48 mb-8" />
        <div className="p-6 rounded-lg border border-neutral-200">
          <Skeleton className="h-4 w-24 mb-4" />
          <Skeleton className="h-10 w-32 mb-2" />
          <Skeleton className="h-3 w-full mb-4" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    )
  }

  if (status === 'error' || !river) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-6 min-h-11"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all rivers
        </Link>
        <ErrorState type="error" message="Could not load river data." />
      </div>
    )
  }

  const formattedDate = new Date(river.lastUpdated).toLocaleString()
  const staleWarning = river.status === 'stale'

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-6 min-h-11"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to all rivers
      </Link>

      <h1 className="text-3xl font-bold text-neutral-900 mb-4">{river.name}</h1>

      <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500 mb-2">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4" />
          {river.source}
        </span>
        <Badge variant="outline" className="text-xs">
          {river.stationId}
        </Badge>
        <span className="inline-flex items-center gap-1.5">
          <StatusDot level={river.alertLevel} status={river.status} />
          {river.status}
        </span>
      </div>

      <Separator className="my-6" />

      <DangerLevelSection
        level={river.alertLevel}
        currentLevel={river.currentLevel}
        unit={river.unit}
      />

      {staleWarning && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Data may be stale. Last updated: {formattedDate}
        </div>
      )}

      <Separator className="my-6" />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900">River Information</h2>
        <div className="inline-flex items-center gap-2 text-sm text-neutral-500">
          <Clock className="h-4 w-4" />
          Last updated: {formattedDate}
        </div>
        <div className="text-sm text-neutral-500">
          Status: <span className="font-medium text-neutral-700">{river.status}</span>
        </div>
        {river.error && (
          <p className="text-sm text-red-600">{river.error}</p>
        )}
      </div>
    </div>
  )
}

export default RiverDetailPage
