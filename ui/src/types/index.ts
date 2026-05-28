export type AlertLevel = 1 | 2 | 3 | 4 | 5

export type RiverStatus = 'ok' | 'stale' | 'error'

export interface RiverData {
  id: string
  name: string
  stationName?: string
  source: string
  stationId: string
  latitude?: number
  longitude?: number
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

export interface AlertConfig {
  riverId: string
  type: 'level' | 'numeric'
  level?: AlertLevel
  customValue?: number
  enabled: boolean
}

export interface ActiveAlert {
  riverId: string
  config: AlertConfig
  threshold: number
  currentValue: number
  alertLevel: AlertLevel
  triggeredAt: Date
  snapshot: RiverData
}
