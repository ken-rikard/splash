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
  /** Required when type === 'level' — the danger level to alert at (1-5) */
  level?: AlertLevel
  /** Required when type === 'numeric' — flow threshold in m³/s */
  customValue?: number
  /** Whether this config is actively evaluated */
  enabled: boolean
}

export interface ActiveAlert {
  riverId: string
  config: AlertConfig
  /** The resolved threshold value that was crossed */
  threshold: number
  /** The current river flow at time of evaluation */
  currentValue: number
  /** The river's danger level at time of evaluation */
  alertLevel: AlertLevel
  /** When the alert first triggered */
  triggeredAt: Date
  /** Snapshot of the RiverData that triggered this alert */
  snapshot: RiverData
}
