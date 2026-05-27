import pRetry, { AbortError } from 'p-retry'
import type { DatasourceAdapter } from './adapter.js'
import type { RiverData } from './types.js'
import { FlowStore } from './store.js'
import { ScraperEventBus } from './events.js'
import { RiverRegistry } from './river-registry.js'
import type { ScraperConfig } from '../config.js'

export class ScraperEngine {
  private adapters: DatasourceAdapter[] = []
  private store: FlowStore
  private events: ScraperEventBus
  private config: ScraperConfig
  private _registry?: RiverRegistry

  constructor(config: ScraperConfig, registry?: RiverRegistry) {
    this.store = new FlowStore()
    this.events = new ScraperEventBus()
    this.config = config
    this._registry = registry
  }

  get eventBus(): ScraperEventBus {
    return this.events
  }

  get dataStore(): FlowStore {
    return this.store
  }

  get registry(): RiverRegistry | undefined {
    return this._registry
  }

  register(adapter: DatasourceAdapter): void {
    this.adapters.push(adapter)
  }

  async scrapeAll(): Promise<void> {
    if (this.registry) {
      const entries = await this.registry.load()
      const enabledIds = entries
        .filter((e) => e.enabled)
        .map((e) => e.stationId)
        .filter((id) => /^\d+(\.\d+)*$/.test(id))
      for (const adapter of this.adapters) {
        if (typeof (adapter as any).setStationIds === 'function' && enabledIds.length > 0) {
          ;(adapter as any).setStationIds(enabledIds)
        }
      }
    }

    const results = await Promise.allSettled(
      this.adapters.map((adapter) => this.scrapeOne(adapter))
    )

    for (const result of results) {
      if (result.status === 'rejected') {
        console.error('Scrape cycle failed:', result.reason)
      }
    }
  }

  private async scrapeOne(adapter: DatasourceAdapter): Promise<void> {
    this.events.emit('status-change', {
      lastFetch: null,
      status: 'fetching',
    })

    try {
      const data = await this.fetchWithRetry(adapter)
      this.store.update(data)
      this.events.emit('data-update', data)
      this.events.emit('status-change', {
        lastFetch: new Date(),
        status: 'ok',
      })
    } catch (error) {
      const isStaleResult = this.isStale()

      if (isStaleResult && this.store.getAll().length > 0) {
        this.events.emit('stale', this.store.getLastUpdated() ?? new Date())
      }

      this.events.emit('status-change', {
        lastFetch: null,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  private async fetchWithRetry(adapter: DatasourceAdapter): Promise<RiverData[]> {
    return pRetry(
      async () => {
        try {
          return await adapter.fetch()
        } catch (error) {
          if (error instanceof TypeError) {
            throw new AbortError(error)
          }
          throw error
        }
      },
      {
        retries: this.config.retry.retries,
        minTimeout: this.config.retry.minTimeout,
        maxTimeout: this.config.retry.maxTimeout,
        factor: this.config.retry.factor,
        onFailedAttempt: (context) => {
          console.warn(
            `Scrape attempt ${context.attemptNumber} failed: ${context.error.message}. ` +
            `${context.retriesLeft} retries remaining.`
          )
        },
      }
    )
  }

  private isStale(): boolean {
    const lastUpdated = this.store.getLastUpdated()
    if (!lastUpdated) return false
    return Date.now() - lastUpdated.getTime() > this.config.staleWindowMinutes * 60 * 1000
  }
}
