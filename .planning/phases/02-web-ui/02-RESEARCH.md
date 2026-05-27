# Phase 2: Web UI — Research

**Researched:** 2026-05-27
**Domain:** React SPA, Vite, Tailwind CSS, Server-Sent Events, Capacitor shell architecture
**Confidence:** HIGH

## Summary

Phase 2 extends the existing Phase 1 Node.js scraper process with an Express HTTP server that serves a React + Vite SPA and exposes the FlowStore (in-memory river data) via REST endpoints and Server-Sent Events (SSE). The SPA is a separate `ui/` Vite project at the repo root — it shares TypeScript types with the engine but has its own build pipeline. In development, Vite's dev server proxies API calls to the Express backend on port 3000. In production, Express serves the built `ui/dist/` as static files.

The real-time data path is: ScraperEngine → FlowStore (in-memory) → Express `/api/events` SSE endpoint → browser `EventSource`. SSE is the right transport: updates are server-to-client only, infrequent (cron-driven), and the browser's automatic reconnection avoids custom reconnect logic. No WebSocket complexity needed.

The UI uses react-router v7 in library mode (client-side routing only — no SSR). Feature-based component organization inside `ui/src/`. App shell architecture with PWA manifest (`vite-plugin-pwa`) for future Capacitor wrapping. Mobile responsiveness via Tailwind's mobile-first breakpoints with 44px touch targets (`min-h-11 min-w-11`).

**Primary recommendation:** Monolithic deployment — single Node.js process runs both the scraper engine and the Express API/static server. Separate `ui/` Vite project for the frontend with its own dev tooling. SSE for real-time updates. No SSR — pure SPA.

## User Constraints

**No CONTEXT.md exists** — user chose to continue without discuss-phase. No locked decisions beyond the approved UI design contract (02-UI-SPEC.md) which constrains the stack: React + Vite + Tailwind CSS + shadcn/ui with radix primitives, lucide-react icons, Inter font, and specific color mappings.

Key design contract constraints:
- Framework: React + Vite + Tailwind CSS + shadcn/ui [CITED: 02-UI-SPEC.md]
- Component library: radix (via shadcn/ui)
- Icon library: lucide-react
- Font: Inter
- Colors: neutral-100/900, blue-600, danger scale (green-500, yellow-500, orange-500, red-500, purple-600)
- Status indicators: ok=green-500, stale=amber-500, error=red-500
- Copy: "View Details" CTA, "No rivers yet" empty state
- shadcn preset: `b2p8z4HAe` (deferred to Vite scaffold step)
- Touch targets: 44px minimum on mobile

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-01 | Dashboard shows all rivers with current level and color/icon status indicator | REST `/api/rivers` SSE `data-update` event → RiverCard component with StatusIndicator (danger scale colors) |
| UI-02 | River detail page shows current level, five-level position, and full name | REST `/api/rivers/:id` → RiverDetail page with DangerLevelBar component showing position on 1-5 scale |
| UI-03 | UI responsive and usable on mobile (no horizontal scroll, 44px touch targets) | Tailwind mobile-first breakpoints, `min-h-11 min-w-11` for touch targets, responsive layout with stacking cards |
| UI-04 | Architecture wrappable via WebView/Capacitor | App shell pattern, PWA manifest via `vite-plugin-pwa`, static build output at `ui/dist/` for Capacitor `webDir`, safe-area CSS env vars |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| River data storage (live) | Backend (Node.js) | — | FlowStore is in-memory on the Phase 1 engine; Express reads it directly |
| Real-time data push | Backend (Node.js) | — | ScraperEventBus emits events → Express SSE endpoint → browser EventSource |
| UI rendering | Browser (Client) | — | React SPA renders entirely on the client; no SSR needed for single-user app |
| Client-side routing | Browser (Client) | — | react-router v7 library mode handles URL → view mapping client-side |
| Static asset serving | Backend (Node.js) | CDN (future) | Express serves built SPA files from `ui/dist/` |
| PWA registration | Browser (Client) | — | Service worker registration in browser; Capacitor wraps built output |
| Touch target handling | Browser (Client) | — | CSS/HTML on the client; no server involvement |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.6 | UI component framework | Industry standard; shadcn/ui requires it |
| react-router | 7.15.1 | Client-side routing | Only fully type-safe React router; library mode for SPAs |
| TypeScript | ^6.0.3 | Type safety | Already in project; extends across UI code |
| Vite | 8.0.14 | Build tool | Required by shadcn/ui; fast HMR for dev |
| @vitejs/plugin-react | 6.0.2 | React Fast Refresh / JSX transform | Official Vite React plugin |
| Tailwind CSS | 4.3.0 | Utility-first CSS | Specified in design contract; v4 uses `@import "tailwindcss"` and `@tailwindcss/vite` plugin |
| @tailwindcss/vite | 4.3.0 | Tailwind v4 Vite integration | Required for Tailwind v4 + Vite |
| Express | 5.2.1 | HTTP server for API + static serving | Minimal, well-understood; no framework overhead for API layer |
| shadcn/ui (CLI) | 4.1.2 | Component scaffolding | Design-contract mandated; run `npx shadcn@latest init --preset b2p8z4HAe` at scaffold |

