# Roadmap: Splash

**Phases:** 3 | **Requirements mapped:** 14/14 | Coverage: 100% ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Scraper Engine | Fetch and parse river data with pluggable datasource adapter | SCRP-01, SCRP-02, SCRP-03, SCRP-04 | 4 |
| 2 | Web UI | Responsive dashboard and river detail views | UI-01, UI-02, UI-03, UI-04 | 4 |
| 3 | Favorites & Alerts | Personal rivers list with threshold-based alerts | FAV-01, FAV-02, FAV-03, ALRT-01, ALRT-02, ALRT-03 | 6 |

---

## Phase Details

### Phase 1: Scraper Engine
**Goal:** Fetch and parse river data with pluggable datasource adapter.
**Mode:** mvp
**Success Criteria:**
1. System fetches data from hvorerdetvann.com and returns structured river objects
2. Failed fetches trigger retry and don't crash the app
3. A second datasource can be added by writing a new adapter (no core changes)
4. River data includes name, current level, and five-level scale position

### Phase 2: Web UI
**Goal:** Responsive dashboard and river detail views.
**Mode:** mvp
**Success Criteria:**
1. Dashboard shows all rivers with current level and color/icon status indicator
2. River detail page shows current level, five-level position, and full name
3. UI is usable on mobile viewports (no horizontal scroll, tap targets ≥ 44px)
4. App shell architecture supports future native wrapping via Capacitor/WebView

### Phase 3: Favorites & Alerts
**Goal:** Personal rivers list with threshold-based alerts.
**Mode:** mvp
**Success Criteria:**
1. User can add/remove rivers from favorites with one click
2. Favorites persist across page reloads
3. User can set an alert threshold per river (tied to the five-level scale)
4. In-app notification fires when a river crosses its threshold
5. Active alerts are visible and dismissable

---

## Phase Dependencies

```
Phase 1: Scraper Engine ───────────┐
                                    ├──→ Phase 3: Favorites & Alerts
Phase 2: Web UI ───────────────────┘
```

Phase 1 and Phase 2 can run in parallel (scraper backend + UI shell) since they share only the data model contract. Phase 3 depends on both.

---

*Roadmap created: 2026-05-27*
*Last updated: 2026-05-27 after initial definition*
