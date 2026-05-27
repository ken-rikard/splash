import { describe, it, expect, vi } from 'vitest'
import { ScraperEventBus } from '../../src/core/events.js'
import type { RiverData } from '../../src/core/types.js'

describe('ScraperEventBus', () => {
  it('emits data-update with payload', () => {
    const bus = new ScraperEventBus()
    const listener = vi.fn()
    bus.on('data-update', listener)
    const rivers: RiverData[] = []
    bus.emit('data-update', rivers)
    expect(listener).toHaveBeenCalledWith(rivers)
  })

  it('emits error with Error', () => {
    const bus = new ScraperEventBus()
    const listener = vi.fn()
    bus.on('error', listener)
    const err = new Error('test')
    bus.emit('error', err)
    expect(listener).toHaveBeenCalledWith(err)
  })

  it('emits stale with Date', () => {
    const bus = new ScraperEventBus()
    const listener = vi.fn()
    bus.on('stale', listener)
    const date = new Date()
    bus.emit('stale', date)
    expect(listener).toHaveBeenCalledWith(date)
  })

  it('emits status-change with status', () => {
    const bus = new ScraperEventBus()
    const listener = vi.fn()
    bus.on('status-change', listener)
    const status = { lastFetch: null, status: 'fetching' as const }
    bus.emit('status-change', status)
    expect(listener).toHaveBeenCalledWith(status)
  })

  it('removeListener stops receiving events', () => {
    const bus = new ScraperEventBus()
    const listener = vi.fn()
    bus.on('data-update', listener)
    bus.removeListener('data-update', listener)
    bus.emit('data-update', [])
    expect(listener).not.toHaveBeenCalled()
  })

  it('multiple listeners on same event all fire', () => {
    const bus = new ScraperEventBus()
    const a = vi.fn()
    const b = vi.fn()
    bus.on('data-update', a)
    bus.on('data-update', b)
    bus.emit('data-update', [])
    expect(a).toHaveBeenCalledOnce()
    expect(b).toHaveBeenCalledOnce()
  })
})
