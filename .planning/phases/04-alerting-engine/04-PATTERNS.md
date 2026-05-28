# Phase 4: Alerting Engine — Pattern Map

**Mapped:** 2026-05-28
**Files analyzed:** 5 (2 new, 3 modified)
**Analogs found:** 5 / 5

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/core/types.ts` | model | CRUD | `src/core/types.ts` (self) | exact — add types to existing |
| `src/core/alert-engine.ts` | service | event-driven + CRUD | `src/core/store.ts` | role-match — in-memory Map store |
| `src/index.ts` | config | request-response | `src/index.ts` (self) | exact — add wiring to existing |
| `server.ts` | controller | request-response | `server.ts` (self) | exact — add endpoints to existing |
| `tests/core/alert-engine.test.ts` | test | — | `tests/core/store.test.ts` | role-match — tests for Map-based store |

---

## Pattern Assignments

### `src/core/types.ts` (model, CRUD) — MODIFY

**Analog:** `src/core/types.ts` (self, lines 1-37)

**Existing type pattern** (lines 1-16) — add new interfaces following this style:
```typescript
export type AlertLevel = 1 | 2 | 3 | 4 | 5

export type RiverStatus = 'ok' | 'stale' | 'error'

export interface RiverData {
  id: string
  name: string
  source: string
  stationId: string
  currentLevel: number | null
  unit: string
  alertLevel: AlertLevel
  lastUpdated: Date
  status: RiverStatus
  error?: string
}
```

**Pattern rules:**
- Use `export interface` for object types, `export type` for unions/primitives
- `Date` typed as `Date` (not string) — serialized by `res.json()` automatically
- Optional fields use `?` suffix (e.g., `error?: string`)
- River ID is typed as `string` (compound key `"source:stationId"` format)
- Primitive field comments use standard JSDoc style, not inline

**New types to add** (from RESEARCH.md lines 168-195):
```typescript
export interface AlertConfig {
  riverId: string
  type: 'level' | 'numeric'
  /** Required when type === 'level' — the danger level to alert at (1-5) */
  level?: AlertLevel
  /** Required when type === 'numeric' — flow threshold in m³/s */
  customValue?: number
  /** Whether this config is actively evaluated */
  enabled: boolean
}

export interface ActiveAlert {
  riverId: string
  config: AlertConfig
  /** The resolved threshold value that was crossed */
  threshold: number
  /** The current river flow at time of evaluation */
  currentValue: number
  /** The river's danger level at time of evaluation */
  alertLevel: AlertLevel
  /** When the alert first triggered */
  triggeredAt: Date
  /** Snapshot of the RiverData that triggered this alert */
  snapshot: RiverData
}
```

---

### `src/core/alert-engine.ts` (service, event-driven + CRUD) — NEW

**Analog:** `src/core/store.ts` (lines 1-34) — FlowStore in-memory Map pattern

**Imports pattern** (src/core/store.ts, lines 1-1):
```typescript
import type { RiverData } from './types.js'
```
→ AlertEngine imports:
```typescript
import type { AlertConfig, ActiveAlert, AlertLevel, RiverData } from './types.js'
```

**Core Map-based store pattern** (src/core/store.ts, lines 3-34) — copy this structure for configs + activeAlerts:
```typescript
export class FlowStore {
  private data = new Map<string, RiverData>()

  update(rivers: RiverData[]): void {
    for (const river of rivers) {
      this.data.set(river.id, river)
    }
  }

  getById(id: string): RiverData | undefined {
    return this.data.get(id)
  }

  getAll(): RiverData[] {
    return Array.from(this.data.values())
  }

