# Phase 3: Favorites Engine - Research

**Researched:** 2026-05-28
**Domain:** Client-side favorites persistence with localStorage + UI integration
**Confidence:** HIGH

## Summary

Phase 3 implements a personal river watchlist using localStorage. No server-side changes are needed — favorites live entirely in the browser, keyed by river ID, and persist naturally across page reloads, PWA restarts, and service worker updates. The core challenge is integrating the favorites toggle into existing RiverCard and RiverDetailPage components, adding a filter toggle to the dashboard, and ensuring the SSE live-data pipeline doesn't disrupt favorites state (it won't, because favorites are stored independently from the rivers data array).

**Primary recommendation:** Create a `useFavorites` hook (centralized patterns matching existing `useRivers`/`useRiver`), use lucide-react `Heart` icon for the favorite toggle, and add a segmented "All / Favorites" filter to the dashboard. No server endpoints, no new routes, no context provider — keep it simple.

## User Constraints (from AGENTS.md)

### Locked Decisions
- **No authentication backend**: v1 is single-user or local-storage based
- **No push infrastructure**: Notifications are in-app only until mobile wrapper is built
- **Data source reliability**: Scraping depends on third-party availability — need error handling and stale-data fallbacks (already handled by existing code)

### Existing Stack Decisions (from STATE.md)
- **@base-ui/react** for shadcn v4 base layer (not individual @radix-ui packages)
- **Express v5** catch-all route uses `/{*splat}` syntax
- **SSE bridge** with heartbeat + complete cleanup on disconnect
- **Feature-based** component organization in `ui/src/features/`

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FAV-01 | User can add/remove rivers to/from a favorites list from dashboard and detail page | `useFavorites` hook + `FavoriteButton` shared component integrated into RiverCard and RiverDetailPage |
| FAV-02 | Favorites persist across sessions via localStorage (works in PWA and Capacitor wrappers) | localStorage-backed hook; serializes `Set<string>` to JSON array; survives all browser storage lifetimes |
| PWA-01 | Service worker caches work reliably with localStorage-based state — no data loss on refresh | localStorage is synchronous, independent of SW caches; `autoUpdate` SW activation reloads preserve localStorage; no special handling needed |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Favorites storage & persistence | Browser / Client | — | localStorage is browser-only; no server involvement needed for v1 |
| Favorites toggle UI | Browser / Client | — | React components (RiverCard, RiverDetailPage) handle toggle interaction |
| Dashboard filter (All vs Favorites) | Browser / Client | — | Filter state lives in DashboardPage local state; no route change needed |
| Favorites state hydration | Browser / Client | — | `useFavorites` hook reads localStorage on mount, serves as single source of truth |

## Standard Stack

### Core (no new libraries needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `lucide-react` | ^1.16.0 | Heart icon for favorite toggle | Already installed and used throughout the codebase (ChevronRight, ArrowLeft, MapPin, Clock, etc.) |
| React | ^19.2.6 | `useState`, `useEffect`, `useCallback` for hook implementation | Already the UI framework |
| react-router | ^7.15.1 | Optional URL param for filter state | Already installed; used for routing |

### No new npm dependencies required

Phase 3 uses nothing outside the existing dependency tree. The `Heart` icon from lucide-react, `localStorage` API, and existing React hooks are sufficient.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `useFavorites` custom hook | React Context provider | Context is overkill for a simple set of IDs; hook is more testable and composable |
| localStorage | Zustand / Jotai with persist middleware | Added bundle size for no functional gain; localStorage handles the job directly |
| localStorage | IndexedDB via idb library | Overengineered for a list of river IDs; localStorage is synchronous and sufficient for <100 entries |

## Architecture Patterns

### Data Flow

```
User taps ♡ on RiverCard/RiverDetailPage
  → useFavorites().toggleFavorite(riverId)
    → Updates internal React state (Set<string>)
    → Writes to localStorage ("splash-favorites" key)
    → Components re-render via reactive state

On page load:
  → useFavorites() initializes from localStorage
    → If key exists → parse JSON array → Set<string>
    → If key missing → empty Set<string>

Dashboard filtering:
  → DashboardPage reads rivers from useRivers()
  → DashboardPage reads favorites from useFavorites()
  → Local filter state: 'all' | 'favorites'
  → Filtered rivers = filterState === 'favorites' ? rivers.filter(r => favorites.has(r.id)) : rivers
```

### Architecture Diagram

