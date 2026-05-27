# Milestone v1.0 — Project Summary

**Generated:** 2026-05-27
**Purpose:** Team onboarding and project review

---

## 1. Project Overview

**Splash** is a web application that monitors river water levels. Users can save favorite rivers and receive alerts when water flow exceeds configurable thresholds tied to the site's five danger levels. Designed from the start to support multiple datasources and to be wrappable as a native iOS/Android app for push notifications.

**Core value:** Reliable river flow monitoring with timely alerts when water levels cross critical thresholds.

**Target users:** Outdoors enthusiasts, kayakers/rafters, property owners near rivers — anyone who needs to monitor river levels.

**Status:** Phase 1 (Scraper Engine) is complete. Phases 2 (Web UI) and 3 (Favorites & Alerts) are pending.

**Milestone scope:** All 4 plans executed, 44 tests passing, TypeScript compiles cleanly, real NVE HydAPI data flowing (7 stations), metadata import produces 132 river entries with grades.

## 2. Architecture & Technical Decisions

### Flow Data
- **Decision:** NVE HydAPI is the sole flow data source — NOT HvorErDetVann or nokken.net
  - **Why:** NVE provides an official REST API with structured discharge data (m³/s). The other sites are metadata sources only.
  - **Phase:** Phase 1 (D-03 in CONTEXT.md)

### Metadata Import
- **Decision:** Metadata import is a **one-time CLI bootstrap**, not a cron task
  - **Why:** River metadata (grades, descriptions, gauge URLs) changes infrequently. A scheduled re-scrape is deferred.
  - **Phase:** Phase 1 (D-03f)

### Language & Runtime
- **Decision:** TypeScript on Node.js (ESM, strict mode, nodenext module resolution)
  - **Why:** Web-first stack, consistent with future UI/alert phases, Capacitor mobile path.
  - **Phase:** Phase 1 (D-01)

### Scraping Tools
- **Decision:** Native `fetch` for JSON APIs (NVE HydAPI, HvorErDetVann), `cheerio` for nokken.net HTML
  - **Why:** Node.js 26 has built-in fetch via undici. nokken.net is server-rendered HTMX (not SPA) — cheerio is sufficient. No playwright needed.
  - **Phase:** Phase 1 (D-02, 01-04-RESEARCH.md)

### Scheduling
- **Decision:** `node-cron` with default every-15-min schedule, configurable via env vars
  - **Why:** Zero-dependency, standard cron expressions, timezone support.
  - **Phase:** Phase 1 (D-04)

### Error Handling
- **Decision:** Exponential backoff (base 2s, cap 60s), max 3 retries via `p-retry`, 30-min stale window
  - **Why:** Standard resilient pattern. Non-fatal errors (5xx, timeout) retry; fatal errors (TypeError, schema mismatch) trigger `AbortError` immediately.
  - **Phase:** Phase 1 (D-05, D-06, D-07)

### Data Model
- **Decision:** `RiverData` (in-memory flow observations) + `RiverEntry` (persisted metadata) as separate type systems
  - **Why:** Flow data is ephemeral (re-fetched every cycle); metadata is persistent and user-configurable. Different concerns.
  - **Phase:** Phase 1 (D-12, D-13)

### Persistence
- **Decision:** RiverRegistry persisted as JSON (`data/rivers.json`); flow data in-memory only
  - **Why:** Flow data needs no history in v1. JSON is simple, human-readable, and directly editable for debugging.
  - **Phase:** Phase 1 (D-14, D-15)

### Event System
- **Decision:** Typed `ScraperEventBus` wrapping Node.js `EventEmitter` with `data-update`, `error`, `stale`, `status-change` events
  - **Why:** Loose coupling between scraper engine and future UI layer. TypeScript generics ensure type safety.
  - **Phase:** Phase 1 (D-16)