[VERIFIED: npm registry — all versions confirmed 2026-05-27]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 1.16.0 | Icon library | Throughout — status indicators, nav icons, CTAs |
| class-variance-authority | 0.7.1 | shadcn variant definitions (cva) | Required by shadcn components for `variant` props |
| clsx | 2.1.1 | Conditional className joining | Required by shadcn's `cn()` utility |
| tailwind-merge | 3.6.0 | Tailwind class deduplication | Required by shadcn's `cn()` utility |
| @radix-ui/react-slot | 1.2.4 | Polymorphic `asChild` pattern | Required by shadcn components |
| tailwindcss-animate | 1.0.7 | Animation utilities (animate-in, fade-in) | shadcn dialogs, sheets, navigation menus |
| @radix-ui/react-navigation-menu | 1.2.14 | Accessible nav menu | shadcn navigation-menu component |
| @radix-ui/react-sheet | — | Slide-in panel | shadcn sheet component (for mobile nav drawer) |
| vite-plugin-pwa | — | PWA manifest + service worker | Required for UI-04 Capacitor readiness |
| @types/node | — | Node.js type definitions | Vite config resolution |
| cors | — | CORS headers for dev proxy | Dev mode only (production is same-origin) |

[VERIFIED: npm registry — versions confirmed for all checked packages]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SSE for real-time | WebSocket (ws/Socket.IO) | WebSocket adds bidirectional complexity, sticky-session requirements, separate auth path — unjustified for server-to-client-only updates every 15+ minutes |
| SSE for real-time | Browser polling (setInterval/fetch) | Simpler but wasteful — 100+ requests when SSE uses 1 connection. SSE wins for infrequent updates |
| Express API layer | Fastify | Fastify is faster but Express has larger ecosystem, simpler SSE handling. Express wins for this MVP |
| Separate ui/ Vite project | Monorepo workspace | Separate project avoids coupling build tooling, keeps Phase 1 untouched, cleaner CI |
| react-router v7 library mode | react-router v7 framework mode (SSR) | SSR needs Node.js server rendering, complicates Capacitor wrapping (hash routing), increases deploy complexity. Pure SPA is simpler and adequate for a read-only dashboard |
| Feature-based components | Pages-based or atomic design | Feature-based is the 2026 consensus for mid-size apps; atomic over-abstracts for MVP scale |

[ASSUMED: based on ecosystem research, cross-verified with official docs and community patterns]

## Package Legitimacy Audit

> slopcheck unavailable at research time — all packages below are tagged `[ASSUMED]`. The planner must gate each install behind a `checkpoint:human-verify` task.

