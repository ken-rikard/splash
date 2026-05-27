import { useState } from 'react'
import { Heart } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { RiverCard } from './RiverCard'
import { FilterBar } from './FilterBar'
import EmptyState from './EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import { useRivers } from '@/hooks/useRivers'
import { useFavorites } from '@/hooks/useFavorites'

function DashboardPage() {
  const { rivers, status } = useRivers()
  const { isFavorite, toggleFavorite, count } = useFavorites()
  const [filter, setFilter] = useState<'all' | 'favorites'>('all')
  const displayRivers = filter === 'favorites'
    ? rivers.filter(r => isFavorite(r.id))
    : rivers

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
      <div className="flex items-start justify-between mb-8 flex-wrap gap-3">
        <h1 className="text-3xl font-display font-bold text-white tracking-tight">River Levels</h1>
        {count > 0 && (
          <FilterBar filter={filter} onChange={setFilter} favoritesCount={count} />
        )}
      </div>
      {status === 'stale' && (
        <div className="mb-6 rounded-lg border border-amber-500/10 bg-amber-500/5 px-4 py-3 text-sm text-amber-400/80">
          Data may be stale. Values shown may not reflect current conditions.
        </div>
      )}
      {filter === 'favorites' && displayRivers.length === 0 && rivers.length > 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="h-12 w-12 text-slate-600 mb-4" />
          <h2 className="text-lg font-display font-semibold text-white mb-1">No favorites yet</h2>
          <p className="text-sm text-slate-400 max-w-sm">Tap the ♡ on any river to add it to your favorites.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayRivers.map((river, i) => (
            <RiverCard
              key={river.id}
              river={river}
              index={i}
              isFavorite={isFavorite(river.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default DashboardPage
