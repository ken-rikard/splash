import type { AlertConfig, ActiveAlert } from './types.js'

export class AlertEngine {
  private configs = new Map<string, AlertConfig>()
  private activeAlerts = new Map<string, ActiveAlert>()

  // ── Config CRUD ──

  setConfig(config: AlertConfig): AlertConfig {
    this.configs.set(config.riverId, config)
    // If the config is disabled or has inactive threshold, clean up any active alert
    if (!config.enabled || this.isConfigInactive(config)) {
      this.activeAlerts.delete(config.riverId)
    }
    return config
  }

  getConfig(riverId: string): AlertConfig | undefined {
    return this.configs.get(riverId)
  }

  getAllConfigs(): AlertConfig[] {
    return Array.from(this.configs.values())
  }

  removeConfig(riverId: string): boolean {
    const existed = this.configs.delete(riverId)
    this.activeAlerts.delete(riverId) // clean up any triggered alert
    return existed
  }

  // ── Private Helpers ──

  private isConfigInactive(config: AlertConfig): boolean {
    return config.type === 'level'
      ? config.level === undefined
      : config.customValue === undefined
  }
}
