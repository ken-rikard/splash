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
## User Constraints (from CONTEXT.md — Session 2 Update)

### Locked Decisions
- **D-01:** TypeScript on Node.js
- **D-02:** Native `fetch` for JSON APIs; nokken.net SPA approach deferred to research
- **D-03:** NVE HydAPI is the sole flow data source (parameter 1000, resolutionTime 1440)
- **D-03a:** NVE codes: 1000=discharge, 1001=stage, 1003=temperature
- **D-03b:** NVE API key via X-API-Key header, free registration, graceful skip
- **D-03d:** HvorErDetVann scraped for metadata (not flow)
- **D-03e:** nokken.net scraped for kayak grades, descriptions, guides
- **D-03f:** Metadata import is one-time CLI, not cron
- **D-04:** node-cron, default every 15 min
- **D-05:** Exponential backoff (base 2s, cap 60s, max 3)
- **D-06:** Stale-data window: 30 min
- **D-07:** Non-fatal (5xx/timeout) retry; fatal (TypeError/schema) AbortError
- **D-08:** Error state in data model for Phase 2 UI
- **D-09/D-11:** DatasourceAdapter with fetch(): Promise<RiverData[]>
- **D-10:** Adapters registered via engine.register()
- **D-12:** RiverData with required stationId, unit, source="nve"
- **D-13/D-14:** RiverRegistry persisted to data/rivers.json
- **D-15:** FlowStore is in-memory only
- **D-16:** Typed ScraperEventBus
- **D-17/D-18/D-19:** Admin page for CRUD on river entries

### Agent's Discretion
- Schedule config format (env var vs config file)
- Testing framework (vitest)
- nokken.net scraping approach (cheerio vs XHR reverse-engineering vs playwright)

### Deferred (OUT OF SCOPE)
- Push notifications (v2+)
- Historical flow storage (v2)
- Custom datasource UI (v2)
- Automated re-scrape of metadata
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCRP-01 | System fetches flow data from NVE HydAPI on a configurable schedule | NVE HydAPI `/api/v1/Observations` with StationId, Parameter=1000, ResolutionTime=1440. `node-cron` handles scheduling. Native `fetch` with `p-retry` for resilient HTTP. |
| SCRP-02 | System parses NVE observation data into RiverData objects with station ID, unit, and alert level | NVE returns `stationId`, `stationName`, `observervations[].value` (m³/s). Alert level computed from hardcoded thresholds or fallback distribution. |
| SCRP-03 | System handles failures gracefully (retry, stale-data fallback, user-visible error) | `p-retry` with exponential backoff; stale-data window via timestamp comparison; `status: 'ok' | 'stale' | 'error'` in RiverData model. Adapter skips gracefully if API key missing. |
| SCRP-04 | Datasources are implemented via pluggable adapters | `DatasourceAdapter` interface with `fetch()` in `src/core/adapter.ts`. `NveHydApiAdapter` as first implementation. Metadata import uses separate MetadataImporter pattern. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Flow data fetching (NVE API) | Backend / Service | — | Node.js cron, native fetch + p-retry |
| Flow data parsing | Backend / Service | — | NVE JSON → typed RiverData |
| Flow scrape scheduling | Backend / Service | — | node-cron, configurable |
| Retry / error handling | Backend / Service | — | p-retry manages retries |
| FlowStore (in-memory) | Backend / Service | — | Map<id, RiverData> |
| RiverRegistry (persistent) | Backend / Service | — | data/rivers.json read/write |
| Event emission | Backend / Service | — | Typed EventEmitter for UI |
| Adapter registration | Backend / Service | — | Engine.register(adapter) |
| Metadata scraping | CLI / One-time | — | npx tsx src/import/cli.ts |
| Metadata dedup + merge | CLI / One-time | — | MetadataMerger by stationId |
| Admin page (CRUD rivers) | Web UI | — | Phase 1.5 / Phase 2 |

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
        NVE[("NVE HydAPI\n/api/v1/Observations")]
        HVOR[("hvorerdetvann.com\n/api/sections")]
        NOKKEN[("nokken.net\n(SPA)")]
    end

    subgraph "Flow Engine (Node.js Process, cron)"
        direction TB
        CRON["node-cron\nSchedule (every 15min)"]
        EN["ScraperEngine\nOrchestrator"]
        AD["NveHydApiAdapter\n(fetch + parse)"]
        FS[("FlowStore\nMap<id, RiverData>\nIn-memory only")]
        EE["EventEmitter\nTyped events"]
        CF["Config\n(schedule, retry,\nstale window, NVE_API_KEY)"]
        REG["RiverRegistry\n(data/rivers.json)"]

        CRON -->|triggers| EN
        EN -->|reads station IDs| REG
        EN -->|calls| AD
        AD -->|fetch + p-retry| NVE
        NVE -->|JSON| AD
        AD -->|RiverData[]| EN
        EN -->|stores| FS
        EN -->|emits| EE
    end

    subgraph "Metadata Import (CLI, one-time)"
        CLI["npx tsx src/import/cli.ts"]
        MS1["HvorErDetVann\nMetadataScraper"]
        MS2["NokkenNet\nMetadataScraper"]
        MM["MetadataMerger\n(dedup by stationId)"]

        CLI -->|scrape| MS1
        CLI -->|scrape| MS2
        MS1 --> HVOR
        MS2 --> NOKKEN
        MS1 -->|Partial<RiverEntry>[]| MM
        MS2 -->|Partial<RiverEntry>[]| MM
        MM -->|RiverEntry[]| REG
    end

    subgraph "Phase 2 Consumer"
        UI["Web UI"]
        ADMIN["Admin Page\n(CRUD rivers)"]
        EE -->|data-update / error / stale| UI
        FS -->|read| UI
        REG -->|read/write| ADMIN
    end

    style NVE fill:#f96
    style HVOR fill:#f96
    style NOKKEN fill:#f96
    style CLI fill:#9c9
    style ADMIN fill:#6cf
