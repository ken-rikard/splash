import { describe, it, expect } from 'vitest'
import { MetadataMerger } from '../../src/import/metadata-merger.js'
import type { RiverEntry } from '../../src/core/types.js'

describe('MetadataMerger', () => {
  it('merges two sources with overlapping station IDs', async () => {
    const source1: Partial<RiverEntry>[] = [
      { id: 'nve:1000', stationId: '1000', name: 'Drammenselva', grade: '', description: 'Short desc', sources: ['hvorerdetvann'], dangerLevels: [10, 30, 100, 300, 600] },
    ]
    const source2: Partial<RiverEntry>[] = [
      { id: 'nve:1000', stationId: '1000', name: 'Drammenselva', grade: 'III', description: 'Long description with more detail', sources: ['nokken'] },
    ]
    const merger = new MetadataMerger()
    const result = await merger.merge([source1, source2])
    expect(result).toHaveLength(1)
    expect(result[0]!.grade).toBe('III')
    expect(result[0]!.description).toBe('Long description with more detail')
    expect(result[0]!.dangerLevels[0]).toBe(10)
  })

  it('deduplicates by station ID', async () => {
    const source: Partial<RiverEntry>[] = [
      { id: 'nve:1000', stationId: '1000', name: 'Drammenselva', grade: 'III', sources: ['nokken'] },
      { id: 'nve:1000', stationId: '1000', name: 'Drammenselva', grade: 'IV', sources: ['hvorerdetvann'] },
    ]
    const merger = new MetadataMerger()
    const result = await merger.merge([source])
    expect(result).toHaveLength(1)
  })

  it('prefers richer metadata', async () => {
    const source: Partial<RiverEntry>[] = [
      { id: 'nve:1000', stationId: '1000', name: 'Drammenselva', grade: '', description: '', sources: ['hvorerdetvann'] },
      { id: 'nve:1000', stationId: '1000', name: 'Drammenselva', grade: 'IV+', description: 'Great run', sources: ['nokken'] },
    ]
    const merger = new MetadataMerger()
    const result = await merger.merge([source])
    expect(result[0]!.grade).toBe('IV+')
    expect(result[0]!.description).toBe('Great run')
  })

  it('handles unmatched entries (no stationId)', async () => {
    const source: Partial<RiverEntry>[] = [
      { id: 'custom:1', name: 'Unknown River', grade: 'II', sources: ['nokken'] },
    ]
    const merger = new MetadataMerger()
    const result = await merger.merge([source])
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('custom:1')
  })

  it('empty sources produce empty result', async () => {
    const merger = new MetadataMerger()
    const result = await merger.merge([[], []])
    expect(result).toEqual([])
  })

  it('fills all RiverEntry fields', async () => {
    const source: Partial<RiverEntry>[] = [
      { id: 'nve:1000', stationId: '1000', name: 'Drammenselva', grade: 'III', description: 'Test', guideUrl: 'https://example.com', dangerLevels: [10, 30, 100, 300, 600], enabled: true, sources: ['nokken'], alternateNames: ['Old Name'] },
    ]
    const merger = new MetadataMerger()
    const result = await merger.merge([source])
    const r = result[0]!
    expect(r.id).toBe('nve:1000')
    expect(r.stationId).toBe('1000')
    expect(r.name).toBe('Drammenselva')
    expect(r.grade).toBe('III')
    expect(r.description).toBe('Test')
    expect(r.guideUrl).toBe('https://example.com')
    expect(r.dangerLevels).toEqual([10, 30, 100, 300, 600])
    expect(r.enabled).toBe(true)
    expect(r.sources).toEqual(['nokken'])
  })
})