### Station ID Systems
- **Decision:** NVE uses a single dotted station ID format (e.g., `2.479.0`) across all systems
  - **Why:** Corrected finding — earlier research incorrectly claimed HydAPI used integer IDs separate from the dotted system. The HydAPI `StationId` parameter accepts dotted strings. All three systems (NVE HydAPI, nokken.net, HvorErDetVann) share the same dotted ID format.
  - **Phase:** Phase 1 (corrected 2026-05-27 via live API testing)

### NVE Parameter Codes
- **Decision:** Parameter `1001` = Discharge (m³/s), NOT `1000`
  - **Why:** Confirmed via NVE `/api/v1/Parameters` endpoint. Parameter 1000 = Stage (meters), 1001 = Discharge (m³/s). Earlier research had these swapped.
  - **Phase:** Phase 1 (corrected 2026-05-27)

### nokken.net Architecture
- **Decision:** nokken.net is HTMX + FastAPI (server-rendered HTML), NOT an SPA
  - **Why:** Pages at `/river/{id}` and `/section/{id}` contain full HTML. Section pages have `.grade-chip` (grade), `.mono` (station ID). River pages have embedded JSON with section IDs.
  - **Phase:** Phase 1 research (01-04-RESEARCH.md)

### NVE Adapter Design
- **Decision:** Batch all station IDs in one comma-separated request, not N+1 requests
  - **Why:** NVE HydAPI accepts multiple station IDs separated by commas. Reduces HTTP round-trips from N to 1. Response field is `observations` (not `observervations` — fixed typo).
  - **Phase:** Phase 1 (corrected 2026-05-27)

## 3. Phases Delivered

| Phase | Name | Status | One-Liner |
|-------|------|--------|-----------|
| 1 | Scraper Engine | Complete | Fetch discharge from NVE HydAPI, merge metadata from nokken.net and HvorErDetVann, persist river registry, handle errors with retry and stale detection |
| 2 | Web UI | Planned | Responsive dashboard and river detail views (pending) |
| 3 | Favorites & Alerts | Planned | Personal rivers list with threshold-based alerts (pending) |

### Plan Breakdown for Phase 1

| Plan | Name | Status | What It Delivered |
|------|------|--------|-------------------|
| 01-01 | Foundation | Complete | package.json, tsconfig.json, vitest.config.ts, core types (RiverData, RiverEntry, AlertLevel, RiverStatus), DatasourceAdapter interface, ScraperConfig with env var fallbacks, NVE fixtures |
| 01-02 | Building Blocks | Complete | FlowStore (in-memory), ScraperEventBus (typed events), RiverRegistry (JSON persistence), NveHydApiAdapter (fetch + parse + alert level computation) |
| 01-03 | Orchestration | Complete | ScraperEngine (p-retry wrapper, stale detection, registry integration, adapter lifecycle), entry point (cron, graceful shutdown, immediate first run) |
| 01-04 | Metadata Import | Complete | HvorErDetVann metadata scraper (native fetch, 103 entries), nokken.net metadata scraper (cheerio, section page scraping, 175 section entries), MetadataMerger (dedup by station ID, 132 merged entries), import CLI (`npm run import`) |

## 4. Requirements Coverage

| Req | Description | Status | Phase |
|-----|-------------|--------|-------|
| SCRP-01 | Fetch water level data from NVE HydAPI on schedule | ✅ Complete | 1 |
| SCRP-02 | Parse river name, current level, and five-level scale position | ✅ Complete | 1 |
| SCRP-03 | Handle failures gracefully (retry, stale fallback, error state) | ✅ Complete | 1 |
| SCRP-04 | Pluggable adapter pattern for datasources | ✅ Complete | 1 |
| FAV-01 | User can add rivers to favorites list | ❌ Pending | 3 |
| FAV-02 | User can remove rivers from favorites | ❌ Pending | 3 |
| FAV-03 | Favorites persist across page reloads | ❌ Pending | 3 |
| ALRT-01 | User can set per-river alert threshold | ❌ Pending | 3 |
| ALRT-02 | In-app notification when threshold crossed | ❌ Pending | 3 |
| ALRT-03 | User can dismiss active alerts | ❌ Pending | 3 |
| UI-01 | Dashboard showing all favorited rivers | ❌ Pending | 2 |
| UI-02 | River detail page with level, scale, and alert config | ❌ Pending | 2 |
| UI-03 | Responsive and mobile-usable UI | ❌ Pending | 2 |
| UI-04 | Architecture wrappable via WebView/Capacitor | ❌ Pending | 2 |

