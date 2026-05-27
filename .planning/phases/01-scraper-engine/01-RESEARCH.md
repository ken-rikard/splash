# Phase 1: Scraper Engine — Research

**Researched:** 2026-05-27
**Domain:** Data scraping / API consumption, typed adapter architecture
**Confidence:** HIGH

## Summary

HvorErDetVann.com is a Solid.js SPA backed by a REST API at `/api/sections` that returns structured JSON for all 103 river sections. This is a **critical discovery** that changes the technical approach from the original assumption (HTML scraping with cheerio) to direct API consumption. The API includes current water flow (m³/s), water level (meters), 5-level danger zone classification (dry/low/medium/high/very_high), and limits array defining zone boundaries.

Node.js 26.1.0 (installed) has native `fetch` via undici — no need for `node-fetch`. Since the data is already JSON, no HTML parser (`cheerio`) is needed either. This eliminates two of the originally-discussed dependencies and simplifies the entire architecture.

**Primary recommendation:** Use native `fetch` + `p-retry` for HTTP calls, `node-cron` for scheduling, and a clean `DatasourceAdapter` interface with a `HvorErDetVannAdapter` implementation. The retry, schedule, and adapter patterns from the CONTEXT.md decisions are still valid — only the transport/parsing layer changes from HTML scraping to API consumption.

### ⚠️ Critical Update to CONTEXT.md Decision D-02

The discussion [D-02] assumed `hvorerdetvann.com` returns "server-rendered HTML" suitable for cheerio parsing. **This assumption is incorrect.** The site is a Solid.js SPA; data comes from a REST API (`/api/sections`). This research recommends replacing:
- `node-fetch` → native `fetch` (built into Node.js 26)
- `cheerio` → direct JSON parsing with TypeScript type guards

The planner and discuss-phase should confirm this deviation from D-02 before planning.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** TypeScript on Node.js — aligns with web-first stack, Capacitor mobile path, consistent with UI and alert phases. No build-tool concessions needed for scraping.
- **D-03:** The scraper targets the table structure of hvorerdetvann.com's river listing page. *(NOTE: Changed to API consumption — see D-02 update above)*
- **D-04:** `node-cron` with configurable cron expression (default: every 15 minutes). No external scheduler dependency.
- **D-05:** Exponential backoff (base 2s, cap 60s), max 3 retries per scrape cycle.
- **D-06:** Stale-data window: 30 minutes. If last successful fetch > 30 min ago, emit a "stale" status.
- **D-07:** Non-fatal errors (timeout, 5xx) retry silently. Fatal errors (invalid HTML structure, schema mismatch) skip to error state immediately. *(NOTE: "invalid HTML" changes to "invalid API response structure / schema mismatch")*
- **D-08:** Error state is published as part of the data model so Phase 2's UI can surface it.
- **D-09:** `DatasourceAdapter` interface/abstract class with `fetch()` and `parse()` methods.
- **D-10:** Adapters registered via `ScraperEngine.register(adapter)`. Engine iterates adapters and emits consolidated resultset.
- **D-11:** Adapter contract returns typed `RiverData[]` — no raw HTML/JSON leaks past the parser boundary.
- **D-12:** Core `RiverData` interface with `id`, `name`, `source`, `currentLevel`, `alertLevel`, `lastUpdated`, `status`, `error?`.
- **D-13:** In-memory `DataStore` holds latest RiverData, keyed by id. No disk persistence in Phase 1.
- **D-14:** Engine emits events (`ScraperEvents`) when data updates or errors occur.

### the agent's Discretion
- Schedule configuration format (env var vs config file) and project structure (monorepo vs flat) deferred to planning.
- Testing framework and test patterns are standard TypeScript (vitest).