```

### Recommended Project Structure

```
splash/
├── package.json              # "type": "module", scripts, dependencies
├── tsconfig.json             # module: nodenext, strict: true
├── data/
│   └── rivers.json           # River registry (created by import CLI)
├── src/
│   ├── index.ts              # Entry point: instantiate and start engine
│   ├── config.ts             # Schedule, retry, stale-window, NVE_API_KEY
│   ├── core/
│   │   ├── types.ts          # RiverData, RiverEntry, ScraperStatus, AlertLevel
│   │   ├── adapter.ts        # DatasourceAdapter interface
│   │   ├── engine.ts         # ScraperEngine — orchestrator
│   │   ├── store.ts          # FlowStore — in-memory Map<id, RiverData>
│   │   ├── events.ts         # Typed event emitter (ScraperEventBus)
│   │   └── river-registry.ts # RiverRegistry — persisted CRUD
│   ├── adapters/
│   │   └── nve.ts            # NveHydApiAdapter implementation
│   └── import/
│       ├── cli.ts            # Metadata import CLI entry point
│       ├── metadata-merger.ts # Cross-source dedup and merge
│       ├── hvorerdetvann-metadata.ts # HvorErDetVann metadata scraper
│       └── nokken-metadata.ts # nokken.net metadata scraper
├── tests/
│   ├── core/
│   │   ├── types.test.ts
│   │   ├── adapter.test.ts
│   │   ├── engine.test.ts
│   │   ├── store.test.ts
│   │   ├── events.test.ts
│   │   └── river-registry.test.ts
│   ├── adapters/
│   │   ├── nve.test.ts
│   │   └── nve.fixtures.ts
│   └── import/
│       ├── metadata-merger.test.ts
│       ├── hvorerdetvann-metadata.test.ts
│       └── nokken-metadata.test.ts
└── vitest.config.ts
```

### Pattern 1: DatasourceAdapter Interface

**What:** Pluggable adapter interface separating data source interaction from the engine. Each datasource implements `fetch()` — the engine only knows the contract.

**When to use:** For flow data sources. Metadata uses a separate MetadataImporter pattern.

**Example:**
```typescript
// Source: Based on D-09/D-10/D-11 from CONTEXT.md (Session 2)

// src/core/types.ts
export type AlertLevel = 1 | 2 | 3 | 4 | 5;
export type RiverStatus = 'ok' | 'stale' | 'error';