**v1 completion:** 4/14 requirements met (Scraping phase only).

## 5. Key Decisions Log

| ID | Decision | Phase | Rationale |
|----|----------|-------|-----------|
| D-01 | TypeScript on Node.js | 1 | Web-first stack, consistent with UI/alert phases, Capacitor mobile path |
| D-02 | Native fetch for JSON, cheerio for nokken.net HTML | 1 | Node.js 26 has built-in fetch. nokken.net is server-rendered HTMX. |
| D-03 | NVE HydAPI sole flow source | 1 | Official API with structured data. Other sites are metadata-only. |
| D-03a | Parameter 1001 = Discharge (m³/s), NOT 1000 | 1-R | Corrected via live API testing. Param 1000 = Stage (m). |
| D-03b | NVE API key via X-API-Key header, graceful skip | 1 | Free registration, adapter returns empty when missing |
| D-03f | Metadata import is one-time CLI | 1 | River metadata changes infrequently. No cron needed. |
| D-04 | node-cron for scheduling | 1 | Zero-dependency, standard cron expressions, timezone support |
| D-05 | Exponential backoff (base 2s, cap 60s, 3 retries) | 1 | Standard resilient pattern via p-retry |
| D-06 | 30-minute stale-data window | 1 | Prevents serving outdated data silently |
| D-07 | Non-fatal retry, fatal AbortError | 1 | TypeError/schema mismatch → abort immediately |
| D-08 | Error state in data model | 1 | Enables Phase 2 UI to surface errors |
| D-09/D-11 | DatasourceAdapter with fetch() returning RiverData[] | 1 | Clean contract, no raw JSON leak. parse() internalized per adapter. |
| D-10 | Adapters registered via engine.register() | 1 | Simple registration. Dynamic loading deferred. |
| D-12 | RiverData with required stationId, unit | 1 | Normalized data contract across sources |
| D-13 | RiverEntry in river registry | 1 | Separates persistent metadata from ephemeral flow data |
| D-14 | RiverRegistry persisted to data/rivers.json | 1 | JSON is simple, human-readable, directly editable |
| D-15 | FlowStore is in-memory only | 1 | No historical data needed in v1 |
| D-16 | Typed ScraperEventBus | 1 | Loose coupling with future UI layer |
| — | Dotted NVE IDs shared across all systems | 1-R | Corrected finding — HydAPI, nokken.net, HvorErDetVann all use dotted IDs |
| — | Batch comma-separated station IDs, not N+1 | 1 | NVE accepts multiple IDs in one request. Reduces HTTP calls. |
| — | Scrape section pages for grade + station ID | 1 | River pages don't contain section cards (HTMX dynamic load). Section pages have both. |

## 6. Tech Debt & Deferred Items

### Implementation Gaps
- **29 rivers without grades** — rivers that exist only on HvorErDetVann (no nokken.net listing). Grades can't be sourced.
- **NVE API rate limiting** — station 1400 and 1800 hit 429 on the first run. Batch request reduces this, but a single request for all stations may still be throttled. Consider spreading if issues persist.
- **Hardcoded alert thresholds** — per-station thresholds need validation against real data. Will be tuned via admin page in Phase 2.
- **nokken-metadata test fixtures** — scraper uses real nokken.net pages for testing. Test file exists but lacks fixture data.
- **Station overlap with HydAPI** — not all stations with discharge data returned from NVE are in the river registry. The registry has 132 entries; HydAPI returned data for 7 out of 10 default IDs. Need to align them.

