import { describe, it, expect, vi } from 'vitest'
import { ScraperEngine } from '../../src/core/engine.js'
import type { DatasourceAdapter } from '../../src/core/adapter.js'
import type { RiverData } from '../../src/core/types.js'

function createMockAdapter(sourceId: string, failTimes = 0): DatasourceAdapter {
  let calls = 0
  return {
    sourceId,
    fetch: vi.fn(async () => {
      calls++
      if (calls <= failTimes) throw new Error(`fail ${calls}`)
      const river: RiverData = {
        id: `${sourceId}:1000`,
        name: 'Test River',
        source: sourceId,
        stationId: '1000',
        currentLevel: 10,
        unit: 'm³/s',
        conditionLevel: 2,
        lastUpdated: new Date(),
        status: 'ok',
      }
      return [river]
    }),
  }
}

function createConfig(overrides = {}) {
  return {
    schedule: '*/15 * * * *',
    scheduleTimezone: 'UTC',
    retry: { retries: 1, minTimeout: 10, maxTimeout: 20, factor: 1 },
    staleWindowMinutes: 30,
    ...overrides,
  }
}

describe('ScraperEngine', () => {
  it('registers an adapter', () => {
    const engine = new ScraperEngine(createConfig())
    const adapter = createMockAdapter('nve')
    engine.register(adapter)
    expect(adapter.fetch).toBeDefined()
  })

  it('invokes adapter.fetch on scrapeAll', async () => {
    const engine = new ScraperEngine(createConfig())
    const adapter = createMockAdapter('nve')
    engine.register(adapter)
    await engine.scrapeAll()
    expect(adapter.fetch).toHaveBeenCalledOnce()
  })

  it('emits data-update on successful scrape', async () => {
    const engine = new ScraperEngine(createConfig())
    const adapter = createMockAdapter('nve')
    engine.register(adapter)

    const listener = vi.fn()
    engine.eventBus.on('data-update', listener)

    await engine.scrapeAll()
    expect(listener).toHaveBeenCalledOnce()
    expect(listener).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'nve:1000' })])
    )
  })

  it('emits error on fetch failure', async () => {
    const engine = new ScraperEngine(createConfig({ retry: { retries: 0, minTimeout: 10, maxTimeout: 20, factor: 1 } }))
    const failingAdapter: DatasourceAdapter = {
      sourceId: 'nve',
      fetch: vi.fn().mockRejectedValue(new Error('network error')),
    }
    engine.register(failingAdapter)

    const statusListener = vi.fn()
    engine.eventBus.on('status-change', statusListener)

    await engine.scrapeAll()
    const errorStatus = statusListener.mock.calls.find(([s]) => s.status === 'error')
    expect(errorStatus).toBeDefined()
    expect(errorStatus![0].error).toContain('network error')
  })

  it('retries on failure then succeeds', async () => {
    const engine = new ScraperEngine(createConfig({ retry: { retries: 1, minTimeout: 10, maxTimeout: 20, factor: 1 } }))
    const adapter = createMockAdapter('nve', 1)
    engine.register(adapter)

    await engine.scrapeAll()
    expect(adapter.fetch).toHaveBeenCalledTimes(2)
  }, 10000)

  it('does not retry TypeError (fatal)', async () => {
    const engine = new ScraperEngine(createConfig({ retry: { retries: 3, minTimeout: 10, maxTimeout: 20, factor: 1 } }))
    const fatalAdapter: DatasourceAdapter = {
      sourceId: 'nve',
      fetch: vi.fn().mockRejectedValue(new TypeError('Invalid structure')),
    }
    engine.register(fatalAdapter)

    await engine.scrapeAll()
    expect(fatalAdapter.fetch).toHaveBeenCalledTimes(1)
  })

  it('isStale returns false when no data', () => {
    const engine = new ScraperEngine(createConfig())
    expect((engine as any).isStale()).toBe(false)
  })

  it('isStale returns true when stale window exceeded', async () => {
    const engine = new ScraperEngine(createConfig({ staleWindowMinutes: 0 }))
    const adapter = createMockAdapter('nve')
    engine.register(adapter)
    await engine.scrapeAll()

    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now + 60000)
    expect((engine as any).isStale()).toBe(true)
    vi.restoreAllMocks()
  })
})