  clear(): void {
    this.data.clear()
  }
}
```

**Key structural analogy:**
- `FlowStore.data = Map<string, RiverData>` → `AlertEngine.configs = Map<string, AlertConfig>` (riverId → config)
- `FlowStore` has `update/getById/getAll/clear` → `AlertEngine` has `setConfig/getConfig/getAllConfigs/removeConfig`
- `FlowStore` is a pure data holder with no side effects → `AlertEngine` adds `evaluate()` which has side effects (the event-driven behavior)

**Event subscription pattern** (src/core/events.ts, lines 14-16):
```typescript
on<K extends keyof ScraperEventMap>(event: K, listener: ScraperEventMap[K]): this {
  this.emitter.on(event, listener as (...args: unknown[]) => void)
  return this
}
```
→ AlertEngine doesn't implement the event bus itself, but wires into it externally (see src/index.ts pattern below).

**RESEARCH.md full AlertEngine class** (lines 415-517) — the complete implementation to build:
```typescript
export class AlertEngine {
  private configs = new Map<string, AlertConfig>()
  private activeAlerts = new Map<string, ActiveAlert>()

  // ── Config CRUD ──
  setConfig(config: AlertConfig): AlertConfig {
    this.configs.set(config.riverId, config)
    if (!config.enabled || this.isConfigInactive(config)) {
      this.activeAlerts.delete(config.riverId)
    }
    return config
  }

  getConfig(riverId: string): AlertConfig | undefined {
    return this.configs.get(riverId)
  }

  getAllConfigs(): AlertConfig[] {
    return Array.from(this.configs.values())
  }

  removeConfig(riverId: string): boolean {
    const existed = this.configs.delete(riverId)
    this.activeAlerts.delete(riverId)  // clean up any triggered alert
    return existed
  }

  // ── Active Alert Queries ──
  getActiveAlerts(): ActiveAlert[] {
    return Array.from(this.activeAlerts.values())
  }

  getActiveAlert(riverId: string): ActiveAlert | undefined {
    return this.activeAlerts.get(riverId)
  }

  // ── Evaluation ──
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

  private isThresholdExceeded(config: AlertConfig, river: RiverData): boolean {
    if (config.type === 'level') {
      return config.level !== undefined && river.alertLevel >= config.level
    }
    return config.customValue !== undefined && river.currentLevel > config.customValue
  }

  private resolveThreshold(config: AlertConfig): number {
    return config.type === 'numeric' ? config.customValue! : config.level!
  }

  private isConfigInactive(config: AlertConfig): boolean {
    return config.type === 'level'
      ? config.level === undefined
      : config.customValue === undefined
  }
}
```

**Error handling pattern:** No explicit error handling needed inside AlertEngine — the `evaluate()` method operates synchronously on already-fetched data. If a river has `null` currentLevel, it's skipped (guard clause). The class doesn't throw; it silently handles missing configs and null data.

---

### `src/index.ts` (config, request-response) — MODIFY

**Analog:** `src/index.ts` (self, lines 1-38)

**Existing import + instantiation pattern** (lines 1-12):
```typescript
import 'dotenv/config'
import nodeCron from 'node-cron'
import { ScraperEngine } from './core/engine.js'
import { NveHydApiAdapter } from './adapters/nve.js'
import { RiverRegistry } from './core/river-registry.js'
import { defaultConfig } from './config.js'

const config = defaultConfig()
const registry = new RiverRegistry()
const engine = new ScraperEngine(config, registry)

engine.register(new NveHydApiAdapter())
```

**Existing event subscription pattern** (lines 14-20):
```typescript
engine.eventBus.on('data-update', (rivers) => {
  console.log(`Flow data updated: ${rivers.length} rivers`)
})

engine.eventBus.on('status-change', (status) => {
  console.log(`Engine status: ${status.status}${status.error ? ` (${status.error})` : ''}`)
})
```

**Existing export pattern** (line 38):
```typescript
export { engine }
```

**Additions to make** (from RESEARCH.md lines 586-601):
```typescript
// New import to add alongside existing imports (after line 5):
import { AlertEngine } from './core/alert-engine.js'

// New instantiation after engine.register (after line 12):
const alertEngine = new AlertEngine()

// New event subscription alongside existing ones (after the data-update log, before status-change):
engine.eventBus.on('data-update', (rivers) => {
  alertEngine.evaluate(rivers)
  console.log(`Flow data updated: ${rivers.length} rivers`)
})

