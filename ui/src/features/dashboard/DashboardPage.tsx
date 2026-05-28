import { useState, useMemo, useRef } from 'react'
import { Heart, MapPin } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { RiverCard } from './RiverCard'
import { FilterBar, type SortKey } from './FilterBar'
import EmptyState from './EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import { useRivers } from '@/hooks/useRivers'
import { useFavorites } from '@/hooks/useFavorites'
import { useHomeLocation } from '@/hooks/useHomeLocation'
import { haversineKm } from '@/lib/distance'

function DashboardPage() {
  const { rivers, status } = useRivers()
  const { isFavorite, toggleFavorite, count } = useFavorites()
  const { location: homeLocation, loading: homeLoading, requestGeolocation, setLocation, error: homeError } = useHomeLocation()
  const [filter, setFilter] = useState<'all' | 'favorites'>('all')
  const [selectedGrades, setSelectedGrades] = useState<string[]>([])
  const [selectedLevels, setSelectedLevels] = useState<number[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortAsc, setSortAsc] = useState(true)
  const [showHomeDialog, setShowHomeDialog] = useState(false)
  const [homeLat, setHomeLat] = useState('')
  const [homeLng, setHomeLng] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ lat: string; lon: string; display_name: string }>>([])
  const [searching, setSearching] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const displayRivers = useMemo(() => {
    let result = filter === 'favorites'
      ? rivers.filter(r => isFavorite(r.id))
      : [...rivers]

    if (selectedGrades.length > 0) {
      result = result.filter((r) => r.grade && selectedGrades.includes(r.grade))
    }

    if (selectedLevels.length > 0) {
      result = result.filter((r) => selectedLevels.includes(r.conditionLevel))
    }

    result.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') {
        cmp = a.name.localeCompare(b.name)
      } else if (sortKey === 'distance') {
        if (homeLocation && a.latitude != null && b.latitude != null && a.longitude != null && b.longitude != null) {
          const da = haversineKm(homeLocation.latitude, homeLocation.longitude, a.latitude, a.longitude)
          const db = haversineKm(homeLocation.latitude, homeLocation.longitude, b.latitude, b.longitude)
          cmp = da - db
        }
      } else if (sortKey === 'flow') {
        cmp = (a.currentLevel ?? 0) - (b.currentLevel ?? 0)
      } else if (sortKey === 'level') {
        cmp = a.conditionLevel - b.conditionLevel
      }
      return sortAsc ? cmp : -cmp
    })

    return result
  }, [rivers, filter, isFavorite, selectedGrades, selectedLevels, sortKey, sortAsc, homeLocation])

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
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">River Levels</h1>
          <div className="flex items-center gap-2">
            {homeLocation ? (
              <span className="text-[10px] text-slate-500">
                <MapPin className="inline h-3 w-3 mr-1" />
                {homeLocation.label ?? `${homeLocation.latitude.toFixed(4)}, ${homeLocation.longitude.toFixed(4)}`}
              </span>
            ) : (
              <Button variant="ghost" size="xs" onClick={() => { requestGeolocation(); if (!homeLoading) setShowHomeDialog(true) }}>
                <MapPin className="h-3 w-3 mr-1" />
                Set Home
              </Button>
            )}
          </div>
        </div>

        {homeError && (
          <div className="mb-3 rounded border border-amber-500/10 bg-amber-500/5 px-3 py-2 text-xs text-amber-400/80">
            {homeError}
          </div>
        )}

        <FilterBar
          filter={filter}
          onChange={setFilter}
          favoritesCount={count}
          selectedGrades={selectedGrades}
          onGradeChange={setSelectedGrades}
          selectedLevels={selectedLevels}
          onLevelChange={setSelectedLevels}
          sortKey={sortKey}
          sortAsc={sortAsc}
          onSortChange={(k, a) => { setSortKey(k); setSortAsc(a) }}
        />
      </div>

      {showHomeDialog && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60" onClick={() => setShowHomeDialog(false)}>
          <div className="rounded-lg border border-white/10 bg-surface p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-sm font-display font-semibold text-white mb-4">Set Home Location</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Search place</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    clearTimeout(searchTimer.current)
                    const q = e.target.value.trim()
                    if (q.length < 2) { setSearchResults([]); return }
                    searchTimer.current = setTimeout(() => {
                      setSearching(true)
                      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`, { headers: { 'Accept': 'application/json' } })
                        .then((r) => r.json())
                        .then((data) => { setSearchResults(data); setSearching(false) })
                        .catch(() => { setSearching(false) })
                    }, 400)
                  }}
                  placeholder="e.g. Oslo, Bergen, Trondheim…"
                  className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-accent-water/40 focus:outline-none"
                />
                {searching && <p className="text-[10px] text-slate-600 mt-1">Searching…</p>}
                {searchResults.length > 0 && (
                  <div className="mt-1 rounded border border-white/5 bg-surface overflow-hidden max-h-48 overflow-y-auto">
                    {searchResults.map((r, i) => (
                      <button
                        key={i}
                        type="button"
                        className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                        onClick={() => {
                          setLocation(parseFloat(r.lat), parseFloat(r.lon), r.display_name)
                          setShowHomeDialog(false)
                          setSearchQuery('')
                          setSearchResults([])
                        }}
                      >
                        {r.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-surface px-2 text-[10px] text-slate-600 uppercase">or enter coordinates</span>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={homeLat}
                    onChange={(e) => setHomeLat(e.target.value)}
                    placeholder="e.g. 59.91"
                    className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-accent-water/40 focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={homeLng}
                    onChange={(e) => setHomeLng(e.target.value)}
                    placeholder="e.g. 10.75"
                    className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-accent-water/40 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => {
                    const lat = parseFloat(homeLat)
                    const lng = parseFloat(homeLng)
                    if (!isNaN(lat) && !isNaN(lng)) {
                      setLocation(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`)
                      setShowHomeDialog(false)
                    }
                  }}
                  disabled={!homeLat || !homeLng}
                >
                  Save coords
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowHomeDialog(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
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