```mermaid
flowchart LR
    A[localStorage<br/>key:'splash-favorites'] -->|init| B[useFavorites hook]
    B -->|toggleFavorite(id)| A
    B -->|isFavorite(id)| C[RiverCard]
    B -->|isFavorite(id)| D[RiverDetailPage]
    C -->|onToggle| B
    D -->|onToggle| B
    E[useRivers hook] -->|rivers[]| F[DashboardPage]
    F -->|filter state| G["Filter: All | Favorites"]
    G -->|isFavorite(id)| H[Filtered river list]
    H -->|map| C
    subgraph "No server involvement"
        A
        B
        G
    end
    E -.->|SSE live data| F
```

### Recommended Project Structure (changes only)

```
ui/src/
├── hooks/
│   ├── useRivers.ts          # (existing)
│   ├── useRiver.ts           # (existing)
│   └── useFavorites.ts       # NEW — favorites persistence hook
├── components/
│   └── shared/
│       └── FavoriteButton.tsx # NEW — reusable favorite toggle button
├── features/
│   └── dashboard/
│       ├── DashboardPage.tsx  # MODIFIED — add filter toggle, pass favorite props to RiverCard
│       ├── RiverCard.tsx      # MODIFIED — accept isFavorite + onToggleFavorite props
│       ├── FilterBar.tsx      # NEW — "All Rivers" / "Favorites" segmented toggle
│       └── EmptyState.tsx     # (existing — reused for "no favorites" state)
│   └── river/
│       └── RiverDetailPage.tsx # MODIFIED — add favorite toggle in header
```

### Pattern 1: Custom Hook for localStorage State

**What:** A custom React hook that reads from localStorage on mount, provides a reactive `Set<string>` for favorites, and writes back on every change.

**When to use:** Any client-side state that needs persistence across sessions but doesn't need server synchronization.

