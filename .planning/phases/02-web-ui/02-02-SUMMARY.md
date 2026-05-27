---
phase: 02-web-ui
plan: 02
subsystem: server
tags: [express, sse, rest-api, hooks, live-data]
requires: [02-01]
provides: [express-server, sse-bridge, useRivers-hook, useRiver-hook]
affects: []
tech-stack:
  added: [express, cors]
  patterns: [sse-bridge, event-bus-bridge]
key-files:
  created:
    - server.ts
    - ui/src/hooks/useRivers.ts
    - ui/src/hooks/useRiver.ts
  modified:
    - package.json (express, cors, scripts)
    - ui/vite.config.ts (proxy)
    - ui/src/features/dashboard/DashboardPage.tsx (live data)
decisions:
  - "Express v5 requires named wildcard syntax for catch-all: /{*splat} instead of *"
  - "SSE bridge pattern with Set<Response> tracking and heartbeat interval"
  - "Vite proxy for dev (/api -> localhost:3000), Express static for production"
duration: null
metrics:
  api_endpoints: 3
  sse_events: 3
  hooks: 2
---

# Phase 2 Plan 02: Express Server + Live Data Summary

Created the Express HTTP server that imports the Phase 1 scraper engine and exposes river data via REST and Server-Sent Events. Updated React hooks to fetch from the real API and subscribe to SSE for live updates.

## Key Details

- **Express v5 migration issue**: The catch-all route required `/{*splat}` syntax instead of `*` due to path-to-regexp v8 upgrade. Express v5 also uses new path syntax.
- **SSE bridge**: Three event types bridged from ScraperEventBus to browser clients:
  - `event: data-update` — new river data available
  - `event: error` — scraper failure
  - `event: stale` — data older than threshold
- **Client cleanup**: Listeners removed, client deleted from Set, heartbeat cleared on `req.on('close')`
- **@types/express@5.0.6** installed (5.0.7 not available on npm)
- **Development workflow**: Run `npm run dev:server` (Express on :3000) and `npm run dev` in ui/ (Vite on :5173) concurrently

## Threat Surface Scan

No new threat surface beyond localhost GET endpoints and read-only SSE stream. Cleanup handlers prevent SSE connection leaks.
