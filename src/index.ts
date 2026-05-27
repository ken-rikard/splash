import 'dotenv/config'
import nodeCron from 'node-cron'
import { ScraperEngine } from './core/engine.js'
import { NveHydApiAdapter } from './adapters/nve.js'
import { RiverRegistry } from './core/river-registry.js'
import { defaultConfig } from './config.js'

const config = defaultConfig()
const registry = new RiverRegistry()
const engine = new ScraperEngine(config, registry)

engine.register(new NveHydApiAdapter())

engine.eventBus.on('data-update', (rivers) => {
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

export { engine }