export interface RiverData {
  id: string;                  // unique, e.g. "nve:1000"
  name: string;                // human-readable river name
  source: string;              // always "nve" for flow data
  stationId: string;           // NVE station ID (required)
  currentLevel: number | null; // discharge in m³/s
  unit: string;                // always "m³/s"
  alertLevel: AlertLevel;      // 1-5 five-level scale
  lastUpdated: Date;
  status: RiverStatus;
  error?: string;
}

export interface RiverEntry {
  id: string;                  // "nve:1000"
  stationId: string;           // NVE station ID
  name: string;
  alternateNames: string[];
  grade: string;               // kayak/rafting difficulty, e.g. "III-IV"
  description: string;
  guideUrl?: string;
  dangerLevels: number[];      // 5-level thresholds in m³/s
  enabled: boolean;
  sources: string[];           // e.g. ["nokken", "hvorerdetvann"]
}

// src/core/adapter.ts
export interface DatasourceAdapter {
  readonly sourceId: string;
  fetch(): Promise<RiverData[]>;
}

// src/adapters/nve.ts
import { DatasourceAdapter, RiverData } from '../core/adapter.js';
import { nveApiKey } from '../config.js';

const STATION_IDS = [1000, 1100, 1200, 1300, 1400]; // known NVE stations

export class NveHydApiAdapter implements DatasourceAdapter {
  readonly sourceId = 'nve';
  private baseUrl = 'https://hydapi.nve.no/api/v1/Observations';
  private apiKey = nveApiKey();

  async fetch(): Promise<RiverData[]> {
    if (!this.apiKey) {
      console.warn('NVE_API_KEY not configured — skipping');
      return [];
    }
    const results = await Promise.allSettled(
      STATION_IDS.map(id => this.fetchStation(id))
    );
    return results
      .filter((r): r is PromiseFulfilledResult<RiverData> => r.status === 'fulfilled')
      .map(r => r.value);
  }

