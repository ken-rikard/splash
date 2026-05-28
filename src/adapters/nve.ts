import type { AlertLevel, RiverData } from '../core/types.js'
import type { DatasourceAdapter } from '../core/adapter.js'
import { nveApiKey } from '../config.js'

const DEFAULT_STATION_IDS: string[] = [
  '6.9.0',   '12.209.0', '151.15.0', '2.63.0', '2.64.0',
  '2.85.0',  '2.81.0',   '2.60.0',   '2.70.0', '2.72.0',
]

const ALERT_THRESHOLDS: Record<string, [number, number, number, number, number]> = {
  '6.9.0':   [0.5, 1, 3, 6, 10],
  '12.209.0': [5, 15, 40, 80, 150],
  '151.15.0': [20, 50, 150, 300, 600],
}

function computeAlertLevel(stationId: string, flow: number): AlertLevel {
  const thresholds = ALERT_THRESHOLDS[stationId]
  if (thresholds) {
    if (flow <= thresholds[0]) return 1
    if (flow <= thresholds[1]) return 2
    if (flow <= thresholds[2]) return 3
    if (flow <= thresholds[3]) return 4
    return 5
  }
  if (flow <= 0) return 1
  if (flow <= 10) return 2
  if (flow <= 100) return 3
  if (flow <= 500) return 4
  return 5
}

interface NveObservation {
  value: number
  time: string
  correction: number
  quality: number
}

interface NveStationObservation {
  stationId: string
  stationName: string
  parameter: number
  parameterName: string
  parameterNameEng: string
  method: string
  unit: string
  observations: NveObservation[]
}

interface NveObservationResponse {
  data: NveStationObservation[]
}

export class NveHydApiAdapter implements DatasourceAdapter {
  readonly sourceId = 'nve'
  private baseUrl = 'https://hydapi.nve.no/api/v1/Observations'
  private apiKey: string | undefined
  private stationIds: string[]

  constructor(stationIds?: string[]) {
    this.apiKey = nveApiKey()
    this.stationIds = stationIds ?? [...DEFAULT_STATION_IDS]
  }

  setStationIds(ids: string[]): void {
    this.stationIds = ids
  }

  async fetch(): Promise<RiverData[]> {
    if (!this.apiKey) {
      console.warn('NVE_API_KEY not configured — skipping NVE HydAPI adapter')
      return []
    }
    if (this.stationIds.length === 0) return []

    const DELAY_MS = 250
    const BATCH_SIZE = 10
    const results: RiverData[] = []
    for (let i = 0; i < this.stationIds.length; i += BATCH_SIZE) {
      const batch = this.stationIds.slice(i, i + BATCH_SIZE)
      const data = await this.fetchBatch(batch)
      results.push(...data)
      if (i + BATCH_SIZE < this.stationIds.length) {
        await new Promise((r) => setTimeout(r, DELAY_MS))
      }
    }
    return results
  }

  private async fetchBatch(stationIds: string[]): Promise<RiverData[]> {
    const ids = stationIds.join(',')
    const url = `${this.baseUrl}?StationId=${ids}&Parameter=1001&ResolutionTime=1440`
    const response = await fetch(url, {
      headers: {
        'X-API-Key': this.apiKey!,
        Accept: 'application/json',
      },
    })
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`NVE API responded ${response.status}: ${body}`)
    }
    const raw = (await response.json()) as NveObservationResponse
    if (!raw?.data?.length) return []

    return raw.data
      .filter((s) => s?.observations?.length)
      .map((station) => this.parseStation(station))
  }

  private parseStation(station: NveStationObservation): RiverData {
    const lastObs = station.observations[station.observations.length - 1]!
    return {
      id: `nve:${station.stationId}`,
      name: station.stationName,
      stationName: station.stationName,
      source: 'nve',
      stationId: station.stationId,
      currentLevel: lastObs.value,
      unit: station.unit,
      alertLevel: computeAlertLevel(station.stationId, lastObs.value),
      lastUpdated: new Date(lastObs.time),
      status: 'ok',
    }
  }
}