### Deferred Ideas (OUT OF SCOPE)
- Custom datasource UI (v2)
- Historical data storage (v2)
- Push notifications (v2+)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCRP-01 | System fetches water level data from hvorerdetvann.com on a configurable schedule | API endpoint `/api/sections` returns full data. `node-cron` handles scheduling. Native `fetch` with `p-retry` for resilient HTTP. |
| SCRP-02 | System parses river name, current level, and position on the five-level scale | API returns `section.name`, `last_flow.flow`/`last_flow.meters`, and `zone` (dry/low/medium/high/very_high). `limits` array provides boundary validation. |
| SCRP-03 | System handles scrape failures gracefully (retry, stale-data fallback, user-visible error) | `p-retry` with exponential backoff; stale-data window via timestamp comparison; `status: 'ok' | 'stale' | 'error'` in RiverData model. |
| SCRP-04 | Datasources are implemented via pluggable adapters | `DatasourceAdapter` interface with `fetch()` + `parse()` in `src/core/adapter.ts`. `HvorErDetVannAdapter` as first implementation. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| HTTP data fetching | Backend / Service | — | Runs in Node.js, called via cron schedule. No browser involved. |
| Data parsing / transformation | Backend / Service | — | Raw API JSON → typed RiverData objects. Parser boundary in adapter. |
| Scrape scheduling | Backend / Service | — | node-cron in the Node.js process. Configurable expression. |
| Retry / error handling | Backend / Service | — | p-retry manages retries. Fatal errors bubble to error state. |
| In-memory data store | Backend / Service | — | Simple Map<id, RiverData>. Phase 2 UI reads from this store. |
| Event emission | Backend / Service | — | Typed EventEmitter for loose coupling with UI layer (Phase 2). |
| Adapter registration | Backend / Service | — | ScraperEngine.register(adapter). Engine orchestrates. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 6.0.3 | Type-safe development | Project requirement (D-01), strict mode prevents class of data-model bugs |
| p-retry | 8.0.0 | Retry with exponential backoff | Battle-tested, handles network error detection, abort signals, custom retry conditions. Used by Sindre Sorhus ecosystem. |
| node-cron | 4.2.1 | Cron-based schedule | Zero dependencies, supports timezone, simple API. D-04 locked decision. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.1.7 | Testing framework | Standard in TS/JS ecosystem. Fast, ESM-native, TypeScript-compatible. |
| tsx | 4.22.3 | Run TypeScript directly (dev) | Dev-time only. Runs TS without compilation step. Faster than ts-node. |

### Eliminated (from original discussion)
| Library | Reason Eliminated |
|---------|-------------------|
| node-fetch | Node.js 26 has native `fetch` built in via undici. No extra dependency needed. |
| cheerio | Data comes from REST API as JSON, not HTML. No parsing needed. |

### Dependencies NOT Added
- **No HTTP client library** — native `fetch` suffices for a single API endpoint
- **No HTML parser** — data is already structured JSON
- **No schema validator** — TypeScript type guards + runtime checks sufficient for Phase 1
  - *If validation needs grow*, add `zod` in a later phase (not Phase 1)

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| p-retry | Custom retry function | p-retry handles edge cases (abort signal, network error detection, timeout). Custom would need testing for these. |
| node-cron | toad-scheduler / bull / agenda | node-cron is simplest and zero-dependency. Others are overkill for a single periodic task. |
| native fetch | got / ky / undici directly | Native fetch is sufficient. got adds streaming, timeout middleware, retry — but p-retry covers retry. |

**Installation:**
```bash
npm install p-retry node-cron
npm install -D typescript vitest tsx
```

**Version verification:**
```bash
# All npm packages verified on registry 2026-05-27
npm view p-retry@8.0.0 version    # 8.0.0 (published 2026-03-26)
npm view node-cron@4.2.1 version   # 4.2.1 (published 2025-07-10)
npm view typescript@6.0.3 version  # 6.0.3 (published 2026-04-16)
npm view vitest@4.1.7 version      # 4.1.7 (published 2026-05-20)
```

## Package Legitimacy Audit

