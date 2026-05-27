import 'dotenv/config'
import nodeCron from 'node-cron'
import { ScraperEngine } from './core/engine.js'
import { NveHydApiAdapter } from './adapters/nve.js'
import { RiverRegistry } from './core/river-registry.js'
import { defaultConfig } from './config.js'
import { AlertEngine } from './core/alert-engine.js'

const config = defaultConfig()
const registry = new RiverRegistry()
const engine = new ScraperEngine(config, registry)

engine.register(new NveHydApiAdapter())

const alertEngine = new AlertEngine()

engine.eventBus.on('data-update', (rivers) => {
  const { triggered, resolved } = alertEngine.evaluate(rivers)
  for (const alert of triggered) { engine.eventBus.emit('alert-trigger', alert) }
  for (const riverId of resolved) { engine.eventBus.emit('alert-resolve', { riverId }) }
  console.log(`Flow data updated: ${rivers.length} rivers`)
})

engine.eventBus.on('status-change', (status) => {
  console.log(`Engine status: ${status.status}${status.error ? ` (${status.error})` : ''}`)
})

const task = nodeCron.schedule(
  config.schedule,
  () => { engine.scrapeAll() },
  { timezone: config.scheduleTimezone }
)

engine.scrapeAll()

function shutdown() {
  task.stop()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

export { engine, alertEngine }