// Update export to also export alertEngine (modify line 38):
export { engine, alertEngine }
```

**Important:** The existing `data-update` handler on line 14 logs the update. The new handler on line 367 needs to do BOTH evaluate AND log. Since `engine.eventBus.on()` adds a listener (doesn't replace), we need to merge them — the evaluate call should be added to the existing handler or placed as a separate `on()` call. Research recommends wrapping both in the same handler for clarity.

---

### `server.ts` (controller, request-response) — MODIFY

**Analog:** `server.ts` (self, lines 1-100)

**Existing import pattern** (lines 1-5):
```typescript
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { engine } from './src/index.js'
import type { RiverData } from './src/core/types.js'
```

**Existing REST endpoint pattern** (lines 34-47) — copy for new alert endpoints:
```typescript
// REST: return all rivers
app.get('/api/rivers', (_req, res) => {
  const rivers = engine.dataStore.getAll().map(enrichWithRegistry)
  res.json(rivers)
})

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

**Key Express v5 patterns to follow:**
- Use `app.get('/{*splat}', ...)` for SPA catch-all (line 94) — Express v5 splat syntax
- `app.use(express.static('ui/dist'))` for static files (line 91)
- Everything after `app.use(cors())` on line 12

**Additions to make** (from RESEARCH.md lines 522-581):
```typescript
// 1. Update import to also import alertEngine (modify line 4):
import { engine, alertEngine } from './src/index.js'

// 2. Add express.json() middleware after app.use(cors()) (after line 12):
app.use(express.json())

// 3. Add alert REST endpoints after the river endpoints (after line 47):

// GET /api/alerts/config — list all alert configurations
app.get('/api/alerts/config', (_req, res) => {
  res.json(alertEngine.getAllConfigs())
})

// PUT /api/alerts/config/:id — upsert alert config for a river
app.put('/api/alerts/config/:id', (req, res) => {
  const { type, level, customValue, enabled } = req.body

  if (!type || (type !== 'level' && type !== 'numeric')) {
    res.status(400).json({ error: 'type must be "level" or "numeric"' })
    return
  }

  if (type === 'level') {
    if (typeof level !== 'number' || level < 1 || level > 5 || !Number.isInteger(level)) {
      res.status(400).json({ error: 'level must be an integer between 1 and 5' })
      return
    }
  } else {
    if (typeof customValue !== 'number' || customValue <= 0) {
      res.status(400).json({ error: 'customValue must be a positive number' })
      return
    }
  }

  const config = alertEngine.setConfig({
    riverId: req.params.id,
    type,
    level: type === 'level' ? level as AlertLevel : undefined,
    customValue: type === 'numeric' ? customValue : undefined,
    enabled: enabled !== false,
  })
  res.json(config)
})

// DELETE /api/alerts/config/:id — remove alert config for a river
app.delete('/api/alerts/config/:id', (req, res) => {
  const removed = alertEngine.removeConfig(req.params.id)
  if (!removed) {
    res.status(404).json({ error: 'No config found for this river' })
    return
  }
  res.json({ removed: true })
})

// GET /api/alerts/active — list currently triggered alerts
app.get('/api/alerts/active', (_req, res) => {
  res.json(alertEngine.getActiveAlerts())
})
```

**Body validation pattern** — inline validation in route handler (no zod/yup):
```typescript
if (!type || (type !== 'level' && type !== 'numeric')) {
  res.status(400).json({ error: 'type must be "level" or "numeric"' })
  return  // explicit return after sending error response
}
```

**404 response pattern** (from server.ts lines 42-45):
```typescript
if (!river) {
  res.status(404).json({ error: 'River not found' })
  return
}
```