| Package | Registry | slopcheck | Disposition |
|---------|----------|-----------|-------------|
| react | npm | N/A (unavailable) | [ASSUMED] |
| react-dom | npm | N/A | [ASSUMED] |
| react-router | npm | N/A | [ASSUMED] |
| vite | npm | N/A | [ASSUMED] |
| @vitejs/plugin-react | npm | N/A | [ASSUMED] |
| tailwindcss | npm | N/A | [ASSUMED] |
| @tailwindcss/vite | npm | N/A | [ASSUMED] |
| express | npm | N/A | [ASSUMED] |
| lucide-react | npm | N/A | [ASSUMED] |
| class-variance-authority | npm | N/A | [ASSUMED] |
| clsx | npm | N/A | [ASSUMED] |
| tailwind-merge | npm | N/A | [ASSUMED] |
| tailwindcss-animate | npm | N/A | [ASSUMED] |
| @radix-ui/react-slot | npm | N/A | [ASSUMED] |
| @radix-ui/react-navigation-menu | npm | N/A | [ASSUMED] |
| vite-plugin-pwa | npm | N/A | [ASSUMED] |
| @types/node | npm | N/A | [ASSUMED] |
| cors | npm | N/A | [ASSUMED] |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```mermaid
graph TD
    subgraph "Node.js Process"
        SE[ScraperEngine] -->|update()| FS[(FlowStore)]
        SE -->|emit| EB[ScraperEventBus]
        EB -->|on 'data-update'| SSE[SSE Broadcast]
        API[Express API Layer] -->|read| FS
        API -->|GET /api/rivers| REST[REST Endpoints]
        API -->|GET /api/events| SSE
        API -->|serve static| STATIC[ui/dist/ SPA Files]
    end

    subgraph "Browser"
        SPA[React SPA] -->|useEventSource| SSE_Client[EventSource /api/events]
        SPA -->|useSWR / fetch| REST_Client["fetch('/api/rivers')"]
        SPA -->|RouterProvider| RR[react-router]
        RR -->|/| DASH[Dashboard Page]
        RR -->|/river/:id| DETAIL[River Detail Page]
    end

    STATIC -->|load| SPA
    FS -->|initial load| API
    EB -->|on 'data-update'| API

    style SE fill:#e1f5fe
    style FS fill:#fff3e0
    style EB fill:#f3e5f5
    style API fill:#e8f5e9
    style SPA fill:#e3f2fd
```

### Data Flow

1. **Initial page load:** Browser requests SPA → Express serves `index.html` from `ui/dist/` → React boots → `Dashboard` component fires `GET /api/rivers` → returns all RiverData[] from FlowStore → renders cards.

2. **Real-time updates:** ScraperEngine runs on cron → `store.update(data)` + `events.emit('data-update', data)` → Express SSE handler catches event, writes to all connected EventSource clients → React component state updates → re-render.

3. **Navigation:** User clicks river card → `react-router` navigates to `/river/:id` → `RiverDetail` component fires `GET /api/rivers/:id` → renders detail view.

4. **Error handling:** Scraper emits 'error' or 'stale' event → SSE sends `event: error` or `event: stale` → UI shows error/stale state with spec copy.

### Recommended Project Structure

```
splash/
├── src/                          # Phase 1 — scraper engine (unchanged)
│   ├── core/
│   │   ├── engine.ts
│   │   ├── store.ts
│   │   ├── events.ts
│   │   ├── types.ts              # ← SHARED: copied to ui/src/types/
│   │   └── ...
│   ├── adapters/
│   └── index.ts
├── server.ts                     # NEW: Express server entry point
│                                 #   imports engine from src/index.ts
│                                 #   adds /api/* routes + static serving
├── ui/                           # NEW: Vite React SPA project
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── index.html
│   ├── public/
│   │   ├── manifest.json
│   │   └── icons/
│   └── src/
│       ├── main.tsx              # ReactDOM.createRoot + providers
│       ├── App.tsx               # RouterProvider with route config
│       ├── index.css             # @import "tailwindcss" + CSS vars
│       ├── lib/
│       │   └── utils.ts          # cn() utility for shadcn
│       ├── hooks/
│       │   ├── useRivers.ts      # Fetch rivers + SSE subscription
│       │   └── useRiver.ts       # Fetch single river by ID
│       ├── types/
│       │   └── index.ts          # RiverData, AlertLevel, etc. (from core/types.ts)
│       ├── components/
│       │   ├── ui/               # shadcn-generated components
│       │   │   ├── button.tsx
│       │   │   ├── card.tsx
│       │   │   ├── badge.tsx
│       │   │   ├── skeleton.tsx
│       │   │   ├── separator.tsx
│       │   │   ├── navigation-menu.tsx
│       │   │   └── sheet.tsx
│       │   ├── layout/
│       │   │   ├── AppShell.tsx   # Header, nav, main content area
│       │   │   └── NavBar.tsx     # Top/bottom navigation
│       │   └── shared/
│       │       ├── StatusIndicator.tsx  # Color-coded dot/badge
│       │       ├── DangerLevelBar.tsx   # 5-level scale visual
│       │       └── ErrorState.tsx       # Error/stale display
│       ├── features/
│       │   ├── dashboard/
│       │   │   ├── DashboardPage.tsx    # Full dashboard view
│       │   │   ├── RiverCard.tsx        # Single river summary card
│       │   │   └── EmptyState.tsx       # "No rivers yet" view
│       │   └── river/
│       │       ├── RiverDetailPage.tsx  # Full river detail view
│       │       └── DangerLevelSection.tsx # Current level + scale position
│       └── routes/
│           └── index.tsx         # createBrowserRouter definition
├── package.json                  # Root — may add express, cors, tsx dev dep
├── data/
│   └── rivers.json               # River registry (metadata)
├── tsconfig.json
└── vitest.config.ts
```

