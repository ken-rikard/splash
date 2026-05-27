# Phase 1: Scraper Engine - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Fetch water level data from hvorerdetvann.com, parse it into structured river objects with five-level scale position, handle scrape failures with retry and stale-data fallback, and provide a pluggable datasource adapter system so new sources can be added without touching core logic.

**Requirements:** SCRP-01 (fetch), SCRP-02 (parse), SCRP-03 (error handling), SCRP-04 (adapter pattern)
**Success criteria:** 4 (fetch + parse, error resilience, pluggable adapter, structured output)
</domain>

<decisions>
## Implementation Decisions

### Language & Runtime
- **D-01:** TypeScript on Node.js — aligns with web-first stack, Capacitor mobile path, consistent with UI and alert phases. No build-tool concessions needed for scraping.

### Scraping Approach
- **D-02:** `node-fetch` for HTTP + `cheerio` for HTML parsing — lightweight, well-understood, adequate for table-structured river data on hvorerdetvann.com. No headless browser needed (the site returns server-rendered HTML).
- **D-03:** The scraper targets the table structure of hvorerdetvann.com's river listing page. Future datasource adapters may use different parsers.

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

### Data Model
- **D-12:** Core `RiverData` interface:
  - `id: string` (unique, source-prefixed)
  - `name: string` (human-readable river name)
  - `source: string` (datasource identifier, e.g. "hvorerdetvann")
  - `currentLevel: number | null` (water level in source units)
  - `alertLevel: number` (1-5 five-level scale position)
  - `lastUpdated: Date`
  - `status: 'ok' | 'stale' | 'error'`
  - `error?: string` (human-readable error if status is 'error')
- **D-13:** An in-memory `DataStore` holds the latest RiverData for each river, keyed by id. Phase 1 does NOT persist to disk — Phase 2's UI reads from the store.
- **D-14:** The engine emits events (`ScraperEvents`) when data updates or errors occur, enabling loose coupling with the UI layer in Phase 2.

### the agent's Discretion
- Schedule configuration format (env var vs config file) and project structure (monorepo vs flat) are deferred to planning — clear conventions will emerge.
- Testing framework and test patterns are standard TypeScript (vitest) — no special decisions needed here.
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

No external specs — requirements fully captured in decisions above.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Greenfield project — no existing assets to reuse.

### Established Patterns
- No patterns established yet; Phase 1 establishes the patterns (adapter interface, typed data model, event-driven store) that subsequent phases build on.

### Integration Points
- Phase 1 produces a typed `RiverData` output contract and event emitter that Phase 2 (Web UI) consumes.
- The `DatasourceAdapter` interface is the extension point for future datasources (Phase 3+ or v2).
- No persistence layer — Phase 1 keeps state in memory for the UI layer to consume.
</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches within the decisions above.

**Notable reference for adapter pattern:** The `DatasourceAdapter` interface mirrors common scraper/adapter patterns (think `CheerioCrawler` or Puppeteer's page evaluation) but abstracted so the core engine never depends on a specific scraping library.
</specifics>

<deferred>
## Deferred Ideas

- **Custom datasource UI** (v2) — Letting users add custom datasource URLs from the UI is explicitly out of scope for v1. Phase 1 datasources are configured in code via the adapter.
- **Historical data storage** (v2) — Phase 1 only keeps the latest scrape in memory. Storing historical levels for trend viewing is deferred.
- **Push notifications** (v2+) — Requires native mobile wrapper. Phase 3 covers in-app alerts only.

None — discussion stayed within phase scope.
</deferred>

---

*Phase: 1-Scraper Engine*
*Context gathered: 2026-05-27*