**Placement constraint:** `app.use(express.json())` must go after `app.use(cors())` (line 12) and before all route definitions that parse JSON bodies. Alert endpoints should go after `/api/rivers` routes (line 47) but before the SSE `/api/events` route (line 50) — or after SSE, since they don't depend on SSE. Placement after SSE is fine too. The critical ordering is: cors → express.json() → static routes → REST endpoints → SSE → SPA catch-all.

---

### `tests/core/alert-engine.test.ts` (test) — NEW

**Analog:** `tests/core/store.test.ts` (lines 1-57) — tests for FlowStore (in-memory Map)

**Test import pattern** (store.test.ts, lines 1-3):
```typescript
import { describe, it, expect } from 'vitest'
import { FlowStore } from '../../src/core/store.js'
import type { RiverData } from '../../src/core/types.js'
```

**Test helper pattern** (store.test.ts, lines 5-17):
```typescript
function makeRiver(id: string, lastUpdated: Date): RiverData {
  return {
    id,
    name: id,
    source: 'nve',
    stationId: id,
    currentLevel: 10,
    unit: 'm³/s',
    alertLevel: 2,
    lastUpdated,
    status: 'ok',
  }
}
```
→ AlertEngine test helper:
```typescript
function makeRiver(id: string, currentLevel: number, alertLevel: AlertLevel): RiverData {
  return {
    id,
    name: id,
    source: 'nve',
    stationId: id.replace('nve:', ''),
    currentLevel,
    unit: 'm³/s',
    alertLevel,
    lastUpdated: new Date(),
    status: 'ok',
  }
}
```

**Test structure pattern** (store.test.ts, lines 19-56) — `describe('ClassName')` → `it('method name — behavior', ...)`:
```typescript
describe('FlowStore', () => {
  it('stores rivers via update', () => {
    const store = new FlowStore()
    const river = makeRiver('nve:1000', new Date())
    store.update([river])
    expect(store.getById('nve:1000')).toEqual(river)
  })

  it('getById returns undefined for unknown id', () => {
    const store = new FlowStore()
    expect(store.getById('nve:9999')).toBeUndefined()
  })
  // ...
})
```

**Complete test structure** (from RESEARCH.md lines 606-737 — alert-engine.test.ts):
```typescript
import { describe, it, expect } from 'vitest'
import { AlertEngine } from '../../src/core/alert-engine.js'
import type { AlertConfig, RiverData, AlertLevel } from '../../src/core/types.js'

function makeRiver(id: string, currentLevel: number, alertLevel: AlertLevel): RiverData {
  return {
    id,
    name: id,
    source: 'nve',
    stationId: id.replace('nve:', ''),
    currentLevel,
    unit: 'm³/s',
    alertLevel,
    lastUpdated: new Date(),
    status: 'ok',
  }
}

describe('AlertEngine', () => {
  describe('config CRUD', () => {
    it('stores and retrieves a config by river ID', () => { /* ... */ })
    it('returns undefined for non-existent config', () => { /* ... */ })
    it('removes a config and cleans up active alerts', () => { /* ... */ })
  })

  describe('evaluation — level-based', () => {
    it('triggers when alertLevel >= configured level', () => { /* ... */ })
    it('does not trigger at lower levels', () => { /* ... */ })
    it('triggers at higher levels than configured', () => { /* ... */ })
  })

  describe('evaluation — numeric-based', () => {
    it('triggers when currentLevel exceeds numeric threshold', () => { /* ... */ })
    it('does not trigger when currentLevel equals threshold', () => { /* ... */ })
  })

  describe('evaluation — resolution', () => {
    it('resolves alert when level drops below threshold', () => { /* ... */ })
    it('does not resolve if alert never triggered', () => { /* ... */ })
  })

  describe('edge cases', () => {
    it('skips rivers with null currentLevel', () => { /* ... */ })
    it('skips rivers with no config', () => { /* ... */ })
    it('skips disabled configs', () => { /* ... */ })
  })
})
```

