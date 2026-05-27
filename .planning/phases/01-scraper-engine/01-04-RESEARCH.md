# Plan 01-04: Metadata Import — Research

**Researched:** 2026-05-27

## HvorErDetVann.com — JSON API Structure

**Endpoint:** `GET https://hvorerdetvann.com/api/sections`
**Response:** JSON array (NOT `{sections: [...]}` — direct array of 103 entries)
**No auth required.**

### Response shape per entry:
```typescript
interface HvorSection {
  section: {
    id: number          // numeric section ID, e.g. 22
    name: string        // river/section name, e.g. "Akerselva"
    name_id: string     // URL slug, e.g. "akerselva"
    limits: number[]    // 4-element zone boundaries: [dry, low, med, high] — very_high = > limits[3]
    text: string        // brief description (operational notes, not kayak guide)
    river_url: string   // "/elv/akerselva"
    putin: { lat: number; lon: number }
    takeout: { lat: number; lon: number }
    og: { title: string; description: string }
  }
  gauge: {
    name: string        // NVE gauge name, e.g. "Akerselva, ndf. Maridalsvatn"
    url: string         // NVE gauge URL, e.g. "https://sildre.nve.no/station/6.9.0"
  }
  zone: 'dry' | 'low' | 'medium' | 'high' | 'very_high'
  last_flow: { timestamp: string; flow: number; meters: number }
}
```

### Key observations:
- `section.text` has short operational notes (~100 chars max) — NOT kayak descriptions
- `gauge.url` contains NVE dotted station ID (e.g., `6.9.0` from `.../station/6.9.0`)
- 4-element `limits` array maps to: ≤[0]=dry, ≤[1]=low, ≤[2]=medium, ≤[3]=high, >[3]=very_high
- No kayak grade, no detailed description, no guide URL
- 103 total sections, 72 unique NVE gauge URLs

## nokken.net — Server-Rendered HTMX Structure

**Architecture:** FastAPI + HTMX (server-rendered HTML fragments, NOT an SPA)
**Rivers list:** `https://nokken.net/rivers` — 130 rivers alphabetically
**River page:** `https://nokken.net/river/{id}` — river with sections
**Section page:** `https://nokken.net/section/{id}` — detailed section info
**Search API:** `https://nokken.net/api/search?q={query}` (returns HTML fragment)

### Section page structure (`/section/{id}`):
```html
<h1>Skarmodalselva</h1>
<div class="meta-row">
  <span class="grade-chip">Grade IV+</span>
  <span class="length-chip">17.2 km section</span>
</div>

<div class="info-card">
  <h3>Gauge</h3>
  <dl class="info-grid">
    <dt>source</dt><dd>NVE · Nervoll</dd>
    <dt>type</dt><dd>Proxy — flow from a nearby station</dd>
    <dt>station</dt><dd class="mono">151.15.0</dd>
    <dt>provenance</dt>
    <dd><a href="https://www2.nve.no/h/hd/plotreal/Q/151.15.0">see NVE source →</a></dd>
  </dl>
</div>

<section class="sd-panel" aria-labelledby="features-heading">
  <h2 id="features-heading">Features</h2>
  <!-- per-section details -->
</section>
```

### River page structure (`/river/{id}`):
```html
<span class="frag grade">II</span>  <!-- river-level grade -->
<div class="sec-card">
  <div class="sec-label">
    <span class="sec-river">Akerselva</span>
    <span class="sec-name">Play spot</span>  <!-- section/rapid name -->
  </div>
  <a class="sec-detail" href="/section/144">Open</a>
</div>
```

### NVE Station ID format:
- **nokken.net:** Dotted format `151.15.0` (from NVE's sildre system)
- **HvorErDetVann:** Dotted format `6.9.0` (same system)
- **NVE HydAPI:** Integer format `1000` (different system)
- **Mapping:** These are different NVE ID systems. HydAPI integer IDs do NOT directly map to dotted IDs.

## Scraping Approach Decision

| Source | Approach | Tooling |
|--------|----------|---------|
| HvorErDetVann metadata | Native fetch + JSON parse | None needed (built-in) |
| nokken.net section pages | Fetch HTML + parse with cheerio | `cheerio` (npm, lightweight) |
| nokken.net river listing | Native fetch + cheerio | `cheerio` |

**cheerio is acceptable here** because:
1. It's only a dependency of the import CLI (not the runtime engine)
2. nokken.net pages have well-structured semantic HTML with distinct CSS classes
3. Regex parsing of HTML is fragile — cheerio uses jQuery-like selectors

**No playwright needed** — nokken.net is server-rendered HTMX, not an SPA. All content is in the initial HTML response.

## Field Mapping

| RiverEntry field | HvorErDetVann source | nokken.net source |
|-----------------|---------------------|-------------------|
| `name` | `section.name` | Section title from `<h1>` |
| `stationId` | Extract from `gauge.url` (`.../station/X.Y.Z`) | Extract from `.mono` element |
| `alternateNames` | Different section names across sources | Different section names across sources |
| `grade` | Not available | `.grade-chip` text |
| `description` | `section.text` (brief) | Not found on section pages (may need river page) |
| `guideUrl` | Not available | Not directly available |
| `dangerLevels` | `section.limits` (4 → pad to 5) | Not available in HTML |
| `sources` | `['hvorerdetvann']` | `['nokken']` |

## Station ID Resolution Strategy

- HvorErDetVann dotted IDs: extract from `gauge.url` path (e.g., `6.9.0`)
- nokken.net dotted IDs: extract from `.mono` text (e.g., `151.15.0`)
- Deduplication: match by dotted NVE station ID
- The HydAPI integer IDs are a separate concern — the NVE adapter uses hardcoded station IDs for now
