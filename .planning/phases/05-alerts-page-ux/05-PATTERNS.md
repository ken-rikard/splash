# Phase 5: Alerts Page + UX — Pattern Map

**Mapped:** 2026-05-28
**Files analyzed:** 13 (4 new, 9 modified)
**Analogs found:** 13 / 13

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/core/events.ts` | model | event-driven | `src/core/events.ts` (self) | exact — add event types |
| `src/core/alert-engine.ts` | service | event-driven | `src/core/alert-engine.ts` (self) | exact — modify return type |
| `src/index.ts` | config | request-response | `src/index.ts` (self) | exact — add wiring |
| `server.ts` | controller | request-response | `server.ts` (self) | exact — add endpoints + SSE |
| `ui/src/types/index.ts` | model | CRUD | `ui/src/types/index.ts` (self) | exact — add interfaces |
| `ui/src/hooks/useAlerts.tsx` | hook | event-driven + CRUD | `ui/src/hooks/useRivers.ts` + `ui/src/hooks/useFavorites.ts` | composite — SSE + localStorage |
| `ui/src/hooks/useAlertConfig.ts` | hook | CRUD | `ui/src/hooks/useRiver.ts` | role-match — fetch single resource |
| `ui/src/features/alerts/AlertsPage.tsx` | component | request-response | `ui/src/features/dashboard/DashboardPage.tsx` | role-match — page with loading/error/empty |
| `ui/src/features/alerts/AlertCard.tsx` | component | CRUD | `ui/src/features/dashboard/RiverCard.tsx` | role-match — card with stagger animation |
| `ui/src/App.tsx` | component | request-response | `ui/src/App.tsx` (self) | exact — add provider wrapper |
| `ui/src/routes/index.tsx` | route | request-response | `ui/src/routes/index.tsx` (self) | exact — add route |
| `ui/src/components/layout/NavBar.tsx` | component | request-response | `ui/src/components/layout/NavBar.tsx` (self) | exact — add nav item + badge |
| `ui/src/features/river/RiverDetailPage.tsx` | component | request-response | `ui/src/features/river/RiverDetailPage.tsx` (self) | exact — add section |

---

## Pattern Assignments

### `src/core/events.ts` (model, event-driven) — MODIFY

**Analog:** `src/core/events.ts` (self, lines 1-27)

**Existing ScraperEventMap pattern** (lines 4-9) — add two new event types:
```typescript
export interface ScraperEventMap {
  'data-update': (rivers: RiverData[]) => void
  'error': (error: Error) => void
  'stale': (since: Date) => void
  'status-change': (status: ScraperStatus) => void
}
```

**New import to add** (after line 1):
```typescript
import type { ActiveAlert } from './types.js'
```

**New event types to add** inside `ScraperEventMap` (after line 8):
```typescript
  'alert-trigger': (alert: ActiveAlert) => void
  'alert-resolve': (info: { riverId: string }) => void
