---
title: "Milestones"
---

## v1.0 — Scraper Engine + Web UI

**Released:** 2026-05-27
**Phases:** 2 | **Plans:** 8

### Shipped

- NVE HydAPI scraper with 84 live Norwegian rivers
- Batch rate limiting (10-station batches, 250ms delay)
- River registry with grade/description enrichment
- Express server with REST API + SSE real-time updates
- Dark editorial web UI (Plus Jakarta Sans + Bricolage Grotesque)
- PWA support with service worker precaching
- Responsive mobile layout with Sheet drawer navigation
- River detail page with danger level visualization

### Key Decisions

- Adapter pattern for datasources (NVE first, more later)
- Monolithic server (Express + scraper in same process)
- SSE for real-time data (no WebSocket complexity)
- Web-first, mobile via PWA/Capacitor later

---

*Last updated: 2026-05-27*
