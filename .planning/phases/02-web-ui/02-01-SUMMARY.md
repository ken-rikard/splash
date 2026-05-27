---
phase: 02-web-ui
plan: 01
subsystem: ui
tags: [scaffold, vite, shadcn, app-shell, dashboard]
requires: []
provides: [ui-project, app-shell, dashboard-page, river-card, status-indicator]
affects: []
tech-stack:
  added: [react, vite, tailwindcss, shadcn, lucide-react, react-router, radix-ui]
  patterns: [tailwind-v4, app-shell, feature-based-components]
key-files:
  created:
    - ui/vite.config.ts
    - ui/src/index.css
    - ui/src/lib/utils.ts
    - ui/src/types/index.ts
    - ui/src/routes/index.tsx
    - ui/src/App.tsx
    - ui/src/components/layout/AppShell.tsx
    - ui/src/components/layout/NavBar.tsx
    - ui/src/components/shared/StatusIndicator.tsx
    - ui/src/components/shared/DangerLevelBar.tsx
    - ui/src/components/shared/ErrorState.tsx
    - ui/src/features/dashboard/DashboardPage.tsx
    - ui/src/features/dashboard/RiverCard.tsx
    - ui/src/features/dashboard/EmptyState.tsx
decisions:
  - "Used @base-ui/react (shadcn v4 default) instead of @radix-ui/react-* (consolidated)"
  - "Install radix-ui consolidated package instead of individual @radix-ui/react-sheet (not found)"
  - "Tailwind v4 with @import syntax and @theme block"
duration: null
metrics:
  created_files: 15
  shadcn_components: 7
---

# Phase 2 Plan 01: App Shell + Hardcoded Dashboard Summary

Scaffolded the complete `ui/` Vite React SPA project from scratch — project scaffold, shadcn component setup, app shell layout, and dashboard page with 7 hardcoded sample river data entries.

## Decisions Made

1. **@base-ui/react instead of @radix-ui** — shadcn v4 CLI generates components using `@base-ui/react` as the base layer, not `@radix-ui/react-*`. Also installed `radix-ui` as a fallback. No compatibility issues found.
2. **TypeScript path aliases** — Set `paths: { "@/*": ["./src/*"] }` with `ignoreDeprecations: "6.0"` to suppress TS 7.0 deprecation warnings.
3. **Mobile-first with responsive grid** — `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for responsive card layout.
4. **Direct DangerLevelBar component** — Reusable shared component used by both dashboard and detail views.

## Threat Surface Scan

No new threat surface introduced — all data is hardcoded client-side, no server endpoints, no user input.
