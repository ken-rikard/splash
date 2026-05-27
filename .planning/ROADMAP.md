# Roadmap: Splash

**Phases:** 5 (Phase 5 active) | **Requirements mapped:** 14/14 | Coverage: 100% ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Scraper Engine | Fetch and parse river data with pluggable datasource adapter | SCRP-01, SCRP-02, SCRP-03, SCRP-04 | 4 |
| 2 | Web UI | Responsive dashboard and river detail views | UI-01, UI-02, UI-03, UI-04 | 4 |
| 3 | Favorites Engine | 2/2 | Complete   | 2026-05-27 |
| 4 | Alerting Engine | 2/2 | Complete   | 2026-05-27 |
| 5 | Alerts Page + UX | Dedicated alerts page with in-app notification surface | ALERT-03, ALERT-04 | 3 |

---

## Phase Details

### Phase 1: Scraper Engine
**Goal:** Fetch and parse river data with pluggable datasource adapter.
**Mode:** standard
**Plans:** 3 plans

**Success Criteria:**
1. System fetches data from NVE HydAPI and returns structured river objects
2. Failed fetches trigger retry and don't crash the app
3. A second datasource can be added by writing a new adapter (no core changes)
4. River data includes name, current level, and five-level scale position

**Plans:**
- [x] 01-01 — Foundation: project scaffold, core types, adapter interface, config, test fixtures
- [x] 01-02 — Building blocks: DataStore, typed event bus, NVE adapter
- [x] 01-03 — Orchestration: ScraperEngine with retry/stale handling, entry point

### Phase 2: Web UI
**Goal:** Responsive dashboard and river detail views.
**Mode:** mvp
**Plans:** 4 plans

**Success Criteria:**
1. ✅ Dashboard shows all rivers with current level and color/icon status indicator
2. ✅ River detail page shows current level, five-level position, and full name
3. ✅ UI is usable on mobile viewports (no horizontal scroll, tap targets ≥ 44px)
4. ✅ App shell architecture supports future native wrapping via Capacitor/WebView

**Plans:**
- [x] 02-01 — App Shell + Hardcoded Dashboard
- [x] 02-02 — Express Server + Live Data (REST + SSE)
- [x] 02-03 — River Detail Page
- [x] 02-04 — PWA + Mobile Polish

### Phase 3: Favorites Engine
**Goal:** Personal river watchlist with localStorage persistence.
**Mode:** mvp
**Plans:** 2/2 plans complete

**Success Criteria:**
1. User can favorite/unfavorite a river from the dashboard and detail page
2. Favorites persist across page reloads and PWA app restarts
3. Dashboard can filter to show only favorited rivers
4. Favorites state survives service worker updates and cache clears

**Requirements:** FAV-01, FAV-02, PWA-01

**Plans:**
- [x] 03-01 — Dashboard favorites: useFavorites hook, FavoriteButton, FilterBar, RiverCard/DashboardPage favorite integration
- [x] 03-02 — Detail page favorites + animation: RiverDetailPage FavoriteButton, fav-pop keyframe + reduced-motion guard

### Phase 4: Alerting Engine
**Goal:** Server-side threshold checking and alert evaluation.
**Mode:** mvp
**Plans:** 2/2 plans complete

**Success Criteria:**
1. User can set alert threshold by danger level (1-5) per river
2. User can set custom numeric threshold (m³/s) per river
3. Alert evaluation runs during each scrape cycle
4. Alert state is maintained in-memory and accessible via REST API

**Requirements:** ALERT-01, ALERT-02, ARC-01, ARC-02

**Plans:**
- [x] 04-01 — Alert Config Management: types, AlertEngine config CRUD, REST endpoints for config, tests
- [x] 04-02 — Alert Evaluation + Active State: evaluate() method, data-update wiring, active alert REST endpoint, tests

### Phase 5: Alerts Page + UX
**Goal:** Dedicated alerts page with in-app notification surface.
**Mode:** mvp
**Plans:** 2 plans

**Success Criteria:**
1. Dedicated alerts page shows all triggered alerts with river name, level, and timestamp
2. User can dismiss/acknowledge individual alerts
3. Navigation shows alert count badge when active alerts exist
4. River detail page shows whether an alert is configured

**Requirements:** ALERT-03, ALERT-04

**Plans:**
- [ ] 05-01 — Server-side alert events: event types, evaluate() diff, SSE forwarding, GET /api/alerts/config/:id
- [ ] 05-02 — Client-side alert UX: AlertProvider, useAlerts, NavBar badge, AlertsPage, RiverDetailPage config

---

## Phase Dependencies

```
Phase 1: Scraper Engine ───────────┐
                                   ├──→ Phase 3: Favorites Engine ──→ Phase 4: Alerting Engine ──→ Phase 5: Alerts Page + UX
Phase 2: Web UI ───────────────────┘
```

Phase 3 builds on the existing UI (Phase 2) and data layer (Phase 1). Phase 4 adds server-side alert evaluation to the scraper cycle. Phase 5 surfaces alerts in the UI.

---

*Roadmap created: 2026-05-27*
*Last updated: 2026-05-27 after v1.1 milestone definition*