  private async fetchStation(stationId: number): Promise<RiverData> {
    const url = `${this.baseUrl}?StationId=${stationId}&Parameter=1000&ResolutionTime=1440`;
    const res = await fetch(url, {
      headers: { 'X-API-Key': this.apiKey!, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`NVE responded ${res.status} for station ${stationId}`);
    const data = await res.json();
    const station = data?.data?.[0];
    if (!station?.observervations?.length) throw new Error(`No obs for station ${stationId}`);
    const lastObs = station.observervations[station.observervations.length - 1];
    return {
      id: `nve:${stationId}`,
      name: station.stationName,
      source: 'nve',
      stationId: String(stationId),
      currentLevel: lastObs.value,
      unit: 'm³/s',
      alertLevel: computeAlertLevel(stationId, lastObs.value),
      lastUpdated: new Date(lastObs.time),
      status: 'ok',
    };
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

**What:** Wrapper around Node.js `EventEmitter` with typed event map.

**When to use:** For all events from the engine to the UI layer (Phase 2).

**Example:**
```typescript
// Source: D-16 from CONTEXT.md, Node.js EventEmitter docs

import { EventEmitter } from 'node:events';
import { RiverData } from './types.js';

export interface ScraperStatus {
  lastFetch: Date | null;
  status: 'idle' | 'fetching' | 'ok' | 'error';
  error?: string;
}

export interface ScraperEventMap {
  'data-update': (rivers: RiverData[]) => void;
  'error': (error: Error) => void;
  'stale': (since: Date) => void;
  'status-change': (status: ScraperStatus) => void;
}

export class ScraperEventBus {
  private emitter = new EventEmitter();
  on<K extends keyof ScraperEventMap>(event: K, listener: ScraperEventMap[K]): this {
    this.emitter.on(event, listener as (...args: unknown[]) => void);
    return this;
  }
  emit<K extends keyof ScraperEventMap>(event: K, ...args: Parameters<ScraperEventMap[K]>): boolean {
    return this.emitter.emit(event, ...args);
  }
  removeListener<K extends keyof ScraperEventMap>(event: K, listener: ScraperEventMap[K]): this {
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
// src/index.ts — with RiverRegistry and NveHydApiAdapter

import nodeCron from 'node-cron';
import { ScraperEngine } from './core/engine.js';
import { NveHydApiAdapter } from './adapters/nve.js';
import { RiverRegistry } from './core/river-registry.js';
import { defaultConfig } from './config.js';

const config = defaultConfig();
const registry = new RiverRegistry();
const engine = new ScraperEngine(config, registry);
engine.register(new NveHydApiAdapter());

engine.eventBus.on('data-update', (rivers) => {
  console.log(`Updated ${rivers.length} rivers`);
});

// Start scheduled scraping
nodeCron.schedule(config.schedule, () => {
  engine.scrapeAll();
}, { timezone: config.scheduleTimezone });

// Run once immediately on startup
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
| Req ID | Behavior | Test Type | Automated Command | Plan |
|--------|----------|-----------|-------------------|------|
| SCRP-01 | NVE adapter fetches from NVE HydAPI | unit | `npx vitest run tests/adapters/nve.test.ts -t "returns RiverData"` | 01-02 |
| SCRP-01 | Engine runs on schedule | unit | `npx vitest run tests/core/engine.test.ts -t "scrapeAll"` | 01-03 |
| SCRP-01 | Adapter skips gracefully without API key | unit | `npx vitest run tests/adapters/nve.test.ts -t "no key"` | 01-02 |
| SCRP-02 | Parse NVE observation into RiverData with stationId | unit | `npx vitest run tests/adapters/nve.test.ts -t "shape"` | 01-02 |
| SCRP-02 | Alert level computed from thresholds | unit | `npx vitest run tests/adapters/nve.test.ts -t "alertLevel"` | 01-02 |
| SCRP-03 | Retry on 5xx, max 3 attempts | unit | `npx vitest run tests/core/engine.test.ts -t "retry"` | 01-03 |
| SCRP-03 | Fatal error (TypeError) skips retry | unit | `npx vitest run tests/core/engine.test.ts -t "fatal"` | 01-03 |
| SCRP-03 | Stale data emitted > 30 min | unit | `npx vitest run tests/core/engine.test.ts -t "stale"` | 01-03 |
| SCRP-04 | NveHydApiAdapter implements DatasourceAdapter | unit | `npx vitest run tests/adapters/nve.test.ts -t "implements"` | 01-02 |
| SCRP-04 | MetadataMerger deduplicates by station ID | unit | `npx vitest run tests/import/metadata-merger.test.ts` | 01-04 |
| N/A | RiverRegistry persists to data/rivers.json | unit | `npx vitest run tests/core/river-registry.test.ts` | 01-02 |

### Sampling Rate
- **Per plan execution:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Test Files by Plan
| Plan | Test Files |
|------|-----------|
| 01-01 | types.test.ts, adapter.test.ts, nve.fixtures.ts, hvorerdetvann.fixtures.ts |
| 01-02 | store.test.ts, events.test.ts, river-registry.test.ts, nve.test.ts |
| 01-03 | engine.test.ts |
| 01-04 | metadata-merger.test.ts, hvorerdetvann-metadata.test.ts, nokken-metadata.test.ts |

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

---

## Updated Findings (2026-05-27 Session 2)

### NVE HydAPI — Primary Flow Data Source

**Endpoint:** `https://hydapi.nve.no/api/v1/Observations`
**Auth:** `X-API-Key` header, free registration at https://hydapi.nve.no/User/Account/Register
**License:** NLOD 2.0 / CC BY 3.0 — free to use with attribution
**Swagger:** `https://hydapi.nve.no/swagger/v1/swagger.json`

Key parameters:
| Parameter | Value | Meaning |
|-----------|-------|---------|
| Parameter | 1000 | Water stage (vannstand) in meters |
| Parameter | 1001 | Discharge (vannføring) in m³/s ⬅️ THIS IS WHAT WE WANT |
| Parameter | 1003 | Water temperature |
| ResolutionTime | 1440 | Daily |
| ResolutionTime | 60 | Hourly |
| ResolutionTime | 0 | Raw/instantaneous |

⚠️ **Parameter code correction (2026-05-27):** Earlier research had these swapped. Parameter 1000 = Stage (m), Parameter 1001 = Discharge (m³/s). Confirmed via `/api/v1/Parameters` endpoint.

**⚠️ StationId format:** The `StationId` query parameter is a **string** in dotted NVE format (e.g., `"6.10.0"`), NOT an integer. Multiple comma-separated IDs are accepted in a single request. The response `stationId` field is also a string. The response field is `observations` (not `observervations`).

**Response shape:**
```json
{
  "data": [{
    "stationId": "6.9.0",
    "stationName": "Akerselva, ndf. Maridalsvatn",
    "parameter": 1001,
    "parameterName": "Vannføring",
    "parameterNameEng": "Discharge",
    "method": "Mean",
    "unit": "m³/s",
    "observations": [
      { "value": 1.438465, "time": "2026-05-27T11:00:00Z", "correction": 0, "quality": 1 }
    ]
  }]
}
```

**Key finding:** Requires free API key. Returns 401 without it. The adapter must handle missing key gracefully (skip with warning).

### nokken.net — Metadata Source (HTMX + FastAPI, NOT SPA)

**Finding:** nokken.net is **server-rendered HTMX** (FastAPI backend), NOT a client-rendered SPA. All content is in the initial HTML. Pages at `/rivers`, `/river/{id}`, and `/section/{id}` contain full HTML with metadata.

**NVE station IDs** are found in `.mono` elements within gauge info cards on section pages (e.g., `151.15.0`).
**Grades** are found in `.grade-chip` spans (e.g., "Grade IV+").
**Section/river names** are in `<h1>` elements.

**Scraping approach:** `cheerio` for HTML parsing. No playwright needed.

### nokken.net — Example Rivers (known NVE section IDs from metadata research)

Popular kayaking rivers on nokken.net (these are nokken section IDs, not NVE station IDs):
- Drammenselva, Glomma, Numedalslågen, Sjoa, Vossa, Driva, Nidelva, Orkla

### HvorErDetVann — Metadata Source

The `/api/sections` endpoint returns river metadata useful for the registry:
- `section.name` — river name
- `section.limits` — 5-level danger zone boundaries (maps to dangerLevels in RiverEntry)
- Section ID — may map to NVE station IDs (needs verification in research)

The endpoint does NOT return kayak grades, descriptions, or guide URLs — that metadata must come from nokken.net or individual river pages on HvorErDetVann.

### Cross-Source Deduplication Strategy

Both sites source data from NVE. The deduplication key is the dotted NVE station ID:
1. **HvorErDetVann:** Extract dotted NVE station ID from `gauge.url` path (e.g., `6.9.0` from `.../station/6.9.0`)
2. **nokken.net:** Extract dotted NVE station ID from `.mono` element (e.g., `151.15.0`)
3. **Merge:** Group by dotted NVE station ID, take richest metadata from each source (nokken for grades/descriptions, HvorErDetVann for danger levels)
4. **NVE HydAPI:** Uses the same dotted station ID system. Parameter=1001 for discharge.

⚠️ **Station ID correction (2026-05-27):** Earlier research claimed HydAPI uses integer IDs separate from the dotted system. This was WRONG. The HydAPI `StationId` query parameter accepts dotted IDs (e.g., `"6.9.0"`). Both metadata sites and the flow API share the same ID system.

### Architecture Changes from Session 1

| Area | Session 1 Decision | Session 2 Updated Decision |
|------|-------------------|---------------------------|
| Flow source | HvorErDetVann /api/sections (primary) | NVE HydAPI (sole flow source) |
| HvorErDetVann role | Flow data adapter | Metadata source only |
| nokken.net role | Not a datasource | Metadata source for grades/descriptions |
| Data persistence | None (in-memory only) | RiverRegistry at data/rivers.json |
| Flow data model | source optional, stationId optional | source always "nve", stationId required |
| Metadata model | Not defined yet | RiverEntry with grade, description, guideUrl, dangerLevels, enabled |
| Adapter interface | DatasourceAdapter for all sources | DatasourceAdapter for flow only; MetadataImporter pattern for metadata |
| Admin page | Phase 2 concept | Phase 1.5 — CRUD for river entries |

### Updated Dependency List

**No new dependencies from Session 1.** The same stack applies:
- p-retry, node-cron, vitest, tsx, TypeScript

Potentially needed for metadata scraping (Plan 01-04 research):
- **cheerio** — if nokken.net has metadata in HTML
- **playwright** — if nokken.net requires client-side rendering to access metadata
- Both are deferred to research — may not be needed if internal API endpoints are found.
