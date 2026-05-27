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
        <h1 className="text-2xl font-bold mb-6">River Levels</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-lg border border-neutral-200">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">River Levels</h1>
        <ErrorState type="error" />
      </div>
    )
  }

  if (rivers.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">River Levels</h1>
        <EmptyState />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">River Levels</h1>
      {status === 'stale' && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Data may be stale. Last updated time unknown.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rivers.map((river) => (
          <RiverCard key={river.id} river={river} />
        ))}
      </div>
    </div>
  )
}

export default DashboardPage
