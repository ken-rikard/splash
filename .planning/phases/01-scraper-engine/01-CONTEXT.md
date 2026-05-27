# Phase 1: Scraper Engine - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

**Flow data** — fetch discharge (m³/s) from NVE HydAPI, structure into typed river objects with alert level, handle failures with retry and stale-data fallback. NVE HydAPI is the sole flow datasource (free REST API, ~1800 stations, requires free API key).

**Metadata import** — scrape river metadata (kayak/rafting grades, descriptions, guides) from nokken.net and hvorerdetvann.com as a one-time bootstrap operation. Both sites carry this metadata alongside NVE-backed flow data.

**River registry** — persisted list of known rivers with metadata. Deduplicated by NVE station ID across both sites.

**Admin page** — Phase 2 UI for viewing, editing, adding, and deleting river entries in the registry.

**Requirements:** SCRP-01 (fetch), SCRP-02 (parse), SCRP-03 (error handling), SCRP-04 (adapter pattern)
**Success criteria:** 5 (flow fetch + parse, metadata import, river registry + persistence, error resilience, pluggable adapter)
</domain>

<decisions>
## Implementation Decisions

### Language & Runtime
- **D-01:** TypeScript on Node.js — aligns with web-first stack, Capacitor mobile path, consistent with UI and alert phases. No build-tool concessions needed for scraping.

### Scraping Approach — Flow Data
- **D-02:** Native `fetch` (Node.js 26 built-in, undici 8.x) for HTTP — NVE HydAPI and HvorErDetVann API return JSON. nokken.net may need cheerio or XHR reverse-engineering (deferred to research).
- **D-03:** **NVE HydAPI** (`/api/v1/Observations`) is the **sole flow data source**. Request discharge (parameter 1000) at daily resolution (resolutionTime 1440) for known station IDs from the river registry.
- **D-03a:** NVE HydAPI parameter codes: **1000=water stage (m)**, **1001=discharge (m³/s)** — ⚠️ use Parameter=1001 for flow data. 1003=water temperature (°C). Resolution: 0=raw, 60=hourly, 1440=daily. (Corrected 2026-05-27: earlier version had 1000/1001 swapped.)
- **D-03b:** NVE HydAPI requires an API key via the `X-API-Key` header. Registration is free at NVE's hydrology API portal. The key is configured via environment variable `NVE_API_KEY`. If missing, the NVE adapter skips with a logged warning.

### Scraping Approach — Metadata Import
- **D-03d:** **HvorErDetVann** is scraped for metadata (not flow). Its `/api/sections` JSON returns river names, zone levels, and limits — used to discover rivers and their alert-level structure.
- **D-03e:** **nokken.net** is scraped for kayak/rafting metadata: river grades, descriptions, guides, and difficulty. The site is an SPA — scraping approach (cheerio vs XHR reverse-engineering) is deferred to research.
- **D-03f:** Metadata import is a **one-time bootstrap CLI** (not a cron task). It auto-discovers all rivers from both sites, deduplicates by NVE station ID, and writes the river registry to `data/rivers.json`.
- **D-03g:** No metadata adapter implements `DatasourceAdapter` — metadata scraping uses a separate `MetadataImporter` interface since it's a one-shot operation with different semantics (discovery, enrichment, merge).

### Scheduling
- **D-04:** `node-cron` with configurable cron expression (default: every 15 minutes). No external scheduler dependency. Phase 1 scrapes on schedule; the schedule config flows from environment/config file.

### Error Handling & Retry
- **D-05:** Exponential backoff (base 2s, cap 60s), max 3 retries per scrape cycle.
- **D-06:** Stale-data window: 30 minutes. If last successful fetch > 30 min ago, emit a "stale" status rather than serving old data silently.
- **D-07:** Non-fatal errors (timeout, 5xx) retry silently. Fatal errors (invalid HTML structure, schema mismatch) skip to error state immediately.
- **D-08:** Error state is published as part of the data model so Phase 2's UI can surface it to the user.

### Adapter Interface Design
- **D-09:** A `DatasourceAdapter` interface/abstract class with two methods:
  - `fetch(): Promise<RiverData[]>` — fetches raw data from the source
  - `parse(raw: unknown): RiverData[]` — transforms raw input into typed river objects
- **D-10:** Adapters are registered via a `ScraperEngine.register(adapter)` call. The engine iterates all registered adapters and emits a consolidated resultset.
- **D-11:** The adapter contract returns typed `RiverData[]` — no raw HTML/JSON leaks past the parser boundary.
  - **Deviation (research-recommended):** `parse()` is internalized within each adapter implementation rather than on the interface. The `DatasourceAdapter` interface exposes only `fetch(): Promise<RiverData[]>`. Each adapter internally transforms its source format. This simplifies the contract while maintaining strict typing boundaries. If a future use case requires shared parsing logic, `parse()` can be promoted to the interface at that point.

