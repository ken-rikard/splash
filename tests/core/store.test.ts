import { describe, it, expect } from 'vitest'
import { FlowStore } from '../../src/core/store.js'
import type { RiverData } from '../../src/core/types.js'

function makeRiver(id: string, lastUpdated: Date): RiverData {
  return {
    id,
    name: id,
    source: 'nve',
    stationId: id,
    currentLevel: 10,
    unit: 'm³/s',
    alertLevel: 2,
    lastUpdated,
    status: 'ok',
  }
}

describe('FlowStore', () => {
  it('stores rivers via update', () => {
    const store = new FlowStore()
    const river = makeRiver('nve:1000', new Date())
    store.update([river])
    expect(store.getById('nve:1000')).toEqual(river)
  })

  it('getById returns undefined for unknown id', () => {
    const store = new FlowStore()
    expect(store.getById('nve:9999')).toBeUndefined()
  })

  it('getAll returns all rivers', () => {
    const store = new FlowStore()
    store.update([makeRiver('nve:1000', new Date()), makeRiver('nve:1100', new Date())])
    expect(store.getAll()).toHaveLength(2)
  })

  it('getLastUpdated returns max date', () => {
    const store = new FlowStore()
    const earlier = new Date('2026-01-01')
    const later = new Date('2026-06-01')
    store.update([makeRiver('nve:1000', earlier), makeRiver('nve:1100', later)])
    expect(store.getLastUpdated()).toEqual(later)
  })

  it('getLastUpdated returns null when empty', () => {
    const store = new FlowStore()
    expect(store.getLastUpdated()).toBeNull()
  })

  it('clear empties the store', () => {
    const store = new FlowStore()
    store.update([makeRiver('nve:1000', new Date())])
    store.clear()
    expect(store.getAll()).toHaveLength(0)
  })
})