**Key test patterns observed in codebase:**
- `vitest` with `describe`/`it`/`expect` — no `test()` calls, always `it()`
- `vi.fn()` for mocks — used in `events.test.ts` and `engine.test.ts`
- No test setup hooks (`beforeEach`/`beforeAll`) — each test creates fresh instances inline
- `toBeUndefined()` for undefined checks, `toHaveLength(n)` for array length
- `toEqual()` for deep object equality
- Helper functions at module scope for test data creation

---

## Shared Patterns

### In-Memory Map Store Pattern
**Source:** `src/core/store.ts` (lines 1-34)
**Apply to:** `src/core/alert-engine.ts` (both `configs` and `activeAlerts` Maps)

```typescript
// Core pattern: private Map + typed accessors
private data = new Map<string, RiverData>()

update(items: T[]): void {
  for (const item of items) {
    this.data.set(item.id, item)
  }
}

getById(id: string): T | undefined {
  return this.data.get(id)
}

getAll(): T[] {
  return Array.from(this.data.values())
}
```

### Event Subscription Pattern
**Source:** `src/core/events.ts` (lines 1-27), `src/index.ts` (lines 14-20)
**Apply to:** `src/index.ts` (wiring AlertEngine.evaluate to data-update)

```typescript
// ScraperEventBus pattern — typed event map + emit/on/removeListener
export interface ScraperEventMap {
  'data-update': (rivers: RiverData[]) => void
  'error': (error: Error) => void
  'stale': (since: Date) => void
  'status-change': (status: ScraperStatus) => void
}

// Subscription:
engine.eventBus.on('data-update', (rivers) => {
  alertEngine.evaluate(rivers)
})
```

### Express REST Endpoint Pattern
**Source:** `server.ts` (lines 34-47)
**Apply to:** `server.ts` (new alert endpoints)

```typescript
// GET list pattern:
app.get('/api/rivers', (_req, res) => {
  const rivers = engine.dataStore.getAll()
  res.json(rivers)
})

// GET single with 404 pattern:
app.get('/api/rivers/:id', (req, res) => {
  const river = engine.dataStore.getById(req.params.id)
  if (!river) {
    res.status(404).json({ error: 'River not found' })
    return
  }
  res.json(river)
})
```

### Body Validation Pattern (inline, no zod)
**Source:** RESEARCH.md (lines 535-565)
**Apply to:** `server.ts` (PUT /api/alerts/config/:id endpoint)

```typescript
// Inline type + range validation in route handler
const { type, level, customValue, enabled } = req.body

if (!type || (type !== 'level' && type !== 'numeric')) {
  res.status(400).json({ error: 'type must be "level" or "numeric"' })
  return
}

if (type === 'level') {
  if (typeof level !== 'number' || level < 1 || level > 5 || !Number.isInteger(level)) {
    res.status(400).json({ error: 'level must be an integer between 1 and 5' })
    return
  }
} else {
  if (typeof customValue !== 'number' || customValue <= 0) {
    res.status(400).json({ error: 'customValue must be a positive number' })
    return
  }
}
```

### String Export Pattern (dual export)
**Source:** `src/index.ts` (line 38)
**Apply to:** `src/index.ts` (export both engine and alertEngine)

```typescript
export { engine, alertEngine }
```

---

## No Analog Found

All files have exact or role-match analogs in the codebase. No file requires RESEARCH.md as the sole reference.

| File | Role | Data Flow | Analog | Quality |
|------|------|-----------|--------|---------|
| `src/core/types.ts` | model | CRUD | `src/core/types.ts` (self) | exact |
| `src/core/alert-engine.ts` | service | event-driven + CRUD | `src/core/store.ts` | role-match |
| `src/index.ts` | config | request-response | `src/index.ts` (self) | exact |
| `server.ts` | controller | request-response | `server.ts` (self) | exact |
| `tests/core/alert-engine.test.ts` | test | — | `tests/core/store.test.ts` | role-match |

---

## Metadata

**Analog search scope:** `src/core/`, `tests/core/`, `server.ts`, `src/index.ts`
**Files scanned:** 10 source files + 3 test files
**Pattern extraction date:** 2026-05-28
