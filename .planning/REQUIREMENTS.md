# Requirements: Splash

**Defined:** 2026-05-27
**Core Value:** Reliable river flow monitoring with timely alerts when water levels cross critical thresholds.

## v1 Requirements

### Scraping

- [ ] **SCRP-01**: System fetches water level data from hvorerdetvann.com on a configurable schedule
- [ ] **SCRP-02**: System parses river name, current level, and position on the five-level scale
- [ ] **SCRP-03**: System handles scrape failures gracefully (retry, stale-data fallback, user-visible error)
- [ ] **SCRP-04**: Datasources are implemented via pluggable adapters so new sources can be added without touching core logic

### Favorites

- [ ] **FAV-01**: User can add any river to a favorites list
- [ ] **FAV-02**: User can remove rivers from favorites
- [ ] **FAV-03**: Favorites persist across page reloads (localStorage or equivalent)

### Alerts

- [ ] **ALRT-01**: User can set a per-river alert threshold tied to the five-level scale
- [ ] **ALRT-02**: User receives an in-app notification when a river crosses its threshold
- [ ] **ALRT-03**: User can clear or dismiss active alerts

### UI

- [ ] **UI-01**: Dashboard shows all favorited rivers with current level and status indicator
- [ ] **UI-02**: River detail page shows current level, the five-level scale position, and alert configuration
- [ ] **UI-03**: UI is responsive and usable on mobile viewports
- [ ] **UI-04**: Architecture is wrappable via WebView/Capacitor for future native mobile apps

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Notifications

- **NOTF-01**: User receives push notifications on iOS/Android via native wrapper
- **NOTF-02**: Push notification settings are configurable per river

### History

- **HIST-01**: Historical water level data is stored and viewable over time
- **HIST-02**: Charts show level trends for each river

### Multi-source

- **MSRC-01**: User can add custom datasource URLs via the UI
- **MSRC-02**: Datasource status is visible (last fetch time, errors)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native mobile app | v1 is web-only; designed for future wrapping via Capacitor/WebView |
| Push notifications | Requires native app infrastructure; deferred to v2 |
| User authentication | Single-user app for v1; no auth backend needed |
| Historical data lake | Storage of historical levels deferred to v2 |
| Custom datasource UI | v1 datasources are configured in code via adapter pattern |
| Public API | Splash is a consumer app, not a data provider |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCRP-01 |  | Pending |
| SCRP-02 |  | Pending |
| SCRP-03 |  | Pending |
| SCRP-04 |  | Pending |
| FAV-01 |  | Pending |
| FAV-02 |  | Pending |
| FAV-03 |  | Pending |
| ALRT-01 |  | Pending |
| ALRT-02 |  | Pending |
| ALRT-03 |  | Pending |
| UI-01 |  | Pending |
| UI-02 |  | Pending |
| UI-03 |  | Pending |
| UI-04 |  | Pending |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 0
- Unmapped: 14 ⚠️

---
*Requirements defined: 2026-05-27*
*Last updated: 2026-05-27 after initial definition*
