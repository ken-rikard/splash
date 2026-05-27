import { describe, it, expect, vi } from 'vitest'
import { HvorErDetVannMetadataScraper } from '../../src/import/hvorerdetvann-metadata.js'

const SAMPLE_RESPONSE = [
  {
    section: { id: 22, name: 'Akerselva', name_id: 'akerselva', limits: [10, 10, 15, 20], text: 'Short note', river_url: '/elv/akerselva' },
    gauge: { name: 'Akerselva gauge', url: 'https://sildre.nve.no/station/6.9.0' },
  },
  {
    section: { id: 45, name: 'Glomma', name_id: 'glomma', limits: [200, 500, 1000, 2000], text: 'Big river', river_url: '/elv/glomma' },
    gauge: { name: 'Glomma gauge', url: 'https://sildre.nve.no/station/12.209.0' },
  },
]

describe('HvorErDetVannMetadataScraper', () => {
  it('returns entries from valid API response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => SAMPLE_RESPONSE,
    })
    const scraper = new HvorErDetVannMetadataScraper()
    const result = await scraper.scrape()
    expect(result).toHaveLength(2)
    expect(result[0]!.name).toBe('Akerselva')
    expect(result[0]!.stationId).toBe('6.9.0')
    expect(result[0]!.sources).toEqual(['hvorerdetvann'])
  })

  it('handles empty API response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    })
    const scraper = new HvorErDetVannMetadataScraper()
    const result = await scraper.scrape()
    expect(result).toHaveLength(0)
  })

  it('handles non-200 response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    })
    const scraper = new HvorErDetVannMetadataScraper()
    const result = await scraper.scrape()
    expect(result).toEqual([])
  })

  it('extracts station ID from gauge URL', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => SAMPLE_RESPONSE,
    })
    const scraper = new HvorErDetVannMetadataScraper()
    const result = await scraper.scrape()
    expect(result[0]!.id).toBe('nve:6.9.0')
    expect(result[1]!.id).toBe('nve:12.209.0')
  })
})
