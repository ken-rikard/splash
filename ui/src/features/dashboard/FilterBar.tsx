import { cn } from '@/lib/utils'

type FilterValue = 'all' | 'favorites'

const GRADES = ['II', 'II+', 'III', 'III+', 'III−', 'IV', 'IV+', 'IV−', 'V', 'V+', 'V−', 'VI']

const LEVEL_LABELS = ['Low', 'Moderate', 'High', 'Very High', 'Extreme']

export type SortKey = 'name' | 'flow' | 'level' | 'distance'

interface FilterBarProps {
  filter: FilterValue
  onChange: (value: FilterValue) => void
  favoritesCount: number
  selectedGrades: string[]
  onGradeChange: (grades: string[]) => void
  selectedLevels: number[]
  onLevelChange: (levels: number[]) => void
  sortKey: SortKey
  sortAsc: boolean
  onSortChange: (key: SortKey, asc: boolean) => void
}

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2 py-1 text-[10px] font-semibold uppercase tracking-widest rounded-none transition-colors min-h-[32px]',
        active
          ? 'bg-accent-water/20 text-cyan-300 border border-accent-water/30'
          : 'text-slate-500 border border-transparent hover:text-slate-300'
      )}
    >
      {label}
    </button>
  )
}

export function FilterBar({
  filter,
  onChange,
  favoritesCount,
  selectedGrades,
  onGradeChange,
  selectedLevels,
  onLevelChange,
  sortKey,
  sortAsc,
  onSortChange,
}: FilterBarProps) {
  function toggleGrade(g: string) {
    if (selectedGrades.includes(g)) {
      onGradeChange(selectedGrades.filter((x) => x !== g))
    } else {
      onGradeChange([...selectedGrades, g])
    }
  }

  function toggleLevel(l: number) {
    if (selectedLevels.includes(l)) {
      onLevelChange(selectedLevels.filter((x) => x !== l))
    } else {
      onLevelChange([...selectedLevels, l])
    }
  }

  return (
    <div className="space-y-3">
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

        <div className="w-px h-4 bg-white/5 mx-1" aria-hidden="true" />

        <select
          value={`${sortKey}:${sortAsc ? 'asc' : 'desc'}`}
          onChange={(e) => {
            const [k, d] = e.target.value.split(':')
            onSortChange(k as SortKey, d === 'asc')
          }}
          className="bg-transparent text-[11px] font-semibold uppercase tracking-widest text-slate-400 hover:text-slate-300 px-2 py-1.5 min-h-[44px] outline-none cursor-pointer"
        >
          <option value="name:asc">Name ↑</option>
          <option value="name:desc">Name ↓</option>
          <option value="distance:asc">Nearest</option>
          <option value="distance:desc">Farthest</option>
          <option value="flow:desc">Flow ↑</option>
          <option value="flow:asc">Flow ↓</option>
          <option value="level:asc">Level ↑</option>
          <option value="level:desc">Level ↓</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <span className="text-[10px] text-slate-600 uppercase tracking-widest mr-1">Grade:</span>
        {GRADES.map((g) => (
          <Chip key={g} active={selectedGrades.includes(g)} label={g} onClick={() => toggleGrade(g)} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <span className="text-[10px] text-slate-600 uppercase tracking-widest mr-1">Level:</span>
        {[1, 2, 3, 4, 5].map((l) => (
          <Chip
            key={l}
            active={selectedLevels.includes(l)}
            label={`${l} ${LEVEL_LABELS[l - 1]}`}
            onClick={() => toggleLevel(l)}
          />
        ))}
      </div>
    </div>
  )
}
