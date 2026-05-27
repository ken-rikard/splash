import { EventEmitter } from 'node:events'
import type { RiverData, ScraperStatus } from './types.js'

export interface ScraperEventMap {
  'data-update': (rivers: RiverData[]) => void
  'error': (error: Error) => void
  'stale': (since: Date) => void
  'status-change': (status: ScraperStatus) => void
}

export class ScraperEventBus {
  private emitter = new EventEmitter()

  on<K extends keyof ScraperEventMap>(event: K, listener: ScraperEventMap[K]): this {
    this.emitter.on(event, listener as (...args: unknown[]) => void)
    return this
  }

  emit<K extends keyof ScraperEventMap>(event: K, ...args: Parameters<ScraperEventMap[K]>): boolean {
    return this.emitter.emit(event, ...args)
  }

  removeListener<K extends keyof ScraperEventMap>(event: K, listener: ScraperEventMap[K]): this {
    this.emitter.removeListener(event, listener as (...args: unknown[]) => void)
    return this
  }
}
