import type { RiverEntry } from '../core/types.js'

interface HvorSection {
  section: {
    id: number
    name: string
    name_id: string
    limits: number[]
    text: string
    river_url: string
  }
  gauge?: {
    name: string
    url: string
  }
}

function extractStationId(gaugeUrl: string): string {
  const match = gaugeUrl.match(/\/station\/([\d.]+)/)
  return match ? match[1]! : ''
}

function limitsToFlowLevels(limits: number[]): number[] {
  if (limits.length >= 4) {
    return [limits[0]!, limits[1]!, limits[2]!, limits[3]!, limits[3]! * 2]
  }
  return [0, 0, 0, 0, 0]
}

export class HvorErDetVannMetadataScraper {
  private baseUrl = 'https://hvorerdetvann.com/api/sections'

  async scrape(): Promise<Partial<RiverEntry>[]> {
    const response = await fetch(this.baseUrl, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) {
      console.error(`HvorErDetVann API responded ${response.status}`)
      return []
    }
    const data = (await response.json()) as HvorSection[]
    if (!Array.isArray(data)) {
      console.error('HvorErDetVann API returned non-array response')
      return []
    }

    const entries: Partial<RiverEntry>[] = []
    for (const item of data) {
      try {
        const stationId = item.gauge?.url ? extractStationId(item.gauge.url) : ''
        const entry: Partial<RiverEntry> = {
          id: stationId ? `nve:${stationId}` : `hvorerdetvann:${item.section.id}`,
          stationId,
          name: item.section.name,
          alternateNames: [],
          grade: '',
          description: item.section.text || '',
          flowLevels: limitsToFlowLevels(item.section.limits),
          enabled: true,
          sources: ['hvorerdetvann'],
        }
        entries.push(entry)
      } catch (error) {
        console.error(`Error processing HvorErDetVann section ${item.section?.id}:`, error)
      }
    }
    return entries
  }
}