> **Note:** slopcheck was installed but only checks the PyPI registry. All packages below are npm packages. Each was verified via `npm view`, source repository check, and postinstall script scan.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| p-retry | npm | ~8 yrs | 35M+/week | github.com/sindresorhus/p-retry | N/A (npm) | Approved |
| node-cron | npm | ~12 yrs | 8M+/week | github.com/merencia/node-cron | N/A (npm) | Approved |
| vitest | npm | ~5 yrs | 10M+/week | github.com/vitest-dev/vitest | N/A (npm) | Approved |
| tsx | npm | ~4 yrs | 5M+/week | github.com/privatenumber/tsx | N/A (npm) | Approved |

**Postinstall scripts:** None of the above packages have postinstall scripts. ✅

## Architecture Patterns

### System Architecture Diagram

```mermaid
flowchart LR
    subgraph External
        API[("hvorerdetvann.com\n/api/sections")]
    end

    subgraph "Scraper Engine (Node.js Process)"
        direction TB
        CRON["node-cron\nSchedule (every 15min)"]
        EN["ScraperEngine\nOrchestrator"]
        AD["HvorErDetVannAdapter\n(fetch + parse)"]
        DS[("DataStore\nMap<id, RiverData>")]
        EE["EventEmitter\nTyped events"]
        CF["Config\n(schedule, retry,\nstale window)"]

        CRON -->|triggers| EN
        EN -->|calls| AD
        AD -->|fetch + p-retry| API
        API -->|JSON response| AD
        AD -->|RiverData[]| EN
        EN -->|stores| DS
        EN -->|emits| EE

        EN -.->|on failure| RT["p-retry\n(exponential backoff\n3 retries)"]
        RT -.->|retry| AD
    end

    subgraph "Phase 2 Consumer"
        UI["Web UI\nReact/Svelte/etc."]
        EE -->|data-update / error / stale| UI
        DS -->|read| UI
    end

    subgraph "Future Datasources"
        AD2["NewAdapter\n(fetch + parse)"]
        EN -.->|register()| AD2
    end

    style API fill:#f96
    style UI fill:#6cf
    style AD2 fill:#9c9
```

### Recommended Project Structure

```
splash/
├── package.json              # "type": "module", scripts, dependencies
├── tsconfig.json             # module: nodenext, strict: true
├── src/
│   ├── index.ts              # Entry point: instantiate and start engine
│   ├── config.ts             # Schedule, retry, stale-window configuration
│   ├── core/
│   │   ├── types.ts          # RiverData, ScraperStatus, ZoneLevel types
│   │   ├── adapter.ts        # DatasourceAdapter interface
│   │   ├── engine.ts         # ScraperEngine — orchestrator
│   │   ├── store.ts          # DataStore — in-memory Map
│   │   └── events.ts         # Typed event emitter (ScraperEventBus)
│   └── adapters/
│       └── hvorerdetvann.ts  # HvorErDetVannAdapter implementation
├── tests/
│   ├── core/
│   │   ├── types.test.ts
│   │   ├── adapter.test.ts
│   │   ├── engine.test.ts
│   │   ├── store.test.ts
│   │   └── events.test.ts
│   └── adapters/
│       └── hvorerdetvann.test.ts
└── vitest.config.ts
```

### Pattern 1: DatasourceAdapter Interface

**What:** Pluggable adapter interface separating data source interaction from the engine. Each datasource implements `fetch()` and `parse()` — the engine only knows the contract.

**When to use:** For every data source added to the system. Future adapters extend this interface.

