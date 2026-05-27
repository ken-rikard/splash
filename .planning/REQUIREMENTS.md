# Requirements: Splash

**Defined:** 2026-05-27
**Core Value:** Reliable river flow monitoring with timely alerts when water levels cross critical thresholds.

## v1.1 Requirements

### Favorites

- [ ] **FAV-01**: User can add/remove rivers to/from a favorites list from the dashboard and river detail page
- [ ] **FAV-02**: User's favorites persist across sessions via localStorage (works in PWA and Capacitor wrappers)

### Alerts

- [ ] **ALERT-01**: User can set per-river alert threshold by danger level (1-5 scale)
- [ ] **ALERT-02**: User can set per-river custom numeric threshold (m³/s)
- [ ] **ALERT-03**: User receives in-app notification when a river crosses its configured threshold
- [ ] **ALERT-04**: User can view dedicated alerts page showing active and past alerts with timestamps

### PWA Readiness

- [ ] **PWA-01**: Service worker caches work reliably with localStorage-based state — no data loss on refresh

### Architecture

- [ ] **ARC-01**: Alert evaluation runs server-side during each scrape cycle (in ScraperEngine event handler)
- [ ] **ARC-02**: Alert state in-memory for now (no persistent alert history beyond the current session)

## Future Requirements

### Notifications v2

- **NOTF-01**: Push notifications via service worker (for PWA installs)
- **NOTF-02**: Alert dismissal syncs across tabs via BroadcastChannel API
- **NOTF-03**: Export/import favorites for device migration

### Favorites v2

- **FAV-03**: Categorize favorites into custom groups/lists
- **FAV-04**: Search and filter within favorites
- **FAV-05**: Sort favorites by current level, danger level, or name

## Out of Scope

| Feature | Reason |
|---------|--------|
| Server-side auth | v1.1 is still single-user; favorites and alerts are local |
| Push notifications | Requires service worker push infra and notification permission flow — defer to v2 |
| Persistent alert history | In-memory only for v1.1; no database needed yet |
| Email/SMS alerts | Out of scope until push notifications land |
| Alert sound/vibration | Simple visual indicator only for v1.1 |
| Favorite sync between devices | Would require backend storage and auth |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FAV-01 | Phase 3 | Pending |
| FAV-02 | Phase 3 | Pending |
| ALERT-01 | Phase 4 | Pending |
| ALERT-02 | Phase 4 | Pending |
| ALERT-03 | Phase 5 | Pending |
| ALERT-04 | Phase 5 | Pending |
| PWA-01 | Phase 3 | Pending |
| ARC-01 | Phase 4 | Pending |
| ARC-02 | Phase 4 | Pending |

**Coverage:**
- v1.1 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-27*
*Last updated: 2026-05-27 after milestone definition*