```

**Key pattern:** Each event map entry is typed as `(param: Type) => void` — no return value. The `ScraperEventBus` class uses generic `on<K>`, `emit<K>`, `removeListener<K>` methods that accept only keys from `ScraperEventMap`. Adding new keys is additive — existing listeners and callers are unchanged.

---

### `src/core/alert-engine.ts` (service, event-driven) — MODIFY

**Analog:** `src/core/alert-engine.ts` (self, lines 1-101)

**Existing evaluate() pattern** (lines 44-77) — currently returns `void`:
```typescript
evaluate(rivers: RiverData[]): void {
  for (const river of rivers) {
    const config = this.configs.get(river.id)
    if (!config || !config.enabled) {
      this.activeAlerts.delete(river.id)
      continue
    }

    if (river.currentLevel === null) continue

    const isTriggered = this.isThresholdExceeded(config, river)
    const hasActive = this.activeAlerts.has(river.id)

    if (isTriggered && !hasActive) {
      this.activeAlerts.set(river.id, {
        riverId: river.id,
        config,
        threshold: this.resolveThreshold(config),
        currentValue: river.currentLevel,
        alertLevel: river.alertLevel,
        triggeredAt: new Date(),
        snapshot: { ...river },
      })
    } else if (!isTriggered && hasActive) {
      this.activeAlerts.delete(river.id)
    }
  }
}
```

**Modified evaluate() signature** (from RESEARCH.md lines 243-283) — return `{ triggered, resolved }`:
```typescript
evaluate(rivers: RiverData[]): { triggered: ActiveAlert[]; resolved: string[] } {
  const triggered: ActiveAlert[] = []
  const resolved: string[] = []

  for (const river of rivers) {
    const config = this.configs.get(river.id)
    if (!config || !config.enabled) {
      if (this.activeAlerts.has(river.id)) {
        this.activeAlerts.delete(river.id)
        resolved.push(river.id)
      }
      continue
    }

    if (river.currentLevel === null) continue

    const isTriggered = this.isThresholdExceeded(config, river)
    const hasActive = this.activeAlerts.has(river.id)

    if (isTriggered && !hasActive) {
      const alert: ActiveAlert = {
        riverId: river.id,
        config,
        threshold: this.resolveThreshold(config),
        currentValue: river.currentLevel,
        alertLevel: river.alertLevel,
        triggeredAt: new Date(),
        snapshot: { ...river },
      }
      this.activeAlerts.set(river.id, alert)
      triggered.push(alert)
    } else if (!isTriggered && hasActive) {
      this.activeAlerts.delete(river.id)
      resolved.push(river.id)
    }
  }

  return { triggered, resolved }
}
```

**Key changes:**
1. Return type changes from `void` to `{ triggered: ActiveAlert[]; resolved: string[] }`
2. New `triggered` array accumulates alerts that transitioned from inactive → active
3. New `resolved` array accumulates riverIds that transitioned from active → inactive
4. Old callers that ignore the return value continue to work (no breakage)
5. The `!config || !config.enabled` branch now conditionally resolves only if there was an existing active alert (was always deleting before)

---

### `src/index.ts` (config, request-response) — MODIFY

**Analog:** `src/index.ts` (self, lines 1-42)

**Existing data-update handler** (lines 17-20) — currently just calls evaluate:
```typescript
engine.eventBus.on('data-update', (rivers) => {
  alertEngine.evaluate(rivers)
  console.log(`Flow data updated: ${rivers.length} rivers`)
})
```

**Modified data-update handler** (from RESEARCH.md lines 287-301) — emit alert events from diff:
```typescript
engine.eventBus.on('data-update', (rivers) => {
  const { triggered, resolved } = alertEngine.evaluate(rivers)

  for (const alert of triggered) {
    engine.eventBus.emit('alert-trigger', alert)
  }
  for (const riverId of resolved) {
    engine.eventBus.emit('alert-resolve', { riverId })
  }

  console.log(`Flow data updated: ${rivers.length} rivers`)
})
```

**Key pattern:** The caller (index.ts) owns the event emission logic. `AlertEngine` returns what changed; the caller decides how to propagate it. This keeps `AlertEngine` decoupled from `ScraperEventBus` — the engine doesn't know about events at all.

---

### `server.ts` (controller, request-response) — MODIFY

**Analog:** `server.ts` (self, lines 1-154)

**Existing SSE listener pattern** (lines 126-128) — add `alert-trigger` and `alert-resolve` listeners:
```typescript
// Existing — add after these lines
engine.eventBus.on('data-update', onUpdate)
engine.eventBus.on('error', onError)
engine.eventBus.on('stale', onStale)
```

**New SSE listeners** (inside `app.get('/api/events', ...)` handler, after the `onStale` declaration on line 123):
```typescript
const onAlertTrigger = (alert: ActiveAlert) => {
  res.write(`event: alert-trigger\ndata: ${JSON.stringify(alert)}\n\n`)
}

const onAlertResolve = (info: { riverId: string }) => {
  res.write(`event: alert-resolve\ndata: ${JSON.stringify(info)}\n\n`)
}

