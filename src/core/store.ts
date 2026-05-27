import type { RiverData } from './types.js'

export class FlowStore {
  private data = new Map<string, RiverData>()

  update(rivers: RiverData[]): void {
    for (const river of rivers) {
      this.data.set(river.id, river)
    }
  }

  getById(id: string): RiverData | undefined {
    return this.data.get(id)
  }

  getAll(): RiverData[] {
    return Array.from(this.data.values())
  }

  getLastUpdated(): Date | null {
    if (this.data.size === 0) return null
    let latest: Date | null = null
    for (const river of this.data.values()) {
      if (!latest || river.lastUpdated > latest) {
        latest = river.lastUpdated
      }
    }
    return latest
  }

  clear(): void {
    this.data.clear()
  }
}
