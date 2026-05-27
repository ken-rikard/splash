import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NveHydApiAdapter } from '../../src/adapters/nve.js'
import { nveApiKey } from '../../src/config.js'

vi.mock('../../src/config.js', () => ({
  nveApiKey: vi.fn(),
}))

const STATION_A = {
  stationId: '6.9.0',
  stationName: 'Akerselva, ndf. Maridalsvatn',
  parameter: 1001,
  parameterName: 'Vannføring',
  parameterNameEng: 'Discharge',
  method: 'Mean',
  unit: 'm³/s',
  observations: [{ value: 1.438465, time: '2026-05-27T11:00:00Z', correction: 0, quality: 1 }],
}

const STATION_B = {
  stationId: '12.209.0',
  stationName: 'Urula',
  parameter: 1001,
  parameterName: 'Vannføring',
  parameterNameEng: 'Discharge',
  method: 'Mean',
  unit: 'm³/s',
  observations: [{ value: 25.4171, time: '2026-05-27T11:00:00Z', correction: 0, quality: 1 }],
}

const SAMPLE_RESPONSE = { data: [STATION_A, STATION_B] }
const EMPTY_RESPONSE = { data: [] }

describe('NveHydApiAdapter', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns empty array when NVE_API_KEY not set', async () => {
    vi.mocked(nveApiKey).mockReturnValue(undefined)
    const adapter = new NveHydApiAdapter(['6.9.0'])
    const result = await adapter.fetch()
    expect(result).toEqual([])
  })

  it('returns RiverData[] from valid response', async () => {
    vi.mocked(nveApiKey).mockReturnValue('test-key')
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => SAMPLE_RESPONSE,
    })
    const adapter = new NveHydApiAdapter(['6.9.0', '12.209.0'])
    const result = await adapter.fetch()
    expect(result).toHaveLength(2)
    expect(result[0]?.stationId).toBe('6.9.0')
    expect(result[0]?.unit).toBe('m³/s')
    expect(result[0]?.source).toBe('nve')
  })

  it('handles API error gracefully', async () => {
    vi.mocked(nveApiKey).mockReturnValue('test-key')
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    const adapter = new NveHydApiAdapter(['6.9.0'])
    await expect(adapter.fetch()).rejects.toThrow('NVE API responded 500')
  })

  it('handles empty observations gracefully', async () => {
    vi.mocked(nveApiKey).mockReturnValue('test-key')
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => EMPTY_RESPONSE,
    })
    const adapter = new NveHydApiAdapter(['6.9.0'])
    const result = await adapter.fetch()
    expect(result).toHaveLength(0)
  })

  it('result RiverData has correct shape', async () => {
    vi.mocked(nveApiKey).mockReturnValue('test-key')
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [STATION_A] }),
    })
    const adapter = new NveHydApiAdapter(['6.9.0'])
    const result = await adapter.fetch()
    expect(result).toHaveLength(1)
    const r = result[0]!
    expect(r).toHaveProperty('id', 'nve:6.9.0')
    expect(r).toHaveProperty('name', 'Akerselva, ndf. Maridalsvatn')
    expect(r).toHaveProperty('stationId', '6.9.0')
    expect(r).toHaveProperty('currentLevel', 1.438465)
    expect(r).toHaveProperty('unit', 'm³/s')
    expect(r).toHaveProperty('alertLevel')
    expect(r).toHaveProperty('status', 'ok')
  })

  it('setStationIds updates the station list', async () => {
    vi.mocked(nveApiKey).mockReturnValue('test-key')
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [STATION_B] }),
    })
    const adapter = new NveHydApiAdapter()
    adapter.setStationIds(['12.209.0'])
    const result = await adapter.fetch()
    expect(result).toHaveLength(1)
    expect(result[0]?.stationId).toBe('12.209.0')
  })
})