engine.eventBus.on('alert-trigger', onAlertTrigger)
engine.eventBus.on('alert-resolve', onAlertResolve)
```

**SSE cleanup** (inside `req.on('close')`, after line 139):
```typescript
engine.eventBus.removeListener('alert-trigger', onAlertTrigger as any)
engine.eventBus.removeListener('alert-resolve', onAlertResolve as any)
```

**Existing REST endpoint pattern** (lines 34-47) — copy for GET config by ID:
```typescript
// REST: return single river by id
app.get('/api/rivers/:id', (req, res) => {
  const river = engine.dataStore.getById(req.params.id)
  if (!river) {
    res.status(404).json({ error: 'River not found' })
    return
  }
  res.json(enrichWithRegistry(river))
})
```

**New GET /api/alerts/config/:id endpoint** (from RESEARCH.md lines 845-856) — place after existing alert endpoints (after `GET /api/alerts/active` on line 101):
```typescript
// GET /api/alerts/config/:id — get alert config for a specific river
app.get('/api/alerts/config/:id', (req, res) => {
  const config = alertEngine.getConfig(req.params.id)
  if (!config) {
    res.status(404).json({ error: 'No alert config for this river' })
    return
  }
  res.json(config)
})
```

**Inline validation pattern** (from server.ts lines 58-85) — already established:
```typescript
if (!type || (type !== 'level' && type !== 'numeric')) {
  res.status(400).json({ error: 'type must be "level" or "numeric"' })
  return
}
```

**Import update** — `server.ts` already imports `alertEngine` from `src/index.js` (line 4). Add `ActiveAlert` type import:
```typescript
import type { RiverData, AlertLevel, ActiveAlert } from './src/core/types.js'
```

---

### `ui/src/types/index.ts` (model, CRUD) — MODIFY

**Analog:** `ui/src/types/index.ts` (self, lines 1-39)

**Existing type pattern** (lines 1-18):
```typescript
export type AlertLevel = 1 | 2 | 3 | 4 | 5

export interface RiverData {
  id: string
  name: string
  // ...
}
```

**New interfaces to add** (from RESEARCH.md lines 916-933):
```typescript
export interface AlertConfig {
  riverId: string
  type: 'level' | 'numeric'
  level?: AlertLevel
  customValue?: number
  enabled: boolean
}

export interface ActiveAlert {
  riverId: string
  config: AlertConfig
  threshold: number
  currentValue: number
  alertLevel: AlertLevel
  triggeredAt: Date
  snapshot: RiverData
}
```

---

### `ui/src/hooks/useAlerts.tsx` (hook, event-driven + CRUD) — NEW

**Analog — SSE subscription:** `ui/src/hooks/useRivers.ts` (lines 1-45) — EventSource subscription
**Analog — localStorage persistence:** `ui/src/hooks/useFavorites.ts` (lines 1-57) — localStorage read/write

**SSE subscription pattern** (useRivers.ts, lines 21-42):
```typescript
// SSE subscription for live updates
useEffect(() => {
  const es = new EventSource('/api/events')

  es.addEventListener('data-update', (event: MessageEvent) => {
    const data = JSON.parse(event.data) as RiverData[]
    setRivers(data)
    setStatus('connected')
  })

  es.addEventListener('error', () => {
    setStatus('error')
  })

  return () => {
    es.close()
  }
}, [])
```

**localStorage persistence pattern** (useFavorites.ts, lines 1-21):
```typescript
const STORAGE_KEY = 'splash-favorites'

// Lazy initialization from localStorage on mount
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
```

**AlertProvider + useAlerts pattern** (from RESEARCH.md lines 337-456) — concrete implementation:
```typescript
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { ActiveAlert } from '@/types'

interface AlertContextValue {
  alerts: ActiveAlert[]
  allAlerts: ActiveAlert[]
  resolvedAlerts: ResolvedAlertInfo[]
  count: number
  dismissAlert: (riverId: string) => void
  status: 'loading' | 'connected' | 'error'
}

interface ResolvedAlertInfo {
  riverId: string
  resolvedAt: Date
}

const STORAGE_KEY = 'splash-dismissed-alerts'