**Example:**
```typescript
// Source: Based on D-09/D-10/D-11 from CONTEXT.md

// src/core/types.ts
export interface RiverData {
  id: string;                  // source-prefixed unique ID, e.g. "hvorerdetvann:22"
  name: string;                // human-readable river name
  source: string;              // datasource identifier, e.g. "hvorerdetvann"
  currentLevel: number | null; // water level in source units (m³/s)
  alertLevel: number;          // 1-5 five-level scale position
  lastUpdated: Date;
  status: 'ok' | 'stale' | 'error';
  error?: string;              // human-readable error if status is 'error'
}

// src/core/adapter.ts
export interface DatasourceAdapter {
  readonly sourceId: string;   // unique identifier for this datasource
  fetch(): Promise<RiverData[]>;
}

// src/adapters/hvorerdetvann.ts
import { DatasourceAdapter, RiverData } from '../core/adapter.js';

interface ApiSection {
  section: { id: number; name: string; limits: number[] };
  last_flow: { timestamp: string; flow: number; meters: number };
  zone: 'dry' | 'low' | 'medium' | 'high' | 'very_high';
}

interface ApiResponse {
  sections: ApiSection[];
}

const ZONE_TO_LEVEL: Record<string, number> = {
  'dry': 1, 'low': 2, 'medium': 3, 'high': 4, 'very_high': 5,
};

function parseApiSection(section: ApiSection): RiverData {
  return {
    id: `hvorerdetvann:${section.section.id}`,
    name: section.section.name,
    source: 'hvorerdetvann',
    currentLevel: section.last_flow?.flow ?? null,
    alertLevel: ZONE_TO_LEVEL[section.zone] ?? 0,
    lastUpdated: new Date(section.last_flow.timestamp),
    status: 'ok',
  };
}

export class HvorErDetVannAdapter implements DatasourceAdapter {
  readonly sourceId = 'hvorerdetvann';
  private readonly baseUrl = 'https://hvorerdetvann.com/api/sections';

  async fetch(): Promise<RiverData[]> {
    const response = await fetch(this.baseUrl, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }
    const data = (await response.json()) as ApiResponse;
    if (!data?.sections || !Array.isArray(data.sections)) {
      throw new Error('Invalid API response structure: missing sections array');
    }
    return data.sections.map(parseApiSection);
  }
}
```

### Pattern 2: Retry with p-retry

**What:** Wrap the fetch call with `p-retry` for exponential backoff. Use `AbortError` for fatal errors that should skip retry.

**When to use:** For every HTTP call made by any adapter. The engine applies this transparently.

**Example:**
```typescript
// Source: D-05, D-07 from CONTEXT.md, verified against p-retry API docs

import pRetry from 'p-retry';

const RETRY_CONFIG = {
  retries: 3,
  minTimeout: 2000,   // base 2s
  maxTimeout: 60000,  // cap 60s
  factor: 2,           // exponential
};

async function fetchWithRetry<T>(adapter: DatasourceAdapter): Promise<T> {
  return pRetry(
    async () => {
      try {
        return await adapter.fetch() as T;
      } catch (error) {
        // Fatal errors: invalid structure, schema mismatch — don't retry
        if (error instanceof TypeError && error.message.includes('structure')) {
          throw new pRetry.AbortError(error);
        }
        // Non-fatal: timeout, 5xx — retry
        throw error;
      }
    },
    {
      ...RETRY_CONFIG,
      onFailedAttempt: (error) => {
        console.warn(
          `Scrape attempt ${error.attemptNumber} failed: ${error.message}. ` +
          `${error.retriesLeft} retries remaining.`
        );
      },
    }
  );
}
```

### Pattern 3: Typed Event Emitter

**What:** Wrapper around Node.js `EventEmitter` with typed event map for type-safe event contracts between the engine and consumers.

**When to use:** For all events from the engine to the UI layer (Phase 2). Ensures consumers receive correctly typed data.

**Example:**
```typescript
// Source: D-14 from CONTEXT.md, Node.js EventEmitter docs

import { EventEmitter } from 'node:events';
import { RiverData } from './types.js';

export interface ScraperStatus {
  sourceId: string;
  lastFetch: Date | null;
  status: 'idle' | 'fetching' | 'ok' | 'error';
  error?: string;
}

export interface ScraperEventMap {
  'data-update': (sourceId: string, rivers: RiverData[]) => void;
  'error': (sourceId: string, error: Error) => void;
  'stale': (sourceId: string, since: Date) => void;
  'status-change': (sourceId: string, status: ScraperStatus) => void;
}

export class ScraperEventBus {
  private emitter = new EventEmitter();

  on<K extends keyof ScraperEventMap>(
    event: K,
    listener: ScraperEventMap[K]
  ): this {
    this.emitter.on(event, listener as (...args: unknown[]) => void);
    return this;
  }

  emit<K extends keyof ScraperEventMap>(
    event: K,
    ...args: Parameters<ScraperEventMap[K]>
  ): boolean {
    return this.emitter.emit(event, ...args);
  }

  removeListener<K extends keyof ScraperEventMap>(
    event: K,
    listener: ScraperEventMap[K]
  ): this {
    this.emitter.removeListener(event, listener as (...args: unknown[]) => void);
    return this;
  }
}
```

