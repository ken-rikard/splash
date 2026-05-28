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
    const flowLevels: number[] = [0, 0, 0, 0, 0]

    for (const entry of entries) {
      if (entry.alternateNames) entry.alternateNames.forEach((n) => allNames.add(n))
      if (entry.sources) entry.sources.forEach((s) => allSources.add(s))
      if (entry.grade && this.preferValue(entry.grade, grade)) grade = entry.grade
      if (entry.description && entry.description.length > description.length) description = entry.description
      if (entry.guideUrl && !guideUrl) guideUrl = entry.guideUrl
      if (entry.flowLevels) {
        entry.flowLevels.forEach((d, i) => { if (d > 0) flowLevels[i] = d })
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
      flowLevels,
      enabled: true,
      sources: [...allSources],
    }
  }

  private preferValue(a: string, b: string): boolean {
    const order = ['', 'II', 'II+', 'III', 'III+', 'III−', 'IV', 'IV+', 'IV−', 'V', 'V+', 'V−', 'VI']
    return order.indexOf(a) > order.indexOf(b)
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
      flowLevels: partial.flowLevels || [0, 0, 0, 0, 0],
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
