import type { AlertConfig, ActiveAlert, RiverData } from './types.js'

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

  // ── Active Alert Queries ──

  getActiveAlerts(): ActiveAlert[] {
    return Array.from(this.activeAlerts.values())
  }

  getActiveAlert(riverId: string): ActiveAlert | undefined {
    return this.activeAlerts.get(riverId)
  }

  // ── Evaluation ──

  evaluate(rivers: RiverData[]): void {
    for (const river of rivers) {
      const config = this.configs.get(river.id)
      if (!config || !config.enabled) {
        // No config or disabled — clean up any lingering active alert
        this.activeAlerts.delete(river.id)
        continue
      }

      // Can't evaluate a river with no current level
      if (river.currentLevel === null) continue

      const isTriggered = this.isThresholdExceeded(config, river)
      const hasActive = this.activeAlerts.has(river.id)

      if (isTriggered && !hasActive) {
        // New alert — crossed threshold
        this.activeAlerts.set(river.id, {
          riverId: river.id,
          config,
          threshold: this.resolveThreshold(config),
          currentValue: river.currentLevel,
          alertLevel: river.alertLevel,
          triggeredAt: new Date(),
          snapshot: { ...river },
        })
      } else if (!isTriggered && hasActive) {
        // Alert resolved — dropped below threshold
        this.activeAlerts.delete(river.id)
      }
      // isTriggered && hasActive → already active, no update needed
      // !isTriggered && !hasActive → nothing to do
    }
  }

  // ── Private Helpers ──

  private isConfigInactive(config: AlertConfig): boolean {
    return config.type === 'level'
      ? config.level === undefined
      : config.customValue === undefined
  }

  private isThresholdExceeded(config: AlertConfig, river: RiverData): boolean {
    if (config.type === 'level') {
      return config.level !== undefined && river.alertLevel >= config.level
    }
    // Numeric: strict greater-than (exceeds threshold)
    // currentLevel is guaranteed non-null by evaluate() guard clause
    return config.customValue !== undefined && river.currentLevel! > config.customValue
  }

  private resolveThreshold(config: AlertConfig): number {
    // For level-based alerts, use config.level as the display threshold
    // For numeric alerts, use the raw custom value
    return config.type === 'numeric' ? config.customValue! : config.level!
  }
}