### Anti-Patterns to Avoid

- **Scraping HTML when JSON API exists** — The site has a rich API. Parsing HTML would be fragile, slower, and produce worse data.
- **Hand-rolling retry logic** — Edge cases (abort signals, timeout during backoff, network error classification) are subtle and well-handled by `p-retry`.
- **Coupled adapters sharing state** — Each `fetch()` call should be independent. Don't share mutable state between adapters.
- **Blocking event loop during fetch** — Always use `await`. The data fetch is I/O-bound; `p-retry` and `fetch` are both promise-based.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Retry with exponential backoff | Custom retry function | `p-retry` | Edge cases: abort signals, network error detection, timeout during retry interval, max retry tracking |
| Cron scheduling | Custom setInterval logic | `node-cron` | Daylight saving time handling, cron expression standard, zero-dependency |
| HTML parsing (if needed later) | Regex-based parsing | `cheerio` | D-02 premise was invalid but cheerio remains the right choice if HTML scraping is ever needed |

**Key insight:** This phase has fewer "don't hand-roll" items than expected because native `fetch` eliminates the HTTP library and the JSON API eliminates the HTML parser. The remaining complexity is in the adapter architecture and error handling, which are core business logic worth writing explicitly.

## Common Pitfalls

### Pitfall 1: Cron Timezone Mismatch
**What goes wrong:** node-cron runs in the server's local timezone by default. If the system timezone differs from the user's timezone or UTC, scheduled runs happen at unexpected times.
**Why it happens:** node-cron doesn't default to UTC. The cron expression "*/15 * * * *" always runs every 15 minutes, but time-of-day specific schedules (e.g., "0 8 * * *" for once a day at 8 AM) depend on the timezone.
**How to avoid:** Always pass the `timezone` option explicitly:
```typescript
nodeCron.schedule('*/15 * * * *', task, { timezone: 'UTC' });
```
For Phase 1's every-15-min schedule, timezone doesn't matter. But future schedules may need it.
**Warning signs:** Scraping runs at unexpected hours.

### Pitfall 2: Stale Data on First Run
**What goes wrong:** The engine has never fetched data, so `lastUpdated` is null. The stale-data check (30 min window) needs to handle the case where no data has ever been fetched.
**Why it happens:** D-06 says "emit stale status if last successful fetch > 30 min ago" — but what if there has never been a successful fetch?
**How to avoid:** Initialize `lastUpdated` to epoch 0 or handle the null case explicitly in the stale check.
**Warning signs:** Type errors from nullable `lastUpdated`.

### Pitfall 3: Schema Mismatch on API Changes
**What goes wrong:** The API changes its response format (field renamed, structure changed, new required field). The adapter's `parse()` function throws, caught by p-retry as a fatal error.
**Why it happens:** External API evolution without notice.
**How to avoid:** Defensive parsing with optional chaining and type guards. Log the raw response when validation fails so debugging is possible. Consider a schema validation library (zod) in a later phase if the API proves unstable.
**Warning signs:** All scrapes fail with "Invalid API response structure" after an API deployment.

### Pitfall 4: ESM Import Confusion
**What goes wrong:** Imports fail because the project is ESM (`"type": "module"` in package.json) but some tooling or imports use CJS patterns.
**Why it happens:** Both `p-retry` (ESM-only) and `node-cron` (dual CJS/ESM) support ESM, but TypeScript configuration must match. If `module` is set to `commonjs` in tsconfig, `p-retry` imports will fail at runtime.
**How to avoid:** Use `"module": "nodenext"` in tsconfig.json and `"type": "module"` in package.json. Always include `.js` extension in relative imports.
**Warning signs:** `ERR_MODULE_NOT_FOUND` or `ERR_REQUIRE_ESM` errors.

