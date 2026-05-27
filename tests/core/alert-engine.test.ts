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

    it('removes a config and cleans up active alerts', () => {
      const engine = new AlertEngine()
      engine.setConfig({ riverId: 'nve:1000', type: 'level', level: 1, enabled: true })
      engine.evaluate([makeRiver('nve:1000', 1000, 5)])
      expect(engine.getActiveAlerts()).toHaveLength(1)
      engine.removeConfig('nve:1000')
      expect(engine.getConfig('nve:1000')).toBeUndefined()
      expect(engine.getActiveAlerts()).toHaveLength(0)
    })
  })

  describe('evaluation — level-based', () => {
    it('triggers when alertLevel >= configured level', () => {
      const engine = new AlertEngine()
      engine.setConfig({ riverId: 'nve:1000', type: 'level', level: 3, enabled: true })
      engine.evaluate([makeRiver('nve:1000', 200, 3)])
      expect(engine.getActiveAlerts()).toHaveLength(1)
      expect(engine.getActiveAlert('nve:1000')!.alertLevel).toBe(3)
    })

    it('does not trigger at lower levels', () => {
      const engine = new AlertEngine()
      engine.setConfig({ riverId: 'nve:1000', type: 'level', level: 3, enabled: true })
      engine.evaluate([makeRiver('nve:1000', 10, 1)])
      expect(engine.getActiveAlerts()).toHaveLength(0)
    })

    it('triggers at higher levels than configured', () => {
      const engine = new AlertEngine()
      engine.setConfig({ riverId: 'nve:1000', type: 'level', level: 3, enabled: true })
      engine.evaluate([makeRiver('nve:1000', 5000, 5)])
      expect(engine.getActiveAlerts()).toHaveLength(1)
    })
  })

  describe('evaluation — numeric-based', () => {
    it('triggers when currentLevel exceeds numeric threshold', () => {
      const engine = new AlertEngine()
      engine.setConfig({ riverId: 'nve:1000', type: 'numeric', customValue: 100, enabled: true })
      engine.evaluate([makeRiver('nve:1000', 150, 2)])
      expect(engine.getActiveAlerts()).toHaveLength(1)
    })

    it('does not trigger when currentLevel equals threshold', () => {
      const engine = new AlertEngine()
      engine.setConfig({ riverId: 'nve:1000', type: 'numeric', customValue: 100, enabled: true })
      engine.evaluate([makeRiver('nve:1000', 100, 2)])
      expect(engine.getActiveAlerts()).toHaveLength(0)
    })
  })

  describe('evaluation — resolution', () => {
    it('resolves alert when level drops below threshold', () => {
      const engine = new AlertEngine()
      engine.setConfig({ riverId: 'nve:1000', type: 'level', level: 3, enabled: true })
      engine.evaluate([makeRiver('nve:1000', 200, 3)])
      expect(engine.getActiveAlerts()).toHaveLength(1)
      engine.evaluate([makeRiver('nve:1000', 10, 1)])
      expect(engine.getActiveAlerts()).toHaveLength(0)
    })

    it('does not resolve if alert never triggered', () => {
      const engine = new AlertEngine()
      engine.setConfig({ riverId: 'nve:1000', type: 'level', level: 3, enabled: true })
      engine.evaluate([makeRiver('nve:1000', 10, 1)])
      engine.evaluate([makeRiver('nve:1000', 12, 1)])
      expect(engine.getActiveAlerts()).toHaveLength(0)
    })
  })

  describe('edge cases', () => {
    it('skips rivers with null currentLevel', () => {
      const engine = new AlertEngine()
      engine.setConfig({ riverId: 'nve:1000', type: 'level', level: 1, enabled: true })
      engine.evaluate([makeRiver('nve:1000', null as unknown as number, 1)])
      expect(engine.getActiveAlerts()).toHaveLength(0)
    })

    it('skips rivers with no config', () => {
      const engine = new AlertEngine()
      engine.evaluate([makeRiver('nve:1000', 100, 3)])
      expect(engine.getActiveAlerts()).toHaveLength(0)
    })

    it('skips disabled configs', () => {
      const engine = new AlertEngine()
      engine.setConfig({ riverId: 'nve:1000', type: 'level', level: 1, enabled: false })
      engine.evaluate([makeRiver('nve:1000', 100, 3)])
      expect(engine.getActiveAlerts()).toHaveLength(0)
    })

    it('removeConfig cleans up active alert', () => {
      const engine = new AlertEngine()
      engine.setConfig({ riverId: 'nve:1000', type: 'level', level: 1, enabled: true })
      engine.evaluate([makeRiver('nve:1000', 100, 3)])
      expect(engine.getActiveAlerts()).toHaveLength(1)
      engine.removeConfig('nve:1000')
      expect(engine.getActiveAlerts()).toHaveLength(0)
    })
  })
})