### Data Model — Flow Data
- **D-12:** Core `RiverData` interface (flow observations):
  - `id: string` (unique, e.g. "nve:1000.1000.0")
  - `name: string` (human-readable river name)
  - `source: string` (always "nve" for flow data)
  - `stationId: string` (NVE station ID)
  - `currentLevel: number | null` (discharge in m³/s)
  - `unit: string` (always "m³/s")
  - `alertLevel: number` (1-5 five-level scale position)
  - `lastUpdated: Date`
  - `status: 'ok' | 'stale' | 'error'`
  - `error?: string` (human-readable error if status is 'error')

### Data Model — River Registry
- **D-13:** `RiverEntry` interface (persisted river metadata):
  - `id: string` (unique, e.g. "nve:1000")
  - `stationId: string` (NVE station ID)
  - `name: string` (human-readable river name)
  - `alternateNames: string[]` (names from other sources)
  - `grade: string` (kayak/rafting difficulty grade, e.g. "III-IV")
  - `description: string` (river description)
  - `guideUrl?: string` (link to guide/crucial info)
  - `dangerLevels: number[]` (5-level thresholds in m³/s)
  - `enabled: boolean` (whether to monitor this river)
  - `sources: string[]` (which metadata sources contributed, e.g. ["nokken", "hvorerdetvann"])
- **D-14:** The river registry is persisted as JSON at `data/rivers.json`. Read at startup by the flow engine and the admin page.
- **D-15:** An in-memory `FlowStore` holds the latest RiverData (flow) for each river, keyed by id. No disk persistence for flow data — only the river registry persists.

### Event System
- **D-16:** The engine emits events (`ScraperEvents`) when flow data updates or errors occur, enabling loose coupling with the UI layer in Phase 2.

### Admin Page (Phase 1.5 / Phase 2 prework)
- **D-17:** An admin page (web UI) allows viewing, editing, adding, and deleting river entries.
- **D-18:** The admin page reads/writes `data/rivers.json` directly. Adds new entries with NVE station ID, name, grade, description, guide URL, danger levels, and enabled state.
- **D-19:** The admin frontend is a separate SPA served by the same Node.js server. Framework choice deferred (likely same as Phase 2 UI framework).

### the agent's Discretion
- Schedule configuration format (env var vs config file) and project structure (monorepo vs flat) are deferred to planning — clear conventions will emerge.
- Testing framework and test patterns are standard TypeScript (vitest) — no special decisions needed here.
- Metadata scraping approach (cheerio vs XHR reverse-engineering) for nokken.net is deferred to Plan 01-04 research.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Requirements
- `.planning/REQUIREMENTS.md` — Requirements SCRP-01 through SCRP-04 (fetching, parsing, error handling, adapter pattern)
- `.planning/ROADMAP.md` — Phase 1 goal and success criteria

### Project Context
- `.planning/PROJECT.md` — Project scope, constraints, and key decisions (scraper-first, adapter pattern, no-auth)
- `.planning/STATE.md` — Current project state

### External Specs
- **NVE HydAPI Swagger:** `https://hydapi.nve.no/swagger/v1/swagger.json` — OpenAPI spec for all endpoints (Stations, Observations, Series, Parameters, Percentiles, Ratingcurves)
- **NVE HydAPI base URL:** `https://hydapi.nve.no/api/v1/`
- **NVE HydAPI auth:** `X-API-Key` header, free registration at https://hydapi.nve.no/User/Account/Register
- **NVE HydAPI license:** NLOD 2.0 / CC BY 3.0 — free to use with attribution
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Greenfield project — no existing assets to reuse.

### Established Patterns
- No patterns established yet; Phase 1 establishes the patterns (adapter interface, typed data model, event-driven store) that subsequent phases build on.

### Integration Points
- Phase 1 produces: (a) flow data via `FlowStore` + events, (b) river registry at `data/rivers.json`, (c) metadata import CLI.
- Phase 2 (Web UI) consumes flow data from the event bus and river registry from `data/rivers.json`.
- Admin page (Phase 1.5) reads/writes `data/rivers.json` and reads flow status from the engine.
- The `DatasourceAdapter` interface is the extension point for future flow datasources (Phase 3+ or v2).
</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches within the decisions above.

**Notable reference for adapter pattern:** The `DatasourceAdapter` interface mirrors common scraper/adapter patterns (think `CheerioCrawler` or Puppeteer's page evaluation) but abstracted so the core engine never depends on a specific scraping library.
</specifics>

<deferred>
## Deferred Ideas

- **Custom datasource UI** (v2) — Letting users add custom datasource URLs from the UI is explicitly out of scope for v1.
- **Historical flow storage** (v2) — Flow data is in-memory only. Storing historical levels for trend viewing is deferred.
- **Push notifications** (v2+) — Requires native mobile wrapper. Phase 3 covers in-app alerts only.
- **Automated re-scrape of metadata** — Metadata import is one-time bootstrap at this phase. Periodic re-scrape to catch updates is deferred.

None — discussion stayed within phase scope.
</deferred>

---

*Phase: 1-Scraper Engine*
*Context gathered: 2026-05-27*
