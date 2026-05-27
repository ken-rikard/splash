---
phase: 04-alerting-engine
plan: 01
subsystem: alert-engine
tags: alert-engine, config-crud, express, vitest, typescript

# Dependency graph
requires:
  - phase: 01-scraper-engine
    provides: Core types (RiverData, AlertLevel), Map-based store pattern
  - phase: 03-favorites-engine
    provides: REST endpoint patterns in server.ts
provides:
  - AlertConfig and ActiveAlert type definitions
  - AlertEngine class with config CRUD (setConfig, getConfig, getAllConfigs, removeConfig)
  - express.json() middleware for PUT body parsing
  - GET/PUT/DELETE /api/alerts/config/:id REST endpoints with inline validation
affects: phase 5 (alerts-page), Plan 04-02 (alert evaluation)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Inline body validation in route handlers (no zod/yup)
    - AlertEngine follows same Map-based store pattern as FlowStore
    - Express v5 endpoints follow existing REST pattern

key-files:
  created:
    - src/core/alert-engine.ts
    - tests/core/alert-engine.test.ts
  modified:
    - src/core/types.ts
    - server.ts

key-decisions:
  - "AlertEngine instantiated directly in server.ts (not exported from index.ts) until Plan 02 wires it into the scrape cycle"
  - "express.json() placed right after cors() middleware, before all route definitions"

patterns-established:
  - "AlertEngine follows FlowStore's in-memory Map pattern for config storage"
  - "Inline body validation in route handler for PUT — no validation library needed for 4-field config"
  - "TDD with RED (failing test) → GREEN (implementation) commits for new core module"

requirements-completed:
  - ALERT-01
  - ALERT-02
  - ARC-02

# Metrics
duration: 2min
completed: 2026-05-27
---

# Phase 4: Alerting Engine — Plan 01 Summary

**AlertConfig/ActiveAlert types, AlertEngine class with in-memory config CRUD, and REST endpoints for managing per-river alert thresholds**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-27T22:59:19Z
- **Completed:** 2026-05-27T23:00:53Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added `AlertConfig` and `ActiveAlert` interfaces to `src/core/types.ts` following existing type style (export interface, JSDoc comments)
- Created `AlertEngine` class with config CRUD operations (`setConfig`, `getConfig`, `getAllConfigs`, `removeConfig`) using in-memory Map pattern matching `FlowStore`
- Added `express.json()` middleware to `server.ts` for PUT body parsing
- Implemented GET/PUT/DELETE REST endpoints at `/api/alerts/config/:id` with inline validation (type enum check, level range 1-5, customValue positive)
- Wrote 5 config CRUD unit tests in vitest following existing test patterns

## Task Commits

Each task was committed atomically:

1. **Task 1 (TDD RED):** AlertConfig/ActiveAlert types + failing tests — `8142a6d` (test)
2. **Task 1 (TDD GREEN):** AlertEngine class implementation — `0ba541e` (feat)
3. **Task 2:** express.json() + alert config REST endpoints — `2266ade` (feat)

**Plan metadata:** *(committed after SUMMARY.md creation)*

_Note: Task 1 follows TDD flow with separate RED (test) and GREEN (feat) commits._

## Files Created/Modified

- `src/core/types.ts` — Added `AlertConfig` and `ActiveAlert` interfaces
- `src/core/alert-engine.ts` — NEW: `AlertEngine` class with config CRUD methods and in-memory Map storage
- `tests/core/alert-engine.test.ts` — NEW: 5 vitest tests for config CRUD operations
- `server.ts` — Added `express.json()` middleware, `AlertEngine` import/instantiation, GET/PUT/DELETE alert config REST endpoints

## Decisions Made

- **AlertEngine in server.ts (not index.ts):** Per plan design, Plan 01 keeps AlertEngine local to server.ts. Plan 02 will move it to index.ts when it needs to subscribe to `data-update` events. This avoids wiring into the scrape cycle before the evaluator exists.
- **express.json() placement:** Right after `cors()` middleware, before all route definitions — critical for Express v5 which doesn't parse JSON bodies by default.
- **Inline validation over zod:** Alert config has 4 fields with simple constraints — inline type/range checks in the route handler are sufficient and avoid adding a validation dependency.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Alert config types and CRUD are complete — ready for Plan 04-02 (Alert Evaluation + Active State)
- The `AlertEngine` class has placeholder `activeAlerts` Map and private `evaluate()` helpers already structured for Plan 02's evaluation logic
- Server has `express.json()` and alert config endpoints in place — Plan 02 can add `/api/alerts/active` endpoint and wire `evaluate()` to `data-update` events

## Self-Check: PASSED

- ✅ `src/core/types.ts` — contains `export interface AlertConfig` and `export interface ActiveAlert`
- ✅ `src/core/alert-engine.ts` — contains `export class AlertEngine` with setConfig, getConfig, getAllConfigs, removeConfig
- ✅ `tests/core/alert-engine.test.ts` — 5 config CRUD tests all pass
- ✅ `server.ts` — express.json() after cors(), alertEngine instantiated, GET/PUT/DELETE endpoints wired
- ✅ Commits: `8142a6d` (RED test), `0ba541e` (GREEN feat), `2266ade` (Task 2 feat), `9316fe7` (SUMMARY)
- ✅ `npx tsc --noEmit` — compiles with zero errors
- ✅ `npx tsx server.ts` — starts, fetches 84 rivers, server status ok
- ✅ REST endpoints: GET `[]`, PUT stores config, DELETE returns removed/404, invalid inputs return 400
- ✅ Pre-existing endpoints (`/api/rivers`, `/api/events`) continue working

---

*Phase: 04-alerting-engine*
*Completed: 2026-05-27*