### Pattern 1: SSE Bridge — Event Bus to Browser Stream

**What:** Subscribe to Node.js EventEmitter events and bridge them to connected SSE clients using Express response streaming.

**When to use:** Any time the server needs to push real-time data to the browser without bidirectional communication.

**Example (src/server.ts):**

```typescript
// Source: Synthesized from Express SSE patterns [CITED: dev.to/1xapi and application-architect.com]
import express from 'express'
import { engine } from './src/index.js'

const app = express()
const PORT = process.env.PORT || 3000

// Track connected SSE clients
const clients = new Set<express.Response>()

// REST: return current river data
app.get('/api/rivers', (_req, res) => {
  res.json(engine.dataStore.getAll())
})

app.get('/api/rivers/:id', (req, res) => {
  const river = engine.dataStore.getById(req.params.id)
  if (!river) return res.status(404).json({ error: 'Not found' })
  res.json(river)
})

// SSE: push real-time events
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',  // Disable nginx buffering if proxied
  })

  clients.add(res)

  // ScraperEventBus events → SSE named events
  const onUpdate = (rivers: RiverData[]) => {
    res.write(`event: data-update\ndata: ${JSON.stringify(rivers)}\n\n`)
  }
  const onError = (error: Error) => {
    res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`)
  }
  const onStale = (since: Date) => {
    res.write(`event: stale\ndata: ${JSON.stringify({ since })}\n\n`)
  }

  engine.eventBus.on('data-update', onUpdate)
  engine.eventBus.on('error', onError)
  engine.eventBus.on('stale', onStale)

  // Heartbeat every 30s to keep connection alive
  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 30000)

  req.on('close', () => {
    clients.delete(res)
    engine.eventBus.removeListener('data-update', onUpdate)
    engine.eventBus.removeListener('error', onError)
    engine.eventBus.removeListener('stale', onStale)
    clearInterval(heartbeat)
  })
})

// Serve the built SPA in production
app.use(express.static('ui/dist'))
// SPA fallback — serve index.html for all non-API routes
app.get('*', (_req, res) => {
  res.sendFile('ui/dist/index.html', { root: process.cwd() })
})

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
```

### Pattern 2: React SSE Hook

**What:** A React hook that subscribes to the SSE endpoint and provides the latest river data as reactive state, with automatic reconnection.

```typescript
// Source: Synthesized from EventSource + React patterns
import { useEffect, useState } from 'react'
import type { RiverData } from '../types'