**Key design decisions:**
- Store as JSON array of strings in localStorage (Sets aren't directly JSON-serializable)
- Use `useState` initializer function for the lazy read (runs once per mount)
- `useCallback` for `toggleFavorite` and `isFavorite` to prevent unnecessary re-renders
- `useEffect` to write back on every change (keeps storage in sync)
- Listen for `storage` event for cross-tab sync (optional enhancement)

**Pseudo-interface:**
```typescript
interface UseFavoritesReturn {
  favorites: Set<string>
  isFavorite: (id: string) => boolean
  toggleFavorite: (id: string) => void
  count: number
}
```

### Anti-Patterns to Avoid

- **Context Provider wrapper:** Don't wrap the app in a FavoritesProvider. A hook that reads from a shared `Set` is simpler and avoids the Context re-render tree.
- **Server-side sync endpoint:** Don't add `/api/favorites` endpoints. They'd require auth, which is out of scope per PROJECT.md constraints.
- **Redux/Zustand/state management:** Don't introduce a state management library for a single `Set<string>`. The hook + localStorage is the right level of abstraction.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| localStorage serialization | Custom JSON parse/error handling | Standard `JSON.parse`/`JSON.stringify` + try/catch in hook | The data is just `string[]` — no schema validation needed for v1 |
| Cross-tab sync | BroadcastChannel API for v1 | `window.addEventListener('storage')` | broadcastChannel is overengineered for v1; native `storage` event covers same-tab-origin sync |
| Icon animation | Custom CSS for heart fill animation | Simple class toggle (`text-red-500` + `fill-current` vs outline) | Animation is nice-to-have, not required for success criteria |

**Key insight:** Simple is correct for Phase 3. The entire feature is a Set of strings, persisted to localStorage, with a heart button. Don't abstract what doesn't need abstraction.

## Common Pitfalls

### Pitfall 1: SSR / Hydration mismatch
**What goes wrong:** If the hook tries to access `window.localStorage` during SSR or prerender, it throws.
**Why it happens:** Vite's dev mode or SSG might render on the server where `localStorage` isn't defined.
**How to avoid:** Use a lazy initializer with try/catch:
```typescript
const [favorites, setFavorites] = useState<Set<string>>(() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return new Set<string>(stored ? JSON.parse(stored) : [])
  } catch {
    return new Set<string>()
  }
})
```
**Warning signs:** `localStorage is not defined` error during build or dev.

### Pitfall 2: Stale closure in SSE event handler
**What goes wrong:** If the `useFavorites` hook is used inside the `useRivers` hook (it shouldn't be), the SSE callback could capture a stale favorites set.
**Why it happens:** The SSE `data-update` event listener closes over the `rivers` state setter but shouldn't touch favorites.
**How to avoid:** Keep `useFavorites` completely independent from `useRivers`. The dashboard combines their return values, not the hooks themselves.
**Warning signs:** Favorites disappearing after a data-update SSE event.

### Pitfall 3: localStorage quota exceeded
**What goes wrong:** If localStorage is full, `setItem` throws a `QuotaExceededError`.
**Why it happens:** Rare for storing a few river IDs, but possible if other apps fill the 5MB quota.
**How to avoid:** Wrap `setItem` in try/catch and handle gracefully (degrade to in-memory-only).
**Warning signs:** Favorites stop persisting across reloads; console `QuotaExceededError`.

### Pitfall 4: Missing cross-tab sync
**What goes wrong:** If the user has two Splash tabs open and favorites one in each, they don't see each other's changes until they reload.
**Why it happens:** localStorage changes don't auto-broadcast to other tabs of the same origin.
**How to avoid:** Listen for the `storage` event (fired automatically on other tabs when localStorage changes). This is a low-priority enhancement — not required for success criteria.
**Warning signs:** Not a bug, but a UX gap if users multi-tab.

## Code Examples

### Pattern: `useFavorites` hook

```typescript
// ui/src/hooks/useFavorites.ts
import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'splash-favorites'

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return new Set<string>(stored ? JSON.parse(stored) : [])
    } catch {
      return new Set<string>()
    }
  })

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]))
    } catch (err) {
      console.warn('Failed to persist favorites:', err)
    }
  }, [favorites])

  // Cross-tab sync
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) {
        try {
          setFavorites(new Set<string>(JSON.parse(e.newValue)))
        } catch { /* ignore malformed data */ }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const isFavorite = useCallback((id: string): boolean => {
    return favorites.has(id)
  }, [favorites])

  const toggleFavorite = useCallback((id: string): void => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    count: favorites.size,
  }
}
```

This hook is the entire backend for Phase 3. Verified against the existing `useRivers`/`useRiver` pattern (useState + useEffect, no external deps).

### Pattern: FavoriteButton component

```typescript
// ui/src/components/shared/FavoriteButton.tsx
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FavoriteButtonProps {
  riverId: string
  isFavorite: boolean
  onToggle: (id: string) => void
}

export function FavoriteButton({ riverId, isFavorite, onToggle }: FavoriteButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={(e) => {
        e.preventDefault()  // Prevent navigation when in a Link
        e.stopPropagation()
        onToggle(riverId)
      }}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      className={isFavorite ? 'text-red-400 hover:text-red-300' : 'text-slate-500 hover:text-slate-300'}
    >
      <Heart
        className="h-4 w-4"
        fill={isFavorite ? 'currentColor' : 'none'}
      />
    </Button>
  )
}
```

The `e.preventDefault()` + `e.stopPropagation()` is critical because RiverCard is wrapped in a `<Link>` — the button must not trigger navigation.

### Pattern: Dashboard filter integration

```typescript
// Inside DashboardPage.tsx — additions
import { useFavorites } from '@/hooks/useFavorites'

function DashboardPage() {
  const { rivers, status } = useRivers()
  const { isFavorite, toggleFavorite, count } = useFavorites()
  const [filter, setFilter] = useState<'all' | 'favorites'>('all')

  const displayRivers = filter === 'favorites'
    ? rivers.filter(r => isFavorite(r.id))
    : rivers

  // ... loading/error states unchanged ...

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-display font-bold text-white tracking-tight">River Levels</h1>
        {count > 0 && (
          <FilterBar filter={filter} onChange={setFilter} favoritesCount={count} />
        )}
      </div>
      {/* grid of RiverCard — pass isFavorite + toggleFavorite to each */}
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
    </div>
  )
}
```

### Pattern: RiverCard with favorite button

The RiverCard component needs two new props and a FavoriteButton in its layout. The favorite button sits in the top-right area alongside the currentLevel display.

```typescript
// Inside RiverCard — additions
import { FavoriteButton } from '@/components/shared/FavoriteButton'

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
    <div className="group rounded-lg border border-white/5 bg-surface p-5 ...">
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
      {/* ... rest unchanged ... */}
    </div>
  )
}
```

### Pattern: RiverDetailPage favorite toggle

Located in the header card, next to the river name.

```typescript
// Inside the header card of RiverDetailPage — additions
import { useFavorites } from '@/hooks/useFavorites'

function RiverDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { river, status } = useRiver(id!)
  const { isFavorite, toggleFavorite } = useFavorites()

  // ... in the header card ...
  <div className="flex items-start justify-between gap-4">
    <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight leading-tight">
      {river.name}
    </h1>
    <FavoriteButton
      riverId={river.id}
      isFavorite={isFavorite(river.id)}
      onToggle={toggleFavorite}
    />
  </div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| N/A — greenfield feature | localStorage-backed `useFavorites` hook | Phase 3 | Pure client-side persistence, no server |
| N/A — disabled nav item | N/A — still disabled | Phase 3 | Dedicated Favorites page is not in scope; Phase 5 adds Alerts page |

**Deprecated/outdated:** Nothing deprecated. This is a new feature building on existing patterns.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `Heart` icon from lucide-react supports `fill` styling for filled/unfilled toggle | Code Examples | LOW — lucide-react icons accept standard SVG props including `fill`; verified across all icons in the library |
| A2 | localStorage survives service worker `autoUpdate` activation reloads | PWA Resilience | HIGH — localStorage is origin-scoped and independent of SW lifecycle; this is a fundamental browser behavior |
| A3 | `WindowEventHandlers.onstorage` fires on other tabs for same-origin changes | Cross-tab Sync | LOW — standard Web API behavior, well-documented; only relevant for optional enhancement |
| A4 | No existing test infrastructure needs to be integrated | Testing Strategy | MEDIUM — no test files found; planner should plan tests as part of the phase |

## Open Questions (RESOLVED)

1. **FilterBar design — tabs, segmented control, or dropdown?** — RESOLVED: Segmented pill control (two buttons "All Rivers" / "Favorites") chosen per UI design discussion. Consistent with editorial dark theme, uses cn-based active/inactive styling from UI-SPEC.md.

2. **Empty state for "no favorites yet"** — RESOLVED: Inline "No favorites yet" empty state with Heart icon rendered directly in DashboardPage when filter === 'favorites' && displayRivers.length === 0. Separate EmptyState component not reused to avoid coupling the generic empty state to a favorites-specific message.

3. **Edge case: favorite a river that hasn't loaded yet** — RESOLVED: FavoriteButton is placed inside the `status === 'connected' && river` block in RiverDetailPage, so it only renders when river data is available. No special disabled-state handling needed.

## Environment Availability

> Skip this section — Phase 3 has no external dependencies. It's a client-side-only feature using existing dependencies (React, lucide-react, localStorage API).

## Validation Architecture

> Skipped — `workflow.nyquist_validation` is explicitly set to `false` in `.planning/config.json`.

## Security Domain

> Minimal — this phase operates entirely in the browser with localStorage. `security_enforcement` is not explicitly enabled, but the following observations apply:

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | partial | `JSON.parse` wrapped in try/catch for localStorage reads; no user-supplied strings written to DOM unsafely |
| V6 Cryptography | no | Favorites data (river IDs) has no PII or secrets; localStorage encryption is unnecessary for v1 |

### Threat Assessment

The only threat surface is localStorage quota exhaustion and malformed stored data. Both are handled by try/catch in the `useFavorites` hook initializer and setter. No injection, XSS, or CSRF concerns for a river-ID-only favorites list.

## Sources

### Primary (HIGH confidence)
- Codebase audit — all component structures, hooks, types, and styling patterns verified by reading source files
- lucide-react v1.16.0 — `Heart` icon API confirmed via official docs pattern (all lucide icons accept standard SVG props)
- MDN localStorage API — well-documented behavior for persistence lifecycle, quota, cross-tab events
- React hooks patterns — `useState` lazy initializer, `useCallback` memoization, `useEffect` sync pattern

### Secondary (MEDIUM confidence)
- VitePWA workbox configuration — verified via `vite.config.ts` (registerType: 'autoUpdate', runtimeCaching: [])

### Tertiary (LOW confidence)
- None — all critical claims are verified against codebase or standard Web/React APIs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries needed; everything is already in the dependency tree
- Architecture patterns: HIGH — straightforward hook + component pattern matching existing codebase conventions
- PWA resilience: HIGH — localStorage is inherently SW-independent; PWA-01 is satisfied by default
- Implementation details: HIGH — all code patterns verified against existing RiverCard, RiverDetailPage, useRivers, and useRiver structures

**Research date:** 2026-05-28
**Valid until:** Stable — this is pure React + Web API, not framework-dependent
