import type { RiverEntry } from '../core/types.js'

export class MetadataMerger {
  async merge(sources: Partial<RiverEntry>[][]): Promise<RiverEntry[]> {
    const byStationId = new Map<string, Partial<RiverEntry>[]>()
    const byFallbackId = new Map<string, Partial<RiverEntry>>()

    for (const source of sources) {
      for (const entry of source) {
        if (entry.stationId) {
          const existing = byStationId.get(entry.stationId) || []
          existing.push(entry)
          byStationId.set(entry.stationId, existing)
        } else if (entry.id) {
          const existing = byFallbackId.get(entry.id)
          if (!existing || this.preferRicher(entry, existing)) {
            byFallbackId.set(entry.id, entry)
          }
        }
      }
    }

    const merged: RiverEntry[] = []

    for (const [, entries] of byStationId) {
      merged.push(this.mergeGroup(entries))
    }

    for (const [, entry] of byFallbackId) {
      merged.push(this.toFullEntry(entry))
    }

    return merged
  }

  private mergeGroup(entries: Partial<RiverEntry>[]): RiverEntry {
    const base = entries[0]!
    const allNames = new Set<string>()
    const allSources = new Set<string>()
    let grade = ''
    let description = ''
    let guideUrl = ''
    const dangerLevels: number[] = [0, 0, 0, 0, 0]

    for (const e of entries) {
      if (e.name) allNames.add(e.name)
      if (e.alternateNames) e.alternateNames.forEach((n) => allNames.add(n))
      if (e.sources) e.sources.forEach((s) => allSources.add(s))
      if (e.grade && !grade) grade = e.grade
      if (e.description && e.description.length > description.length) description = e.description
      if (e.guideUrl && !guideUrl) guideUrl = e.guideUrl
      if (e.dangerLevels && e.dangerLevels.some((d) => d > 0)) {
        e.dangerLevels.forEach((d, i) => { if (d > 0) dangerLevels[i] = d })
      }
    }

    const sid = base.stationId || ''
    return {
      id: `nve:${sid}`,
      stationId: sid,
      name: base.name || '',
      alternateNames: [...allNames].filter((n) => n !== base.name),
      grade,
      description,
      guideUrl: guideUrl || undefined,
      dangerLevels,
      enabled: true,
      sources: [...allSources],
    }
  }

  private toFullEntry(partial: Partial<RiverEntry>): RiverEntry {
    return {
      id: partial.id || '',
      stationId: partial.stationId || '',
      name: partial.name || '',
      alternateNames: partial.alternateNames || [],
      grade: partial.grade || '',
      description: partial.description || '',
      guideUrl: partial.guideUrl || undefined,
      dangerLevels: partial.dangerLevels || [0, 0, 0, 0, 0],
      enabled: partial.enabled ?? true,
      sources: partial.sources || [],
    }
  }

  private preferRicher(a: Partial<RiverEntry>, b: Partial<RiverEntry>): boolean {
    const aScore = (a.grade?.length || 0) + (a.description?.length || 0)
    const bScore = (b.grade?.length || 0) + (b.description?.length || 0)
    return aScore > bScore
  }
}
