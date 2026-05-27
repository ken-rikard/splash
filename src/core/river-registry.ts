import { existsSync, mkdirSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { RiverEntry } from './types.js'

export class RiverRegistry {
  private filePath: string

  constructor(filePath = 'data/rivers.json') {
    this.filePath = filePath
  }

  async load(): Promise<RiverEntry[]> {
    try {
      const raw = await readFile(this.filePath, 'utf-8')
      return JSON.parse(raw) as RiverEntry[]
    } catch {
      return []
    }
  }

  async save(entries: RiverEntry[]): Promise<void> {
    this.ensureDir()
    await writeFile(this.filePath, JSON.stringify(entries, null, 2), 'utf-8')
  }

  async addEntry(entry: RiverEntry): Promise<void> {
    const entries = await this.load()
    if (entries.some((e) => e.id === entry.id)) {
      throw new Error(`Duplicate river entry: ${entry.id}`)
    }
    entries.push(entry)
    await this.save(entries)
  }

  async updateEntry(id: string, updates: Partial<RiverEntry>): Promise<void> {
    const entries = await this.load()
    const idx = entries.findIndex((e) => e.id === id)
    if (idx === -1) throw new Error(`River entry not found: ${id}`)
    entries[idx] = { ...entries[idx], ...updates } as RiverEntry
    await this.save(entries)
  }

  async removeEntry(id: string): Promise<void> {
    const entries = await this.load()
    await this.save(entries.filter((e) => e.id !== id))
  }

  async getEntry(id: string): Promise<RiverEntry | undefined> {
    const entries = await this.load()
    return entries.find((e) => e.id === id)
  }

  private ensureDir(): void {
    const dir = dirname(this.filePath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
  }
}