const AlertContext = createContext<AlertContextValue | null>(null)

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<ActiveAlert[]>([])
  const [resolvedAlerts, setResolvedAlerts] = useState<ResolvedAlertInfo[]>([])
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading')
  const [dismissedAt, setDismissedAt] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    } catch { return {} }
  })

  // Persist dismissed state to localStorage (copied from useFavorites pattern)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissedAt))
    } catch (err) {
      console.warn('Failed to persist alert dismissals:', err)
    }
  }, [dismissedAt])

  // Initial REST fetch
  useEffect(() => {
    fetch('/api/alerts/active')
      .then((res) => res.json())
      .then((data: ActiveAlert[]) => {
        setAlerts(prev => {
          // Merge: keep SSE additions that haven't been seen by server yet
          const serverIds = new Set(data.map(a => a.riverId))
          const extras = prev.filter(a => !serverIds.has(a.riverId))
          return [...data.map(a => ({ ...a, triggeredAt: new Date(a.triggeredAt) })), ...extras]
        })
        setStatus('connected')
      })
      .catch(() => setStatus('error'))
  }, [])

  // SSE subscription (single EventSource — Context provides shared state)
  useEffect(() => {
    const es = new EventSource('/api/events')

    es.addEventListener('alert-trigger', (event: MessageEvent) => {
      const alert = JSON.parse(event.data) as ActiveAlert
      alert.triggeredAt = new Date(alert.triggeredAt)  // re-parse Date from JSON string
      setAlerts(prev => [...prev.filter(a => a.riverId !== alert.riverId), alert])
      setStatus('connected')
    })

    es.addEventListener('alert-resolve', (event: MessageEvent) => {
      const { riverId } = JSON.parse(event.data)
      setAlerts(prev => prev.filter(a => a.riverId !== riverId))
      setResolvedAlerts(prev => [...prev, { riverId, resolvedAt: new Date() }])
    })

    es.addEventListener('error', () => {
      setStatus('error')
    })

    return () => es.close()
  }, [])

  const dismissAlert = useCallback((riverId: string) => {
    setDismissedAt(prev => ({ ...prev, [riverId]: Date.now() }))
  }, [])

  // Filter dismissed alerts with re-trigger detection
  const undismissedAlerts = alerts.filter(alert => {
    const dismissed = dismissedAt[alert.riverId]
    if (dismissed === undefined) return true
    // Only show if the alert triggered AFTER the dismissal (re-trigger case)
    return new Date(alert.triggeredAt).getTime() > dismissed
  })

  return (
    <AlertContext.Provider
      value={{
        alerts: undismissedAlerts,
        allAlerts: alerts,
        resolvedAlerts,
        count: undismissedAlerts.length,
        dismissAlert,
        status,
      }}
    >
      {children}
    </AlertContext.Provider>
  )
}

export function useAlerts(): AlertContextValue {
  const ctx = useContext(AlertContext)
  if (!ctx) throw new Error('useAlerts must be used within AlertProvider')
  return ctx
}
```

**Key patterns to copy:**
1. **localStorage lazy init** (from `useFavorites.ts` lines 6-13): `useState<T>(() => { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') } catch { return {} } })`
2. **localStorage persistence** (from `useFavorites.ts` lines 15-21): `useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)) } catch (err) { console.warn(...) } }, [state])`
3. **SSE EventSource** (from `useRivers.ts` lines 22-42): `new EventSource('/api/events')` → `es.addEventListener(...)` → `return () => es.close()`
4. **Status state machine** (from `useRivers.ts` lines 7-8): `type Status = 'loading' | 'connected' | 'error'`
5. **Context guard** (from RESEARCH.md lines 452-455): `const ctx = useContext(Ctx); if (!ctx) throw new Error(...)`

---

### `ui/src/hooks/useAlertConfig.ts` (hook, CRUD) — NEW

**Analog:** `ui/src/hooks/useRiver.ts` (lines 1-30) — single resource fetch hook

**Existing useRiver pattern** (lines 1-30):
```typescript
import { useState, useEffect } from 'react'
import type { RiverData } from '@/types'

type RiverDetailStatus = 'loading' | 'connected' | 'error'

export function useRiver(id: string) {
  const [river, setRiver] = useState<RiverData | null>(null)
  const [status, setStatus] = useState<RiverDetailStatus>('loading')

  useEffect(() => {
    setStatus('loading')

    fetch(`/api/rivers/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Not found')
        }
        return res.json() as Promise<RiverData>
      })
      .then((data) => {
        setRiver(data)
        setStatus('connected')
      })
      .catch(() => {
        setStatus('error')
      })
  }, [id])

  return { river, status }
}
```

**useAlertConfig pattern** (from RESEARCH.md lines 466-508) — adds 404 handling + mutation methods:
```typescript
import { useState, useEffect, useCallback } from 'react'
import type { AlertConfig } from '@/types'

