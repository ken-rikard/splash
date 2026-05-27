export type AlertLevel = 1 | 2 | 3 | 4 | 5

export type RiverStatus = 'ok' | 'stale' | 'error'

export interface RiverData {
  id: string
  name: string
  source: string
  stationId: string
  currentLevel: number | null
  unit: string
  alertLevel: AlertLevel
  lastUpdated: Date
  status: RiverStatus
  error?: string
  grade?: string
  description?: string
}

export interface RiverEntry {
  id: string
  stationId: string
  name: string
  alternateNames: string[]
  grade: string
  description: string
  guideUrl?: string
  dangerLevels: number[]
  enabled: boolean
  sources: string[]
}

export type ScraperFetchStatus = 'idle' | 'fetching' | 'ok' | 'error'

export interface ScraperStatus {
  lastFetch: Date | null
  status: ScraperFetchStatus
  error?: string
}
