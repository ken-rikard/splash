import { cn } from '@/lib/utils'

type FilterValue = 'all' | 'favorites'

interface FilterBarProps {
  filter: FilterValue
  onChange: (value: FilterValue) => void
  favoritesCount: number
}

export function FilterBar({ filter, onChange, favoritesCount }: FilterBarProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter rivers by favorites"
      className="inline-flex items-center rounded-none border border-white/5 bg-surface p-0.5 gap-0"
    >
      <button
        role="tab"
        aria-selected={filter === 'all'}
        onClick={() => onChange('all')}
        className={cn(
          'inline-flex items-center justify-center px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest rounded-none transition-colors duration-150 min-h-[44px]',
          filter === 'all'
            ? 'bg-surface-elevated text-white'
            : 'text-slate-400 hover:text-slate-300'
        )}
      >
        All Rivers
      </button>
      <div className="w-px h-4 bg-white/5" aria-hidden="true" />
      <button
        role="tab"
        aria-selected={filter === 'favorites'}
        onClick={() => onChange('favorites')}
        className={cn(
          'inline-flex items-center justify-center px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest rounded-none transition-colors duration-150 min-h-[44px]',
          filter === 'favorites'
            ? 'bg-surface-elevated text-white'
            : 'text-slate-400 hover:text-slate-300'
        )}
      >
        Favorites
        <span className="ml-1.5 text-[10px] text-slate-500">
          {favoritesCount}
        </span>
      </button>
    </div>
  )
}
