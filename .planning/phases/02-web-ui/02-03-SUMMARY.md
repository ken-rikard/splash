---
phase: 02-web-ui
plan: 03
subsystem: ui
tags: [detail-page, danger-level, navigation]
requires: [02-01, 02-02]
provides: [river-detail-page, danger-level-section]
affects: []
key-files:
  created:
    - ui/src/features/river/DangerLevelSection.tsx
    - ui/src/features/river/RiverDetailPage.tsx
  modified:
    - ui/src/routes/index.tsx
decisions:
  - "DangerLevelSection duplicates LEVEL_COLORS/LEVEL_LABELS from shared DangerLevelBar (per plan)"
  - "RiverDetailPage uses useRiver(id) hook for data fetching"
duration: null
metrics:
  new_components: 2
  new_routes: 1
---

# Phase 2 Plan 03: River Detail Page Summary

Created the river detail view with full water level display, five-level danger scale visualization, status, and metadata. Wired navigation from dashboard river card CTA to the detail page. Back navigation returns to dashboard.

## Key Details

- **Visual hierarchy**: Water level displayed as `text-4xl font-bold` (most prominent element)
- **DangerLevelSection**: Card with level number, unit, color-coded level label badge, 5-bar DangerLevelBar, and level labels
- **Navigation**: RiverCard "View Details" CTA links to `/river/:id`; detail page has "Back to all rivers" link with ArrowLeft icon
- **Touch targets**: Back link has `min-h-11` for 44px minimum touch target
- **Loading state**: Skeleton matching detail page layout
- **Error state**: ErrorState component with "Could not load river data."
- **Stale data**: Amber warning banner with "Data may be stale" message

## Threat Surface Scan

No new threat surface — route params are validated through backend API returning 404 for unknown IDs.
