import { describe, it, expect } from 'vitest'
import { AlertEngine } from '../../src/core/alert-engine.js'
import type { AlertConfig, RiverData, AlertLevel } from '../../src/core/types.js'

function makeRiver(id: string, currentLevel: number, alertLevel: AlertLevel): RiverData {
  return {
    id,
    name: id,
    source: 'nve',
    stationId: id.replace('nve:', ''),
    currentLevel,
    unit: 'm³/s',
    alertLevel,
    lastUpdated: new Date(),
    status: 'ok',
  }
}

describe('AlertEngine', () => {
  describe('config CRUD', () => {
    it('stores and retrieves a config by river ID', () => {
      const engine = new AlertEngine()
      const config: AlertConfig = {
        riverId: 'nve:1000',
        type: 'level',
        level: 3,
        enabled: true,
      }
      engine.setConfig(config)
      expect(engine.getConfig('nve:1000')).toEqual(config)
    })

    it('returns undefined for non-existent config', () => {
      const engine = new AlertEngine()
      expect(engine.getConfig('nve:9999')).toBeUndefined()
    })

    it('removes a config and returns true', () => {
      const engine = new AlertEngine()
      engine.setConfig({ riverId: 'nve:1000', type: 'level', level: 3, enabled: true })
      const result = engine.removeConfig('nve:1000')
      expect(result).toBe(true)
      expect(engine.getConfig('nve:1000')).toBeUndefined()
    })

    it('returns false when removing non-existent config', () => {
      const engine = new AlertEngine()
      expect(engine.removeConfig('nve:9999')).toBe(false)
    })

    it('getAllConfigs returns all stored configs', () => {
      const engine = new AlertEngine()
      engine.setConfig({ riverId: 'nve:1000', type: 'level', level: 3, enabled: true })
      engine.setConfig({ riverId: 'nve:1100', type: 'numeric', customValue: 500, enabled: true })
      expect(engine.getAllConfigs()).toHaveLength(2)
    })
  })
})
