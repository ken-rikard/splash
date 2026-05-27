import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { unlinkSync, existsSync } from 'node:fs'
import { mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { RiverRegistry } from '../../src/core/river-registry.js'
import type { RiverEntry } from '../../src/core/types.js'

function makeEntry(id: string): RiverEntry {
  return {
    id,
    stationId: id.replace('nve:', ''),
    name: `River ${id}`,
    alternateNames: [],
    grade: 'III',
    description: 'Test river',
    dangerLevels: [10, 30, 100, 300, 600],
    enabled: true,
    sources: ['nokken'],
  }
}

describe('RiverRegistry', () => {
  let tmpDir: string
  let registry: RiverRegistry

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'splash-test-'))
  })

  afterEach(() => {
    const p = join(tmpDir, 'rivers.json')
    if (existsSync(p)) unlinkSync(p)
  })

  it('load returns empty array on missing file', async () => {
    registry = new RiverRegistry(join(tmpDir, 'rivers.json'))
    const entries = await registry.load()
    expect(entries).toEqual([])
  })

  it('save + load round-trips correctly', async () => {
    registry = new RiverRegistry(join(tmpDir, 'rivers.json'))
    const entry = makeEntry('nve:1000')
    await registry.save([entry])
    const loaded = await registry.load()
    expect(loaded).toHaveLength(1)
    expect(loaded[0]?.id).toBe('nve:1000')
  })

  it('addEntry adds and persists', async () => {
    registry = new RiverRegistry(join(tmpDir, 'rivers.json'))
    await registry.addEntry(makeEntry('nve:1000'))
    const loaded = await registry.load()
    expect(loaded).toHaveLength(1)
  })

  it('addEntry throws on duplicate id', async () => {
    registry = new RiverRegistry(join(tmpDir, 'rivers.json'))
    await registry.addEntry(makeEntry('nve:1000'))
    await expect(registry.addEntry(makeEntry('nve:1000'))).rejects.toThrow('Duplicate')
  })

  it('updateEntry merges partial fields', async () => {
    registry = new RiverRegistry(join(tmpDir, 'rivers.json'))
    await registry.addEntry(makeEntry('nve:1000'))
    await registry.updateEntry('nve:1000', { grade: 'IV', enabled: false })
    const entry = await registry.getEntry('nve:1000')
    expect(entry?.grade).toBe('IV')
    expect(entry?.enabled).toBe(false)
    expect(entry?.stationId).toBe('1000') // unchanged
  })

  it('removeEntry removes by id', async () => {
    registry = new RiverRegistry(join(tmpDir, 'rivers.json'))
    await registry.addEntry(makeEntry('nve:1000'))
    await registry.addEntry(makeEntry('nve:1100'))
    await registry.removeEntry('nve:1000')
    const loaded = await registry.load()
    expect(loaded).toHaveLength(1)
    expect(loaded[0]?.id).toBe('nve:1100')
  })

  it('getEntry returns undefined for unknown id', async () => {
    registry = new RiverRegistry(join(tmpDir, 'rivers.json'))
    const entry = await registry.getEntry('nve:9999')
    expect(entry).toBeUndefined()
  })
})