export function useAlertConfig(riverId: string) {
  const [config, setConfig] = useState<AlertConfig | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchConfig = useCallback(() => {
    setLoading(true)
    fetch(`/api/alerts/config/${riverId}`)
      .then((res) => {
        if (!res.ok && res.status !== 404) throw new Error('Failed to fetch')
        return res.status === 404 ? null : res.json() as Promise<AlertConfig>
      })
      .then((data) => {
        setConfig(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [riverId])

  useEffect(() => { fetchConfig() }, [fetchConfig])

  const updateConfig = useCallback(async (updates: Partial<AlertConfig> & { type: 'level' | 'numeric' }) => {
    const res = await fetch(`/api/alerts/config/${riverId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Failed to update config')
    const updated = await res.json() as AlertConfig
    setConfig(updated)
    return updated
  }, [riverId])

  const removeConfig = useCallback(async () => {
    await fetch(`/api/alerts/config/${riverId}`, { method: 'DELETE' })
    setConfig(null)
  }, [riverId])

  return { config, loading, updateConfig, removeConfig }
}
```

**Key differences from useRiver:**
1. 404 is NOT an error — returns `null` for "no config"
2. Uses `loading` boolean instead of `status` enum (simpler — only two states: loading or done)
3. Adds `updateConfig` and `removeConfig` mutation methods (useRiver is read-only)
4. Uses `useCallback` on fetchConfig to prevent stale closure issues with `riverId`

---

### `ui/src/features/alerts/AlertsPage.tsx` (component, request-response) — NEW

**Analog:** `ui/src/features/dashboard/DashboardPage.tsx` (lines 1-99)

**Page component pattern** — loading / error / empty / data states (DashboardPage.tsx, lines 11-96):
```typescript
function DashboardPage() {
  const { rivers, status } = useRivers()
  const { isFavorite, toggleFavorite, count } = useFavorites()

  if (status === 'loading') {
    return (
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-8 tracking-tight">River Levels</h1>
        <div className="grid ...">{[...].map((_, i) => <SkeletonCard />)}</div>
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
      <h1 className="text-3xl font-display font-bold text-white tracking-tight">River Levels</h1>
      {displayRivers.map((river, i) => (<RiverCard key={river.id} river={river} index={i} />))}
    </div>
  )
}
```

**AlertsPage pattern** (from RESEARCH.md lines 596-667) — follows same state machine:
```typescript
function AlertsPage() {
  const { alerts, resolvedAlerts, allAlerts, dismissAlert, status } = useAlerts()

  if (status === 'loading') { /* skeleton cards — 3x h-20 bg-white/5 animate-pulse */ }
  if (status === 'error')   { /* ErrorState with "Live updates unavailable" */ }

  if (alerts.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">Alerts</h1>
        <p>...</p>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BellOff className="h-12 w-12 text-slate-600 mb-4" />
          <h2 className="text-lg font-display font-semibold text-white mb-1">All clear</h2>
          <p className="text-sm text-slate-400 max-w-sm">No rivers are currently exceeding...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1>Alerts</h1>
      <p>{alerts.length} active · {allAlerts.length - alerts.length} dismissed</p>
      <div className="space-y-3">
        {alerts.map((alert, i) => (<AlertCard key={alert.riverId} alert={alert} onDismiss={dismissAlert} index={i} />))}
      </div>
      {resolvedAlerts.length > 0 && <details>...</details>}
    </div>
  )
}
```

**Key patterns to copy from DashboardPage:**
1. **Loading state** (lines 19-42): Skeleton cards using `bg-white/5 animate-pulse` with layout matching data cards
2. **Empty state** (lines 76-81): Centered icon + heading + body text — use `BellOff` instead of `Heart`
3. **Error state** (lines 45-52): Page title + `<ErrorState type="error" />`
4. **Staggered card list** (lines 83-92): `.map((item, i) => <Component key={item.id} index={i} />)`
5. **Page heading pattern** (lines 22, 48, 57, 66): `h1.text-3xl.font-display.font-bold.text-white.tracking-tight`

---

### `ui/src/features/alerts/AlertCard.tsx` (component, CRUD) — NEW

**Analog:** `ui/src/features/dashboard/RiverCard.tsx` (lines 1-64)

**RiverCard pattern** — card with stagger animation, status indicator, detail link (lines 21-63):
```typescript
<div
  className="group rounded-lg border border-white/5 bg-surface p-5 hover:border-white/10 hover:bg-surface-elevated transition-all duration-300 opacity-0 animate-fade-in-up"
  style={{ animationDelay: `${index * 80}ms` }}
>
  <div className="flex items-start justify-between gap-3">
    <div className="flex items-center gap-3 min-w-0">
      <StatusDot level={river.alertLevel} status={river.status} />
      <p className="font-medium text-white truncate">{river.name}</p>
    </div>
    ...
  </div>

  {/* Action link */}
  <Link
    to={`/river/${river.id}`}
    className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-water hover:text-cyan-300 transition-colors mt-4 min-h-11 tracking-widest uppercase"
  >
    View Details
    <ChevronRight className="h-3 w-3" />
  </Link>
</div>
```

**AlertCard pattern** (from RESEARCH.md lines 516-588) — copies RiverCard's animation, layout, and link pattern:
```typescript
export function AlertCard({
  alert,
  onDismiss,
  index = 0,
}: {
  alert: ActiveAlert
  onDismiss: (riverId: string) => void
  index?: number
}) {
  const levelLabel = LEVEL_LABELS[alert.alertLevel - 1]

  return (
    <div
      className="group rounded-lg border border-danger-4/20 bg-surface p-5 hover:border-danger-4/40 transition-all duration-300 opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Bell className="h-5 w-5 text-danger-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-white truncate">{alert.snapshot.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{alert.currentValue} {alert.snapshot.unit} — exceeds {thresholdLabel}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="flex-shrink-0 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onDismiss(alert.riverId)}
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <StatusDot level={alert.alertLevel} status="ok" />
        <span className="text-xs font-medium text-slate-400">{levelLabel}</span>
        <span className="text-xs text-slate-600 ml-auto inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(alert.triggeredAt).toLocaleString()}
        </span>
      </div>

      <Link
        to={`/river/${alert.riverId}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-water hover:text-cyan-300 transition-colors mt-3 min-h-11 tracking-widest uppercase"
      >
        View River Details
        <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  )
}
```

**Key patterns to copy from RiverCard:**
1. **Staggered animation** (line 23-24): `opacity-0 animate-fade-in-up` + `style={{ animationDelay: \`\${index * 80}ms\` }}`
2. **Border/background** (line 23): `rounded-lg border border-white/5 bg-surface p-5`
3. **View Details link** (lines 55-61): `text-accent-water hover:text-cyan-300 min-h-11 tracking-widest uppercase`
4. **Hover transition** (line 23): `transition-all duration-300`
5. **LEVEL_LABELS constant** (line 8): `const LEVEL_LABELS = ['Low', 'Moderate', 'High', 'Very High', 'Extreme']`
6. **StatusDot usage** (line 28): `<StatusDot level={...} status={...} />`

**Key differences from RiverCard:**
1. AlertCard uses `border-danger-4/20` instead of `border-white/5` — visual indicator of alert state
2. AlertCard has a dismiss button with `group-hover:opacity-100` (visible on hover only)
3. AlertCard uses `Bell` icon instead of river name/level in the main header area
4. No `FavoriteButton` or `DangerLevelBar`

---

### `ui/src/App.tsx` (component, request-response) — MODIFY

**Analog:** `ui/src/App.tsx` (self, lines 1-8)

**Existing pattern** — simple `RouterProvider` wrapper:
```typescript
import { RouterProvider } from 'react-router'
import router from './routes'

function App() {
  return <RouterProvider router={router} />
}

export default App
```

**Modified pattern** (from RESEARCH.md lines 938-953) — wrap with `AlertProvider`:
```typescript
import { RouterProvider } from 'react-router'
import router from './routes'
import { AlertProvider } from './hooks/useAlerts'

function App() {
  return (
    <AlertProvider>
      <RouterProvider router={router} />
    </AlertProvider>
  )
}

export default App
```

---

### `ui/src/routes/index.tsx` (route, request-response) — MODIFY

**Analog:** `ui/src/routes/index.tsx` (self, lines 1-17)

**Existing route pattern**:
```typescript
import { createBrowserRouter } from 'react-router'
import AppShell from '@/components/layout/AppShell'
import DashboardPage from '@/features/dashboard/DashboardPage'
import RiverDetailPage from '@/features/river/RiverDetailPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'river/:id', element: <RiverDetailPage /> },
    ],
  },
])

export default router
```

**Modified route pattern** (from RESEARCH.md lines 957-978) — add `/alerts` child route:
```typescript
import AlertsPage from '@/features/alerts/AlertsPage'

// Inside children array:
{ path: 'alerts', element: <AlertsPage /> },
```

---

### `ui/src/components/layout/NavBar.tsx` (component, request-response) — MODIFY

**Analog:** `ui/src/components/layout/NavBar.tsx` (self, lines 1-81)

**Existing NAV_ITEMS pattern** (lines 10-14) — add Alerts nav item + count:
```typescript
const NAV_ITEMS = [
  { to: '/', label: 'River Levels' },
  { to: '#favorites', label: 'Favorites', disabled: true },
  { to: '#settings', label: 'Settings', disabled: true },
]
```

**Modified NAV_ITEMS** — add enabled Alerts item with dynamic label:
```typescript
// Inside component function:
const { count: alertCount } = useAlerts()

const NAV_ITEMS = [
  { to: '/', label: 'River Levels' },
  { to: '/alerts', label: `Alerts${alertCount > 0 ? ` (${alertCount})` : ''}` },
  { to: '#favorites', label: 'Favorites', disabled: true },
  { to: '#settings', label: 'Settings', disabled: true },
]
```

**New import to add** (after line 1):
```typescript
import { useAlerts } from '@/hooks/useAlerts'
```

**Key considerations:**
- `alertCount` is read from the `AlertContext` (NOT a new EventSource) — the AlertProvider at App root owns the single SSE connection
- The nav item label changes reactively when `alertCount` changes via context
- Existing `disabled` filter pattern (`NAV_ITEMS.filter(i => !i.disabled)`) in desktop nav automatically includes Alerts since it's no longer disabled
- Mobile sheet nav renders ALL items but grays out disabled ones — Alerts will render normally
- Desktop nav already uses `text-xs font-medium text-slate-400 hover:text-white transition-colors tracking-widest uppercase` for nav links

---

### `ui/src/features/river/RiverDetailPage.tsx` (component, request-response) — MODIFY

**Analog:** `ui/src/features/river/RiverDetailPage.tsx` (self, lines 1-134)

**Existing pattern** — page with loading/error/data states, uses `useRiver` + `useFavorites`:

**New imports to add** (after line 10):
```typescript
import { Bell, Settings2 } from 'lucide-react'
import { useAlertConfig } from '@/hooks/useAlertConfig'
```

**New hook call** (after line 15):
```typescript
const { config: alertConfig, loading: configLoading } = useAlertConfig(id!)
```

**New alert config section** — place after `DangerLevelSection` (after line 107) and before the stale warning:
```typescript
{configLoading ? (
  <div className="mt-6 rounded-lg border border-white/5 bg-surface p-4">
    <div className="h-4 w-32 bg-white/10 animate-pulse rounded" />
  </div>
) : alertConfig ? (
  <div className="mt-6 rounded-lg border border-white/5 bg-surface p-4">
    <div className="flex items-center gap-2 mb-2">
      <Bell className="h-4 w-4 text-accent-water" />
      <h2 className="text-sm font-display font-semibold text-white tracking-wide">Alert Configuration</h2>
    </div>
    <p className="text-xs text-slate-400">
      {alertConfig.type === 'level'
        ? `Alert when danger level reaches ${alertConfig.level}/5`
        : `Alert when flow exceeds ${alertConfig.customValue} m³/s`}
    </p>
    {alertConfig.enabled === false && (
      <p className="text-xs text-amber-400/80 mt-1">Alert is currently disabled.</p>
    )}
  </div>
) : null}
```

---

## Shared Patterns

### React Context Provider Pattern (first context in the app)
**Source:** RESEARCH.md (lines 337-456)
**Apply to:** `ui/src/hooks/useAlerts.tsx` + `ui/src/App.tsx`

```typescript
// Provider at app root:
// App.tsx
<AlertProvider>
  <RouterProvider router={router} />
</AlertProvider>

// Context hook with guard:
export function useAlerts(): AlertContextValue {
  const ctx = useContext(AlertContext)
  if (!ctx) throw new Error('useAlerts must be used within AlertProvider')
  return ctx
}
```

### SSE Subscription Pattern
**Source:** `ui/src/hooks/useRivers.ts` (lines 21-42)
**Apply to:** `ui/src/hooks/useAlerts.tsx`

```typescript
useEffect(() => {
  const es = new EventSource('/api/events')

  es.addEventListener('event-type', (event: MessageEvent) => {
    const data = JSON.parse(event.data) as ExpectedType
    setState(data)
    setStatus('connected')
  })

  es.addEventListener('error', () => {
    setStatus('error')
  })

  return () => es.close()
}, [])
```

### localStorage Persistence Pattern
**Source:** `ui/src/hooks/useFavorites.ts` (lines 1-21)
**Apply to:** `ui/src/hooks/useAlerts.tsx` (dismissed state)

```typescript
const STORAGE_KEY = 'splash-dismissed-alerts'

// Lazy init:
const [dismissedAt, setDismissedAt] = useState<Record<string, number>>(() => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch { return {} }
})

// Persist:
useEffect(() => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissedAt))
  } catch (err) {
    console.warn('Failed to persist:', err)
  }
}, [dismissedAt])
```

### Card Component with Staggered Animation
**Source:** `ui/src/features/dashboard/RiverCard.tsx` (lines 22-24)
**Apply to:** `ui/src/features/alerts/AlertCard.tsx`

```typescript
<div
  className="group rounded-lg border border-white/5 bg-surface p-5 hover:border-white/10 hover:bg-surface-elevated transition-all duration-300 opacity-0 animate-fade-in-up"
  style={{ animationDelay: `${index * 80}ms` }}
>
```

### Express SSE Event Forwarding
**Source:** `server.ts` (lines 104-141)
**Apply to:** `server.ts` (new alert event types)

```typescript
// Inside app.get('/api/events', ...):
const onEventHandler = (data: EventType) => {
  res.write(`event: event-type\ndata: ${JSON.stringify(data)}\n\n`)
}

engine.eventBus.on('event-type', onEventHandler)

// In req.on('close'):
engine.eventBus.removeListener('event-type', onEventHandler as any)
```

### Express REST Endpoint with 404
**Source:** `server.ts` (lines 41-47)
**Apply to:** `server.ts` (GET /api/alerts/config/:id)

```typescript
app.get('/api/resource/:id', (req, res) => {
  const data = store.get(req.params.id)
  if (!data) {
    res.status(404).json({ error: 'Not found' })
    return  // explicit return — Express v5 does not throw for missing return
  }
  res.json(data)
})
```

### Page State Machine (loading → error → empty → data)
**Source:** `ui/src/features/dashboard/DashboardPage.tsx` (lines 19-96)
**Apply to:** `ui/src/features/alerts/AlertsPage.tsx`

```
status === 'loading'  → skeleton cards
status === 'error'    → page title + ErrorState
data.length === 0     → page title + empty state
data.length > 0       → page title + subtitle + data list
```

### Event Emission Flow (evaluate → diff → emit)
**Source:** RESEARCH.md (lines 287-301)
**Apply to:** `src/index.ts`

```typescript
engine.eventBus.on('data-update', (rivers) => {
  const { triggered, resolved } = alertEngine.evaluate(rivers)

  for (const alert of triggered) {
    engine.eventBus.emit('alert-trigger', alert)
  }
  for (const riverId of resolved) {
    engine.eventBus.emit('alert-resolve', { riverId })
  }

  console.log(`Flow data updated: ${rivers.length} rivers`)
})
```

---

## No Analog Found

All 13 files have exact or role-match analogs in the codebase. No file requires RESEARCH.md as the sole reference.

| File | Role | Data Flow | Analog | Quality |
|------|------|-----------|--------|---------|
| `src/core/events.ts` | model | event-driven | `src/core/events.ts` (self) | exact |
| `src/core/alert-engine.ts` | service | event-driven | `src/core/alert-engine.ts` (self) | exact |
| `src/index.ts` | config | request-response | `src/index.ts` (self) | exact |
| `server.ts` | controller | request-response | `server.ts` (self) | exact |
| `ui/src/types/index.ts` | model | CRUD | `ui/src/types/index.ts` (self) | exact |
| `ui/src/hooks/useAlerts.tsx` | hook | event-driven + CRUD | `useRivers.ts` + `useFavorites.ts` | composite |
| `ui/src/hooks/useAlertConfig.ts` | hook | CRUD | `ui/src/hooks/useRiver.ts` | role-match |
| `ui/src/features/alerts/AlertsPage.tsx` | component | request-response | `DashboardPage.tsx` | role-match |
| `ui/src/features/alerts/AlertCard.tsx` | component | CRUD | `RiverCard.tsx` | role-match |
| `ui/src/App.tsx` | component | request-response | `ui/src/App.tsx` (self) | exact |
| `ui/src/routes/index.tsx` | route | request-response | `ui/src/routes/index.tsx` (self) | exact |
| `ui/src/components/layout/NavBar.tsx` | component | request-response | `ui/src/components/layout/NavBar.tsx` (self) | exact |
| `ui/src/features/river/RiverDetailPage.tsx` | component | request-response | `ui/src/features/river/RiverDetailPage.tsx` (self) | exact |

---

## Metadata

**Analog search scope:** `src/core/`, `ui/src/hooks/`, `ui/src/features/dashboard/`, `ui/src/features/river/`, `ui/src/components/layout/`, `ui/src/routes/`, `ui/src/App.tsx`, `server.ts`, `src/index.ts`
**Files scanned:** 20 source files
**Pattern extraction date:** 2026-05-28
