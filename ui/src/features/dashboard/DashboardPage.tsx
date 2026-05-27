import { Skeleton } from '@/components/ui/skeleton'
import { RiverCard } from './RiverCard'
import EmptyState from './EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import { useRivers } from '@/hooks/useRivers'

function DashboardPage() {
  const { rivers, status } = useRivers()

  if (status === 'loading') {
    return (
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-8 tracking-tight">River Levels</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-5 rounded-lg border border-white/5 bg-surface">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-3 rounded-full bg-white/10" />
                  <Skeleton className="h-4 w-28 bg-white/10" />
                </div>
                <Skeleton className="h-8 w-16 bg-white/10" />
              </div>
              <div className="flex items-center justify-between mt-4">
                <Skeleton className="h-3 w-24 bg-white/10" />
                <Skeleton className="h-3 w-16 bg-white/10" />
              </div>
              <Skeleton className="h-1.5 w-full mt-3 bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-8 tracking-tight">River Levels</h1>
        <ErrorState type="error" />
      </div>
    )
  }

  if (rivers.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-8 tracking-tight">River Levels</h1>
        <EmptyState />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-display font-bold text-white mb-8 tracking-tight">River Levels</h1>
      {status === 'stale' && (
        <div className="mb-6 rounded-lg border border-amber-500/10 bg-amber-500/5 px-4 py-3 text-sm text-amber-400/80">
          Data may be stale. Values shown may not reflect current conditions.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rivers.map((river, i) => (
          <RiverCard key={river.id} river={river} index={i} />
        ))}
      </div>
    </div>
  )
}

export default DashboardPage
