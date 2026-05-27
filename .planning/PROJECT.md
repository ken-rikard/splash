# Splash

## What This Is

A web application that monitors river water levels by scraping data from hvorerdetvann.com. Users can save favorite rivers and receive alerts when water flow exceeds configurable thresholds tied to the site's five danger levels. Designed from the start to support multiple datasources and to be wrappable as a native iOS/Android app for push notifications.

## Core Value

Reliable river flow monitoring with timely alerts when water levels cross critical thresholds.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **SCRAPE-01**: Fetch water level data from hvorerdetvann.com
- [ ] **SCRAPE-02**: Parse and structure river data (name, current level, five-level scale)
- [ ] **SCRAPE-03**: Support adding new datasources via a pluggable adapter pattern
- [ ] **FAV-01**: User can add/remove rivers to a favorites list
- [ ] **FAV-02**: Favorites persist across sessions
- [ ] **ALERT-01**: User can set per-river alert thresholds mapped to the five-level system
- [ ] **ALERT-02**: User receives in-app notification when threshold is crossed
- [ ] **UI-01**: Responsive web UI that renders well on mobile
- [ ] **UI-02**: Dashboard showing all favorited rivers with current levels
- [ ] **UI-03**: River detail page showing current level, history, and alert config
- [ ] **UI-04**: Architecture supports future native iOS/Android wrappers

### Out of Scope

- Native mobile app — v1 is web-only, designed for future wrapping
- Push notifications — deferred until native app wrapper exists
- Historical data beyond current scrape — no persistent data store for historical levels initially
- User authentication system — single-user or local-only for v1

## Context

- Primary datasource: hvorerdetvann.com (Norwegian river flow data with five alert levels)
- Target users: People who need to monitor river levels — outdoors enthusiasts, property owners near rivers
- Future-proofing: Adapter/plugin pattern from day one so adding datasources doesn't require rewrites
- Mobile path: PWA or responsive web app that can be wrapped with WebView/Capacitor for iOS/Android

## Constraints

- **Data source reliability**: Scraping depends on гдеverdetvann.com availability — need error handling and stale-data fallbacks
- **No authentication backend**: v1 is single-user or local-storage based
- **No push infrastructure**: Notifications are in-app only until mobile wrapper is built

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Scraper-first (no API) | hvorerdetvann.com has no public API — scraping is the only option | — Pending |
| Adapter pattern for datasources | Multiple sources anticipated; want to add without touching core logic | — Pending |
| Web-first, mobile later | Faster iteration; mobile can wrap existing web app | — Pending |
| Five-level threshold system | Maps directly to the source's existing scale, familiar to users | — Pending |
| No auth in v1 | Reduces complexity; single-user app with local storage | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-27 after initialization*