export function useRivers() {
  const [rivers, setRivers] = useState<RiverData[]>([])
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading')

  // Initial fetch
  useEffect(() => {
    fetch('/api/rivers')
      .then(res => res.json())
      .then((data: RiverData[]) => {
        setRivers(data)
        setStatus('connected')
      })
      .catch(() => setStatus('error'))
  }, [])

  // SSE for live updates
  useEffect(() => {
    const es = new EventSource('/api/events')

    es.addEventListener('data-update', (event) => {
      const data = JSON.parse(event.data) as RiverData[]
      setRivers(data)
      setStatus('connected')
    })

    es.addEventListener('error', () => {
      setStatus('error')
    })

    es.addEventListener('stale', () => {
      // Keep showing current data but mark as stale
      setStatus('connected')
    })

    return () => es.close()
  }, [])

  return { rivers, status }
}
```

### Anti-Patterns to Avoid

- **SSR for SPA:** Avoid React Router framework mode with SSR. The app is a single-user dashboard with no SEO requirements and needs to work as a pure static site for Capacitor wrapping. SSR adds deploy complexity and breaks the direct static-serving path.
- **Hash routing:** Avoid `HashRouter`. `BrowserRouter` with Express' catch-all `*` handler is cleaner, and Capacitor can handle pushState routing with proper deep link config.
- **CSS-in-JS:** shadcn uses Tailwind utility classes. Don't add styled-components or emotion — they fight the Tailwind class system and defeat the purpose of shadcn's `cn()` utility.
- **Redux or complex state management:** The app's global state is a list of RiverData objects with infrequent updates. A custom hook with `useState` + SSE callback is sufficient. Zustand would be over-engineering for this scale.
- **Separate backend process:** Don't create a separate HTTP server process that communicates with the scraper via IPC or a message queue. The scraper and API run in the same process — direct memory access to FlowStore is the simplest and most reliable path.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Component variant system | Custom conditional className logic | `class-variance-authority` (cva) | shadcn components expect cva; manually building variant logic duplicates years of community refinement |
| CSS class merging | Custom class deduplication | `tailwind-merge` via `cn()` | Tailwind classes conflict by nature (e.g., `p-4 p-8`); tailwind-merge determines the winner deterministically |
| Polymorphic components | Custom `as` prop handling | `@radix-ui/react-slot` | Slot handles ref forwarding, type safety, and event propagation — all edge cases that custom solutions get wrong |
| SSE client reconnection | Custom reconnect logic | Native `EventSource` API | Browsers built-in EventSource automatically reconnects with `Last-Event-ID` header — no library needed |
| PWA manifest + service worker | Manual manifest.json + sw.js | `vite-plugin-pwa` | Auto-generates manifest, precaches build assets, handles updates — one config block instead of manual files |
| Responsive design | Custom media queries | Tailwind responsive prefixes | `md:flex`, `lg:grid-cols-3` — declarative, co-located with markup, no separate CSS files |

**Key insight:** shadcn/ui is deliberately NOT a package you install from npm. It's a collection of copy-paste components. Each component is generated into your `src/components/ui/` directory, giving you full ownership and customization. The CLI (`npx shadcn@latest add <component>`) is the correct tool — don't manually copy from the shadcn docs.

## Common Pitfalls

### Pitfall 1: Tailwind v4 / shadcn Init Configuration
**What goes wrong:** shadcn CLI may conflict with existing Tailwind config or create unexpected file structures.
**Why it happens:** shadcn `init` generates `components.json`, CSS variables, and folder structure that may not match the project layout.
**How to avoid:** Run `npx shadcn@latest init --preset b2p8z4HAe` in the `ui/` directory as the first scaffold step, before adding any custom components. If the CLI fights you, fall back to manual setup: install the 5 shadcn deps (`class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/react-slot`, `tailwindcss-animate`), create `ui/src/lib/utils.ts` with `cn()`, and copy-paste components from shadcn docs.
**Warning signs:** `@/` alias not resolving, CSS variables missing, `cn()` utility not found.

### Pitfall 2: SSE Connection Limits and Port Exhaustion
**What goes wrong:** SSE connections not cleaned up on client disconnect → leaked listeners → port exhaustion.
**Why it happens:** Node.js keeps the response object alive until `req.on('close')` fires. If the cleanup handler doesn't remove EventEmitter listeners, they hold references preventing garbage collection.
**How to avoid:** Always clean up listeners in `req.on('close')`. Use a `Set<express.Response>` for client tracking and delete on close. Keep heartbeats to detect zombie connections behind proxies that don't emit close events.
**Warning signs:** Memory grows over time, `EventEmitter` warning for too many listeners, server refuses new connections.

### Pitfall 3: SPA Routing 404 on Page Refresh
**What goes wrong:** Refreshing `/river/:id` returns Express 404 because no file matches that path.
**Why it happens:** Express has no route for client-side paths. The catch-all `app.get('*', serveIndex)` must come AFTER all API routes and be the last fallback.
**How to avoid:** Order Express routes: API routes → static file middleware → catch-all SPA fallback. The catch-all must `res.sendFile('ui/dist/index.html')` — not redirect.
**Warning signs:** Navigation works, but F5/Cmd+R on a detail page returns 404.

### Pitfall 4: React Router + Vite Config Split
**What goes wrong:** `@/` alias not working because it's configured in only one of the two tsconfig files.
**Why it happens:** Vite's React TS template (tsconfig.json, tsconfig.app.json, tsconfig.node.json) requires the `@/*` alias in BOTH `tsconfig.json` and `tsconfig.app.json`.
**How to avoid:** Add `"baseUrl": "."` and `"paths": { "@/*": ["./src/*"] }` to both files, plus `resolve.alias` in `vite.config.ts`.
**Warning signs:** IDE shows squiggly lines on `@/components/ui/button` imports.

### Pitfall 5: Phase 1 Module System Conflict
**What goes wrong:** Phase 1 uses `module: "nodenext"` with `.js` extensions in imports. The Vite UI project uses `module: "bundler"`. When `server.ts` imports from both worlds, TypeScript config conflicts.
**Why it happens:** `server.ts` lives at the project root (nodenext) but needs to coexist with Phase 1 ESM imports.
**How to avoid:** The `server.ts` entry point can use a separate tsconfig (`tsconfig.server.json`) with `module: "nodenext"` matching the Phase 1 config. Or, keep the server as a simple JS-compatible module that imports via the project's existing tsconfig. Use `tsx` for running in dev (like Phase 1 does).
**Warning signs:** `ERR_MODULE_NOT_FOUND` or `ERR_REQUIRE_ESM` when running the server.

## Code Examples

### shadcn `cn()` Utility

```typescript
// ui/src/lib/utils.ts
// Source: shadcn docs — standard utility for every shadcn project
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Danger Level Color Map

```typescript
// ui/src/features/dashboard/StatusIndicator.tsx
// Source: UI design contract color spec
import type { AlertLevel, RiverStatus } from '@/types'

const DANGER_COLORS: Record<AlertLevel, string> = {
  1: 'bg-green-500',    // Safe
  2: 'bg-yellow-500',   // Moderate
  3: 'bg-orange-500',   // High
  4: 'bg-red-500',      // Very High
  5: 'bg-purple-600',   // Extreme/Flood
}

const STATUS_COLORS: Record<RiverStatus, string> = {
  ok: 'bg-green-500',
  stale: 'bg-amber-500',
  error: 'bg-red-500',
}

export function StatusDot({ level, status }: { level: AlertLevel; status: RiverStatus }) {
  // Show danger level color if data is fresh, status color if stale/error
  const color = status === 'ok' ? DANGER_COLORS[level] : STATUS_COLORS[status]
  return <span className={`inline-block h-3 w-3 rounded-full ${color}`} aria-hidden="true" />
}
```

### Danger Level Bar (Five-Level Scale)

```typescript
// ui/src/features/river/DangerLevelBar.tsx
// Source: UI design contract — shows position on 1-5 scale
import type { AlertLevel } from '@/types'

const LEVEL_COLORS = ['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500', 'bg-purple-600']
const LEVEL_LABELS = ['Low', 'Moderate', 'High', 'Very High', 'Extreme']

export function DangerLevelBar({ level }: { level: AlertLevel }) {
  return (
    <div className="flex gap-1" role="img" aria-label={`Danger level ${level}: ${LEVEL_LABELS[level - 1]}`}>
      {LEVEL_COLORS.map((color, i) => (
        <div
          key={i}
          className={`h-3 flex-1 rounded-sm ${i < level ? color : 'bg-neutral-200'}`}
        />
      ))}
    </div>
  )
}
```

### River Dashboard Card

```tsx
// ui/src/features/dashboard/RiverCard.tsx
// Source: shadcn Card patterns + UI design contract
import { Card, CardContent } from '@/components/ui/card'
import { StatusDot } from './StatusIndicator'
import type { RiverData } from '@/types'

export function RiverCard({ river }: { river: RiverData }) {
  return (
    <Card className="p-4">
      <CardContent className="flex items-center justify-between p-0">
        <div className="flex items-center gap-3">
          <StatusDot level={river.alertLevel} status={river.status} />
          <div>
            <p className="text-lg font-semibold">{river.name}</p>
            <p className="text-sm text-neutral-500">{river.unit}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{river.currentLevel ?? '—'}</p>
          <p className="text-xs text-neutral-400">{river.alertLevel}/5</p>
        </div>
      </CardContent>
    </Card>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Create React App (CRA) | Vite | 2022–2023 (CRA deprecated 2023) | Vite is now the default React build tool; faster HMR, native ESM |
| Tailwind v3 (`@tailwind` directives + `tailwind.config.js`) | Tailwind v4 (`@import "tailwindcss"` + `@theme`) | 2025 (Tailwind v4 GA) | Simpler config. Use `@tailwindcss/vite` plugin, CSS-first config via `@theme` |
| react-router v6 | react-router v7 (merged with Remix) | 2024–2025 | Two modes: library (SPA) and framework (SSR). Use library mode for Phase 2 |
| shadcn/ui v0/v1 | shadcn/ui v4 (CLI with presets) | 2025–2026 | Use `npx shadcn@latest init --preset CODE` for 1-command setup |
| CSS Modules / styled-components | Tailwind utility classes | Current | Tailwind + shadcn is the dominant pattern for 2026 React apps |

**Deprecated/outdated:**
- `create-react-app`: Dead project. Use Vite.
- Tailwind v3 `tailwind.config.js`: Replaced by `@theme` in CSS in v4.
- `react-router-dom` v5 or v6: React Router v7 supersedes both.
- `@shadcn/ui` npm package: Does not exist. shadcn is a collection of copy-paste components, not an npm library.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `slopcheck` unavailable — all packages tagged [ASSUMED] | Package Legitimacy Audit | Planner must add manual verification checkpoints |
| A2 | Phase 1 `engine` export from `src/index.ts` is importable by a new `server.ts` | Architecture | Low — it's a plain `export { engine }` in ESM format, same module system in use |
| A3 | Project can run Phase 1 scraper + Express server in the same Node.js process | Architecture | Medium — if the scraper blocks the event loop for too long, HTTP requests queue. Mitigation: the scraper is already async with Promise.allSettled |
| A4 | SSE is sufficient for Phase 2's real-time needs (no WebSocket needed) | Data Flow | Low — scraper runs every 15 minutes by default, data flows server→client only. SSE is the documented correct choice for this pattern |
| A5 | No Vite-plugin-pwa version constraint | Standard Stack | Medium — if vite-plugin-pwa doesn't support Vite 8, fall back to manual manifest.json. Verify at install time |
| A6 | Phase 2 has no external environment dependencies beyond Node.js | Environment | Low — confirmed by auditing Phase 1 deps; UI is purely frontend code |

## Open Questions

1. **Server entry point location**
   - What we know: Need a server that imports Phase 1 engine + Express routes. The existing `src/index.ts` is the scraper entry point.
   - What's unclear: Should `server.ts` live at the project root (sibling to `src/`) or inside `src/` as `src/server.ts`? If inside `src/`, it needs to be excluded from the Phase 1 build.
   - Recommendation: Root-level `server.ts` with its own build config. Keeps Phase 1 `src/` untouched.

2. **Shared types between Phase 1 and UI**
   - What we know: UI needs `RiverData`, `AlertLevel`, and `RiverStatus` types from Phase 1's `src/core/types.ts`.
   - What's unclear: Should types be extracted to a shared package, symlinked, or duplicated?
   - Recommendation: Duplicate in `ui/src/types/index.ts` for Phase 2. The types are small (37 lines) and stable. If they change in Phase 3, a one-time sync is trivial. Avoid the overhead of a shared package for MVP.

3. **SSE event format for stale data**
   - What we know: The stale event emits a `Date`. The UI needs to show the spec copy: "Water level data unavailable. Data may be stale. Last updated: [time]".
   - What's unclear: Should the stale payload include the last-updated time directly (saving the client from computing it), or should the client compute it from existing RiverData?
   - Recommendation: Include `{ since: ISO string }` in the stale payload for direct consumption.

4. **Empty state timing**
   - What we know: "No rivers yet" + "Rivers will appear here once data is loaded from monitoring stations."
   - What's unclear: When is this shown? Only on first visit before initial scrape? Or when the user has no favorites (Phase 3)?
   - Recommendation: In Phase 2 (no favorites yet), show the empty state after initial fetch returns empty array, with a loading skeleton shown during fetch. The default state of the scraper should populate data within seconds of startup.

5. **Dev mode Vite proxy config**
   - What we know: Vite dev server on 5173, Express API on 3000. Vite's proxy can forward `/api/*` to the Express backend.
   - What's unclear: Should the proxy be in `vite.config.ts` or use a separate middleware in `server.ts`?
   - Recommendation: Vite `server.proxy` config in `ui/vite.config.ts` — `{ '/api': { target: 'http://localhost:3000' } }`. Simplest. The developer runs both `server.ts` (Express) and `npm run dev` (Vite) concurrently.

## Environment Availability

> Phase 2 depends on Node.js (already used by Phase 1) and a modern browser for development. No external services required.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Express server, Vite build | ✓ | (verified from Phase 1) | — |
| npm | Package installs | ✓ | — | — |
| Browser (modern) | React SPA development | ✓ | — | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

## Validation Architecture

> `workflow.nyquist_validation` is explicitly `false` in `.planning/config.json`. This section is SKIPPED.

## Security Domain

> `security_enforcement` is not configured (absent) and the phase is a UI-only SPA consuming localhost API data. No authentication, no user data storage, no external API keys in the frontend.

**Security considerations for this phase:**
- The Express API runs on localhost only — no exposure to external networks
- No user input is stored or processed in Phase 2 (read-only dashboard)
- SSE endpoints are read-only; no POST/PUT/DELETE in Phase 2
- CORS only needed in development (Vite proxy handles dev, same-origin in production)
- No CSRF concerns (no mutations)
- No XSS vector beyond React's built-in escaping (no dangerouslySetInnerHTML)

**No ASVS categories apply** — the phase has no authentication, session management, access control, input processing, or cryptographic operations.

## Sources

### Primary (HIGH confidence)
- [VERIFIED: npm registry] — Package versions (react 19.2.6, react-router 7.15.1, vite 8.0.14, tailwindcss 4.3.0, express 5.2.1, lucide-react 1.16.0)
- [CITED: ui.shadcn.com/docs/installation/vite] — shadcn Vite setup with Tailwind v4, `@` alias config, CLI usage
- [CITED: reactrouter.com/7.10.0/start/framework/deploying] — React Router v7 deployment options (SPA vs SSR)
- [CITED: tailwindcss.com/docs/responsive-design] — Mobile-first breakpoints, container queries, `max-*` variants
- [CITED: 02-UI-SPEC.md] — Design contract: colors, typography, spacing, copy, components

### Secondary (MEDIUM confidence)
- [CITED: brandonwie.dev — shadcn manual setup] — shadcn deps explanation (cva, clsx, tailwind-merge)
- [CITED: application-architect.com — SSE with Express] — Production SSE patterns: client tracking, heartbeats, named events, last-event-id
- [CITED: dev.to/alexcloudstar — SSE vs WebSocket 2026] — SSE vs WebSocket decision matrix
- [CITED: capgo.app — PWA to Capacitor migration] — Step-by-step for wrapping Vite SPA in Capacitor
- [CITED: unlighthouse.dev — touch target size] — 44px touch target requirements with Tailwind patterns

### Tertiary (LOW confidence)
- [ASSUMED] vite-plugin-pwa compatibility with Vite 8 — not verified; confirm at install time
- [ASSUMED] No module system conflicts between nodenext (Phase 1) and bundler (Vite) in server.ts

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified on npm registry, shadcn docs confirm setup
- Architecture: HIGH — Phase 1 codebase examined directly, SSE pattern well-documented
- Pitfalls: MEDIUM — common Vite/shadcn gotchas from community, SSE cleanup verified in multiple sources
- Capacitor readiness: MEDIUM — patterns from CapGo and community repos, but not tested with this specific project

**Research date:** 2026-05-27
**Valid until:** 2026-06-27 (30 days — npm package versions and shadcn CLI may change)

---

## RESEARCH COMPLETE

**Phase:** 2 — Web UI
**Confidence:** HIGH

### Key Findings
1. **Monolithic server approach:** Add Express to the Phase 1 Node.js process. One process serves both the scraper engine and the HTTP API/static files. Simple, no IPC overhead.
2. **SSE for real-time:** ScraperEventBus → Express SSE endpoint → browser EventSource. Unidirectional, infrequent updates (cron-driven). No WebSocket complexity.
3. **Separate `ui/` Vite project:** A standalone Vite React SPA at `ui/` with its own `package.json`. Clean separation from the Phase 1 engine. Dev via Vite proxy, prod via Express static serving.
4. **react-router v7 (library mode):** Client-side routing only. No SSR. Cleaner deploy, simpler Capacitor wrapping.
5. **Component architecture:** shadcn primitives (`button`, `card`, `badge`, `skeleton`) + custom domain components (`StatusIndicator`, `DangerLevelBar`, `RiverCard`, `DashboardPage`, `RiverDetailPage`). Feature-based organization within `ui/src/features/`.
6. **Mobile-ready:** Tailwind mobile-first breakpoints, 44px touch targets (`min-h-11 min-w-11`), PWA manifest via `vite-plugin-pwa` for Capacitor readiness (UI-04).
7. **Package verification:** All core npm packages verified against registry. All tagged [ASSUMED] because slopcheck unavailable — planner must gate installs behind human verify.

### File Created
`.planning/phases/02-web-ui/02-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | Versions verified on npm registry; shadcn docs confirm setup |
| Architecture | HIGH | Phase 1 codebase directly examined; SSE pattern from multiple authoritative sources |
| Pitfalls | MEDIUM | Community-confirmed gotchas; no in-project testing |
| Capacitor Readiness | MEDIUM | Patterns from CapGo docs; untested with this specific project |

### Open Questions
- Server entry point location (root `server.ts` recommended)
- Shared types approach (duplicate in `ui/src/types/` recommended)
- Empty state timing (show after initial fetch returns empty, with skeleton during load)
- Dev proxy config (Vite `server.proxy` recommended)

### Ready for Planning
Research complete. Planner can now create PLAN.md files for Phase 2: Web UI.