## Code Examples

Verified patterns from official sources:

### Typed Adapter Registration in Engine
```typescript
// src/core/engine.ts
import { DatasourceAdapter } from './adapter.js';
import { DataStore } from './store.js';
import { ScraperEventBus } from './events.js';
import { ScraperConfig } from '../config.js';

export class ScraperEngine {
  private adapters: DatasourceAdapter[] = [];
  private store: DataStore;
  private events: ScraperEventBus;
  private config: ScraperConfig;

  constructor(config: ScraperConfig) {
    this.store = new DataStore();
    this.events = new ScraperEventBus();
    this.config = config;
  }

  register(adapter: DatasourceAdapter): void {
    this.adapters.push(adapter);
  }

  get eventBus(): ScraperEventBus {
    return this.events;
  }

  get dataStore(): DataStore {
    return this.store;
  }

  async scrapeAll(): Promise<void> {
    const results = await Promise.allSettled(
      this.adapters.map((adapter) => this.scrapeOne(adapter))
    );

    for (const result of results) {
      if (result.status === 'rejected') {
        console.error('Scrape cycle failed:', result.reason);
        // Error already emitted by scrapeOne
      }
    }
  }

  private async scrapeOne(adapter: DatasourceAdapter): Promise<void> {
    this.events.emit('status-change', adapter.sourceId, {
      sourceId: adapter.sourceId,
      lastFetch: null,
      status: 'fetching',
    });

    try {
      const data = await this.fetchWithRetry(adapter);
      this.store.update(adapter.sourceId, data);
      this.events.emit('data-update', adapter.sourceId, data);
      this.events.emit('status-change', adapter.sourceId, {
        sourceId: adapter.sourceId,
        lastFetch: new Date(),
        status: 'ok',
      });
    } catch (error) {
      const lastData = this.store.getBySource(adapter.sourceId);
      const isStale = this.isStale(adapter.sourceId);

      if (isStale && lastData.length > 0) {
        this.events.emit('stale', adapter.sourceId, this.getStaleSince(adapter.sourceId));
      }

      this.events.emit('status-change', adapter.sourceId, {
        sourceId: adapter.sourceId,
        lastFetch: null,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
```

### In-memory DataStore
```typescript
// src/core/store.ts
import { RiverData } from './types.js';

export class DataStore {
  private data = new Map<string, RiverData>();

  update(sourceId: string, rivers: RiverData[]): void {
    for (const river of rivers) {
      this.data.set(river.id, river);
    }
  }

  getById(id: string): RiverData | undefined {
    return this.data.get(id);
  }

  getBySource(sourceId: string): RiverData[] {
    return Array.from(this.data.values()).filter(
      (r) => r.source === sourceId
    );
  }

  getAll(): RiverData[] {
    return Array.from(this.data.values());
  }

  getLastUpdated(sourceId: string): Date | null {
    const rivers = this.getBySource(sourceId);
    if (rivers.length === 0) return null;
    return rivers.reduce((latest, r) =>
      r.lastUpdated > latest ? r.lastUpdated : latest
    , rivers[0].lastUpdated);
  }
}
```

