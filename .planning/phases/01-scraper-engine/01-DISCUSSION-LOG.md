# Phase 1: Scraper Engine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-27
**Phase:** 1-Scraper Engine
**Areas discussed:** Language/Runtime, Scraping approach, Scheduling, Error/retry strategy, Adapter interface, Data model/output

**Mode:** `--auto` (autonomous — all decisions auto-selected with recommended defaults)

---

## Language/Runtime

| Option | Description | Selected |
|--------|-------------|----------|
| TypeScript/Node.js | Web-first stack, Capacitor mobile path, consistent with UI phases | ✓ |
| Python | Rich scraping ecosystem (BeautifulSoup, Scrapy) | |
| Go | Single binary, good concurrency for parallel scrapers | |
| Rust | Performance, no runtime, but overkill for data-fetch-only phase | |

**Auto-selected:** TypeScript/Node.js (recommended default)
**Rationale:** Existing stack choice for a web app project; all future phases (UI, alerts) share the same runtime.

---

## Scraping Approach

| Option | Description | Selected |
|--------|-------------|----------|
| node-fetch + cheerio | Lightweight HTTP + HTML parsing, adequate for table-structured data | ✓ |
| Puppeteer/Playwright | Headless browser — overkill for server-rendered HTML | |
| axios + jsdom | Alternative JS HTTP/parser combo, heavier than cheerio | |

**Auto-selected:** node-fetch + cheerio (recommended default)
**Rationale:** hvorerdetvann.com returns server-rendered HTML tables. No need for a headless browser.

---

## Scheduling

| Option | Description | Selected |
|--------|-------------|----------|
| node-cron | Configurable cron expressions, no infra deps | ✓ |
| setInterval | Simplistic, no cron-expression support | |
| External scheduler (systemd timer, K8s CronJob) | Over-engineered for v1 | |

**Auto-selected:** node-cron (recommended default)
**Rationale:** Simple, configurable, no infrastructure dependencies.

---

## Error/Retry Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Exponential backoff, max 3 retries, 30-min stale window | Standard resilient pattern | ✓ |
| Linear retry, no expiration | Simpler but can hammer failing source | |
| Circuit breaker | Over-engineered for v1, adds complexity | |

**Auto-selected:** Exponential backoff (recommended default)
**Rationale:** Balances resilience with simplicity. Stale-data window prevents serving outdated info.

---

## Adapter Interface Design

| Option | Description | Selected |
|--------|-------------|----------|
| Abstract class with fetch() + parse(), typed RiverData return | Clean separation, testable | ✓ |
| Single scraper function with switch/case per source | Quicker to write, harder to extend | |
| Plugin-based (dynamic imports at runtime) | Flexible but premature for v1 | |

**Auto-selected:** Abstract class/interface pattern (recommended default)
**Rationale:** Clean separation of concerns. New datasource = new adapter class. Dynamic loading deferred until multiple adapters exist.

---

## Data Model / Output

| Option | Description | Selected |
|--------|-------------|----------|
| In-memory typed store + event emitter for cross-phase consumption | Loose coupling, no persistence debt | ✓ |
| File-based JSON persistence on disk | Survives restarts but adds I/O | |
| SQLite database | Over-engineered; v1 doesn't need queries | |

**Auto-selected:** In-memory store + event emitter (recommended default)
**Rationale:** Phase 2 reads via events; no persistence needed until historical data is in scope (v2).

---

## the agent's Discretion

- Schedule configuration format (env var vs config file) — deferred to planning conventions
- Project structure (monorepo vs flat) — deferred to planning
- Testing framework — standard TypeScript (vitest)

## Deferred Ideas

- Custom datasource UI (v2) — out of scope for v1
- Historical data storage (v2) — v1 keeps latest scrape only
- Push notifications (v2+) — requires native mobile wrapper
