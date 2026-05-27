import type { RiverData } from './types.js'

export interface DatasourceAdapter {
  readonly sourceId: string
  fetch(): Promise<RiverData[]>
}