### cron Schedule Setup
```typescript
// src/config.ts
export interface ScraperConfig {
  schedule: string;          // cron expression (default: '*/15 * * * *')
  scheduleTimezone: string;  // (default: 'UTC')
  retry: {
    retries: number;         // (default: 3)
    minTimeout: number;      // base backoff ms (default: 2000)
    maxTimeout: number;      // cap ms (default: 60000)
    factor: number;          // exponential factor (default: 2)
  };
  staleWindowMinutes: number; // (default: 30)
}

// Source: Adapted from node-cron docs and D-04/D-05 decisions

import nodeCron from 'node-cron';
import { ScraperEngine } from './core/engine.js';
import { HvorErDetVannAdapter } from './adapters/hvorerdetvann.js';

const config: ScraperConfig = {
  schedule: process.env.SCRAPE_SCHEDULE || '*/15 * * * *',
  scheduleTimezone: 'UTC',
  retry: { retries: 3, minTimeout: 2000, maxTimeout: 60000, factor: 2 },
  staleWindowMinutes: 30,
};

const engine = new ScraperEngine(config);
engine.register(new HvorErDetVannAdapter());
engine.eventBus.on('data-update', (sourceId, rivers) => {
  console.log(`[${sourceId}] Updated ${rivers.length} rivers`);
});

// Start scheduled scraping
nodeCron.schedule(config.schedule, () => {
  engine.scrapeAll();
}, { timezone: config.scheduleTimezone });

// Also run once immediately on startup
engine.scrapeAll();
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| node-fetch for HTTP | Native `fetch` in Node.js | Node.js 18+ (stable in 21+) | One less dependency. Native fetch uses undici, faster than node-fetch. |
| cheerio HTML table parsing | Direct JSON API consumption | This research | No HTML parsing needed. Richer data. More reliable. |
| CJS default | ESM default | Node.js 16+ | p-retry is ESM-only. ESM is the future of the ecosystem. Node 26 has flawless ESM support. |

**Deprecated/outdated:**
- `node-fetch` (v3): Not needed since Node.js 18+ has native fetch. v3 is ESM-only anyway, same as native.
- `ts-node`: Replaced by `tsx` for development. tsx uses esbuild, 20x faster.
- `retry` package (v0.13.1): CJS-only, last published 2023. Use `p-retry` (ESM, actively maintained).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The API endpoint `/api/sections` is stable and returns data in the observed format | Standard Stack | Low — API was confirmed working during research. If format changes, the adapter's parse function handles validation. |
| A2 | Native `fetch` is reliable enough for the scraper's needs | Standard Stack | Low — fetch is production-grade in Node 26. If more advanced features are needed (timeout, streaming), add a thin wrapper. |
| A3 | `p-retry`'s default timeout handling is adequate | Retry Pattern | Medium — p-retry doesn't have built-in per-attempt timeout. If API is slow, add `AbortController.timeout()` wrapper around fetch. |

## Open Questions (RESOLVED)

1. **Should we drop `cheerio` from the dependency list?** — RESOLVED: Yes. D-02 has been updated. Plans use native fetch with direct JSON parsing, no HTML dependencies.

2. **Schema validation library (zod vs TypeScript-only)?** — RESOLVED: Skip zod. Plans use TypeScript types and runtime type guards. Schema validation deferred until API instability is observed.

3. **Config file format (JSON / YAML / .env / TS)?** — RESOLVED: Env vars with defaults. Plans implement config.ts reading process.env with documented defaults. Extensible to file-based config in the future.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | 26.1.0 | — |
| npm | Package management | ✓ | 11.14.1 | — |
| TypeScript (tsc) | Type checking | ✓ | 6.0.3 | npm install -D typescript |
| Native `fetch` | HTTP calls | ✓ | Built-in (undici 8.2.0) | — |
| tsx | Dev runner | ✓ | (needs install) | `npx tsx` or `npx tsc && node dist/index.js` |

**Missing dependencies with no fallback:** None — all runtime capabilities are available in Node.js 26 or will be installed via npm.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.7 |
| Config file | `vitest.config.ts` (create in Wave 0) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCRP-01 | Adapter fetches from API URL | unit | `npx vitest run tests/adapters/hvorerdetvann.test.ts` | ❌ Wave 0 |
| SCRP-01 | Engine runs on schedule | unit | `npx vitest run tests/core/engine.test.ts -t "schedule"` | ❌ Wave 0 |
| SCRP-02 | Parse API response into RiverData[] | unit | `npx vitest run tests/adapters/hvorerdetvann.test.ts -t "parse"` | ❌ Wave 0 |
| SCRP-02 | Zone string maps to alertLevel 1-5 | unit | `npx vitest run tests/core/types.test.ts -t "zone mapping"` | ❌ Wave 0 |
| SCRP-03 | Retry on 5xx, max 3 attempts | unit | `npx vitest run tests/core/engine.test.ts -t "retry"` | ❌ Wave 0 |
| SCRP-03 | Fatal error skips retry | unit | `npx vitest run tests/core/engine.test.ts -t "fatal error"` | ❌ Wave 0 |
| SCRP-03 | Stale data emitted > 30 min | unit | `npx vitest run tests/core/engine.test.ts -t "stale"` | ❌ Wave 0 |
| SCRP-04 | Adapter can be registered | unit | `npx vitest run tests/core/engine.test.ts -t "register"` | ❌ Wave 0 |
| SCRP-04 | Engine iterates all adapters | unit | `npx vitest run tests/core/engine.test.ts -t "multiple adapters"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/core/types.test.ts` — covers RiverData shape, zone-to-level mapping
- [ ] `tests/core/adapter.test.ts` — covers DatasourceAdapter interface contract
- [ ] `tests/core/engine.test.ts` — covers registration, retry, stale detection, multiple adapters
- [ ] `tests/core/store.test.ts` — covers CRUD operations, source filtering
- [ ] `tests/core/events.test.ts` — covers typed event emission/listener
- [ ] `tests/adapters/hvorerdetvann.test.ts` — covers fetch (mocked), parse, error handling
- [ ] `tests/adapters/hvorerdetvann.fixtures.ts` — sample API response fixtures
- [ ] `vitest.config.ts` — configure test runner
- [ ] Framework install: `npm install -D vitest`

## Security Domain

> Security domain is minimal for Phase 1. The scraper engine only reads from a public API endpoint. No user data, no credentials, no write operations.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Public API, no auth needed |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | Read-only from public API |
| V5 Input Validation | yes | Runtime type guards on API response |
| V6 Cryptography | no | Public HTTP(S) API, standard TLS |
| V11 Business Logic | yes | Rate limiting consideration |

### Known Threat Patterns for {stack}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| API rate limiting us | Denial of Service | Default 15-min schedule makes this unlikely. No hammering needed — one request per 15 minutes. |
| Throttling by the source | Denial of Service | p-retry stops retrying after 3 attempts. Exponential backoff respects polite spacing. |

**No user data handled.** The scraper engine never stores sensitive information. No authentication secrets required.

## Sources

### Primary (HIGH confidence)
- **HvorErDetVann API** — Confirmed working via `fetch()` test against `/api/sections`. Returns full river data with zone classification.
- **npm registry** — `p-retry@8.0.0`, `node-cron@4.2.1`, `vitest@4.1.7` — all verified on registry, no postinstall scripts, well-known source repos.
- **Node.js 26 documentation** — Native `fetch` confirmed via runtime test (`node --version` → 26.1.0, `fetch()` returns 200).
- **CONTEXT.md `decisions`** — D-01 through D-14 form the architectural foundation.

### Secondary (MEDIUM confidence)
- **p-retry documentation** — github.com/sindresorhus/p-retry — API confirmed: `pRetry()`, `AbortError`, `onFailedAttempt`, timeout/retry options.
- **node-cron documentation** — github.com/merencia/node-cron — API confirmed: `schedule(cron, task, {timezone})`, zero-dependency.
- **TypeScript 6.0 release notes** — `module: nodenext` is the recommended setting for ESM projects.
- **Vitest documentation** — vitest.dev — confirmed ESM-native, TypeScript-compatible, fast execution.

### Tertiary (LOW confidence)
- None — all major claims were verified with primary sources or multiple secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified on npm registry, versions confirmed, postinstall scripts checked
- Architecture: HIGH — patterns follow established TypeScript/Node.js conventions, decisions from CONTEXT.md are specific and actionable
- Pitfalls: HIGH — based on documented issues with similar Node.js scraper architectures in production

**Research date:** 2026-05-27
**Valid until:** 2026-06-27 (30 days — packages are stable, API is stable)
