import * as cheerio from 'cheerio'
import type { RiverEntry } from '../core/types.js'

export class NokkenNetMetadataScraper {
  private baseUrl = 'https://nokken.net'

  async scrape(): Promise<Partial<RiverEntry>[]> {
    const riverIds = await this.fetchRiverIds()
    console.log(`Found ${riverIds.length} rivers on nokken.net`)

    const entries: Partial<RiverEntry>[] = []
    for (const riverId of riverIds) {
      try {
        const sectionIds = await this.fetchSectionIdsForRiver(riverId)
        for (const sectionId of sectionIds) {
          try {
            const entry = await this.scrapeSectionPage(sectionId)
            if (entry) entries.push(entry)
          } catch (error) {
            console.error(`Error scraping section ${sectionId}:`, error)
          }
        }
      } catch (error) {
        console.error(`Error fetching sections for river ${riverId}:`, error)
      }
    }
    return entries
  }

  private async fetchRiverIds(): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/rivers`)
    const html = await response.text()
    const $ = cheerio.load(html)
    const ids: number[] = []
    $('a[href^="/river/"]').each((_, el) => {
      const href = $(el).attr('href')
      const match = href?.match(/\/river\/(\d+)/)
      if (match) ids.push(parseInt(match[1]!, 10))
    })
    return [...new Set(ids)]
  }

  private async fetchSectionIdsForRiver(riverId: number): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/river/${riverId}`)
    const html = await response.text()
    const $ = cheerio.load(html)
    const ids = new Set<number>()

    // Extract section IDs from embedded JSON in #river-map-data
    const scriptText = $('#river-map-data').text()
    if (scriptText) {
      try {
        const data = JSON.parse(scriptText) as { pins?: Array<{ section_id?: number }> }
        if (data.pins) {
          for (const pin of data.pins) {
            if (pin.section_id) ids.add(pin.section_id)
          }
        }
      } catch {
        // JSON malformed — fall through to elevation-strip-band parsing
      }
    }

    // Fallback: extract section IDs from elevation strip bands
    if (ids.size === 0) {
      $('.elevation-strip-band').each((_, el) => {
        const sid = $(el).attr('data-section')
        if (sid) ids.add(parseInt(sid, 10))
      })
    }

    return [...ids]
  }

  private async scrapeSectionPage(sectionId: number): Promise<Partial<RiverEntry> | null> {
    const response = await fetch(`${this.baseUrl}/section/${sectionId}`)
    if (!response.ok) {
      console.warn(`nokken.net section ${sectionId} responded ${response.status}`)
      return null
    }
    const html = await response.text()
    const $ = cheerio.load(html)

    const name = $('h1').first().text().trim()
    if (!name) return null

    // Station ID from gauge info card
    const stationId = $('.mono').first().text().trim()

    // Grade from grade-chip (strip "Grade " prefix)
    const gradeRaw = $('.grade-chip').first().text().trim()
    const grade = gradeRaw.replace(/^Grade\s*/i, '')

    return {
      id: stationId ? `nve:${stationId}` : `nokken:${sectionId}`,
      stationId,
      name,
      alternateNames: [],
      grade,
      description: '',
      enabled: true,
      sources: ['nokken'],
    }
  }
}