### Deferred (architectural decisions parked for later)
- **Admin page for river CRUD** — scoped to Phase 1.5/Phase 2. Current river entries are managed via `data/rivers.json` directly.
- **Automated metadata re-scrape** — metadata import is one-time bootstrap. Periodic re-scrape to catch updates deferred.
- **Historical flow storage** — flow data is in-memory only. Storing historical levels for trend viewing deferred to v2.
- **Push notifications** — requires native mobile wrapper. Phase 3 covers in-app alerts only; push deferred to v2+.
- **Schema validation library (zod)** — deferred until API instability observed. TypeScript types + runtime guards suffice for now.

### Corrections Made During Development
- **Parameter codes swapped** — research claimed Parameter 1000 = discharge, 1001 = stage. Reality: 1000 = stage, 1001 = discharge. Fixed in adapter.
- **Station ID format** — research claimed HydAPI uses integer IDs separate from dotted system. Reality: all use dotted strings. Fixed in adapter.
- **Response field name** — `observervations` (typo) → `observations`. Fixed.
- **nokken.net architecture** — initially thought to be SPA, confirmed as server-rendered HTMX. Scraper uses cheerio.
- **Section card discovery** — `.sec-card` class doesn't exist in river page HTML. Sections are loaded via HTMX. Fixed by parsing embedded JSON and scraping section pages.

## 7. Getting Started

### Run the project
```bash
npm install                    # Install dependencies
export NVE_API_KEY="your-key"  # Set NVE API key (free at hydapi.nve.no)
npx tsx src/index.ts           # Start the scraper engine
npm run import                 # One-time metadata import from both sites
```

### Key directories
| Path | Purpose |
|------|---------|
| `src/core/` | Core types, interfaces, engine, store, events, registry |
| `src/adapters/` | Datasource adapter implementations (currently NVE only) |
| `src/import/` | Metadata import scrapers, merger, and CLI |
| `tests/` | Vitest test suite |
| `data/` | Persisted river registry (132 river entries) |
| `.planning/` | Project roadmap, requirements, state, phase artifacts |

### Tests
```bash
npm test                       # Run all tests (44 tests, vitest verbose)
npx tsc --noEmit               # TypeScript type check
```

### Where to look first
1. **`src/core/types.ts`** — central data model (`RiverData`, `RiverEntry`, `AlertLevel`, `RiverStatus`)
2. **`src/core/adapter.ts`** — `DatasourceAdapter` interface contract
3. **`src/adapters/nve.ts`** — first and only flow data adapter (NVE HydAPI, Parameter=1001, batch comma-separated IDs)
4. **`src/core/engine.ts`** — orchestrator tying adapters, store, events, and registry together
5. **`src/index.ts`** — application entry point with cron scheduling
6. **`src/import/cli.ts`** — metadata import pipeline entry point

### Extension points
- **New flow datasource:** implement `DatasourceAdapter` interface, register with `engine.register()`
- **New metadata source:** add a scraper class returning `Partial<RiverEntry>[]`, pass to `MetadataMerger.merge()`

---

## Stats

- **Timeline:** 2026-05-27 19:42 → 2026-05-27 22:17 (commits + live session debugging)
- **Phases:** 1 complete / 3 total (Phase 1: Scraper Engine ✅, Phase 2: Web UI ⏳, Phase 3: Favorites & Alerts ⏳)
- **Plans executed:** 4/4 (Phase 1)
- **Commits:** 9 (planning artifacts); source code (~1,410 lines across 21 files) pending commit
- **Source files:** 13 TypeScript files in `src/`, 9 test files in `tests/`
- **Lines of code:** 1,410 total (source + tests)
- **Tests:** 44 passing across 7 test files
- **TypeScript:** Compiles cleanly with strict mode and nodenext resolution
- **Contributors:** 1
- **River registry:** 132 entries (103 with grades, all with station IDs)
- **Active data sources:** NVE HydAPI (7 stations returning discharge), nokken.net (175 sections scraped), HvorErDetVann (103 sections scraped)

---

*Generated from: PROJECT.md, ROADMAP.md, REQUIREMENTS.md, STATE.md, CONTEXT.md, RESEARCH.md, 01-04-RESEARCH.md, plans 01-01 through 01-04, source code analysis, and live API testing.*
