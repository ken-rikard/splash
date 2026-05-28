# 05-01-SUMMARY.md — Server-side Alert Events

## Objective

Add `alert-trigger`/`alert-resolve` event types to `ScraperEventMap`, modify `AlertEngine.evaluate()` to return a diff of triggered/resolved alerts, emit events from the data-update handler in `src/index.ts`, forward alert events through the SSE bridge in `server.ts`, and add `GET /api/alerts/config/:id` REST endpoint.

## Tasks Completed

### Task 1: Alert event types + evaluate() diff return

- **`src/core/events.ts`**: Added `ActiveAlert` import and `'alert-trigger': (alert: ActiveAlert) => void` / `'alert-resolve': (info: { riverId: string }) => void` to `ScraperEventMap`
- **`src/core/alert-engine.ts`**: Changed `evaluate()` return type from `void` to `{ triggered: ActiveAlert[]; resolved: string[] }`. Modified disabled config branch to conditionally resolve only when active alert exists. Returns diff on every call.
- **`setConfig()`**: Removed the proactive active-alert cleanup for disabled configs (evaluate() now handles these transitions). Inactive threshold configs (no level/customValue) still cleaned up immediately.
- **Tests added**:
  - `evaluate() returns triggered array with new alert` (level-based group)
  - `evaluate() returns resolved array when alert drops below threshold` (resolution group)
  - `evaluate() returns empty arrays when no state change` (resolution group)
  - `evaluate() returns resolved for disabled config that had active alert` (edge cases)

### Task 2: Event emission, SSE forwarding, config endpoint

- **`src/index.ts`**: Captures `{ triggered, resolved }` from `alertEngine.evaluate()`, emits `alert-trigger` for each triggered alert and `alert-resolve` for each resolved river ID
- **`server.ts`**: Added `ActiveAlert` import, `GET /api/alerts/config/:id` endpoint (returns config or 404), SSE listeners for `alert-trigger`/`alert-resolve` events with proper cleanup on disconnect

## Files Modified

| File | Change |
|------|--------|
| `src/core/events.ts` | Added `ActiveAlert` import, `alert-trigger` and `alert-resolve` event types |
| `src/core/alert-engine.ts` | `evaluate()` returns diff, `setConfig()` no longer cleans up on disable |
| `tests/core/alert-engine.test.ts` | 4 new test cases for evaluate() diff behavior |
| `src/index.ts` | Event emission after evaluate() in data-update handler |
| `server.ts` | New endpoint + SSE listeners + cleanup |

## Verification Results

- `npx tsc --noEmit` — zero errors
- `npx vitest run tests/core/alert-engine.test.ts` — **21/21 passed** (17 existing + 4 new)
- `npx vitest run` — 63/64 passed (1 pre-existing failure in `tests/adapters/nve.test.ts` — `response.text is not a function`, unrelated to this plan)
