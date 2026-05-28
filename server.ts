import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { engine, alertEngine } from './src/index.js'
import type { RiverData, FlowLevel, ActiveAlert } from './src/core/types.js'

const PORT = parseInt(process.env.PORT ?? '3000', 10)
const app = express()
const clients = new Set<express.Response>()

// Middleware
app.use(cors())
app.use(express.json())

function enrichWithRegistry(river: RiverData) {
  const entry = engine.registry ? registryCache.get(river.id) : undefined
  if (!entry) return river as RiverData & { grade?: string; description?: string }
  return {
    ...river,
    stationName: river.name,
    name: entry.name,
    grade: entry.grade,
    description: entry.description,
    latitude: entry.latitude ?? river.latitude,
    longitude: entry.longitude ?? river.longitude,
  }
}

let registryCache = new Map<string, { name: string; grade: string; description: string; latitude?: number; longitude?: number }>()

async function refreshRegistryCache() {
  if (!engine.registry) return
  const entries = await engine.registry.load()
  registryCache = new Map(
    entries.map((e) => [e.id, { name: e.name, grade: e.grade, description: e.description, latitude: e.latitude, longitude: e.longitude }])
  )
}

refreshRegistryCache()
setInterval(refreshRegistryCache, 60000)

// Health check — returns 200 with service status (used by Render keep-alive)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

// REST: return all rivers
app.get('/api/rivers', (_req, res) => {
  const rivers = engine.dataStore.getAll().map(enrichWithRegistry)
  res.json(rivers)
})

// REST: return single river by id
app.get('/api/rivers/:id', (req, res) => {
  const river = engine.dataStore.getById(req.params.id)
  if (!river) {
    res.status(404).json({ error: 'River not found' })
    return
  }
  res.json(enrichWithRegistry(river))
})

// Alert Config REST endpoints

// GET /api/alerts/config — list all alert configurations
app.get('/api/alerts/config', (_req, res) => {
  res.json(alertEngine.getAllConfigs())
})

// PUT /api/alerts/config/:id — upsert alert config for a river with inline validation
app.put('/api/alerts/config/:id', (req, res) => {
  const { type, level, customValue, enabled } = req.body

  if (!type || (type !== 'level' && type !== 'numeric')) {
    res.status(400).json({ error: 'type must be "level" or "numeric"' })
    return
  }

  if (type === 'level') {
    if (typeof level !== 'number' || level < 1 || level > 5 || !Number.isInteger(level)) {
      res.status(400).json({ error: 'level must be an integer between 1 and 5' })
      return
    }
  } else {
    if (typeof customValue !== 'number' || customValue <= 0) {
      res.status(400).json({ error: 'customValue must be a positive number' })
      return
    }
  }

  const config = alertEngine.setConfig({
    riverId: req.params.id,
    type,
    level: type === 'level' ? level as FlowLevel : undefined,
    customValue: type === 'numeric' ? customValue : undefined,
    enabled: enabled !== false,
  })
  res.json(config)
})

// DELETE /api/alerts/config/:id — remove alert config for a river
app.delete('/api/alerts/config/:id', (req, res) => {
  const removed = alertEngine.removeConfig(req.params.id)
  if (!removed) {
    res.status(404).json({ error: 'No config found for this river' })
    return
  }
  res.json({ removed: true })
})

// GET /api/alerts/active — list currently triggered alerts
app.get('/api/alerts/active', (_req, res) => {
  res.json(alertEngine.getActiveAlerts())
})

// GET /api/alerts/config/:id — return single alert config by river ID
app.get('/api/alerts/config/:id', (req, res) => {
  const config = alertEngine.getConfig(req.params.id)
  if (!config) {
    res.status(404).json({ error: 'No alert config for this river' })
    return
  }
  res.json(config)
})

// SSE: push real-time events
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  clients.add(res)

  const onUpdate = (rivers: RiverData[]) => {
    res.write(`event: data-update\ndata: ${JSON.stringify(rivers)}\n\n`)
  }

  const onError = (error: Error) => {
    res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`)
  }

  const onStale = (since: Date) => {
    res.write(`event: stale\ndata: ${JSON.stringify({ since })}\n\n`)
  }

  const onAlertTrigger = (alert: ActiveAlert) => {
    res.write(`event: alert-trigger\ndata: ${JSON.stringify(alert)}\n\n`)
  }

  const onAlertResolve = (info: { riverId: string }) => {
    res.write(`event: alert-resolve\ndata: ${JSON.stringify(info)}\n\n`)
  }

  engine.eventBus.on('data-update', onUpdate)
  engine.eventBus.on('error', onError)
  engine.eventBus.on('stale', onStale)
  engine.eventBus.on('alert-trigger', onAlertTrigger)
  engine.eventBus.on('alert-resolve', onAlertResolve)

  // Heartbeat every 30s to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n')
  }, 30000)

  req.on('close', () => {
    clients.delete(res)
    engine.eventBus.removeListener('data-update', onUpdate as any)
    engine.eventBus.removeListener('error', onError as any)
    engine.eventBus.removeListener('stale', onStale as any)
    engine.eventBus.removeListener('alert-trigger', onAlertTrigger as any)
    engine.eventBus.removeListener('alert-resolve', onAlertResolve as any)
    clearInterval(heartbeat)
  })
})

// Serve the built SPA in production
app.use(express.static('ui/dist'))

// SPA fallback — serve index.html for all non-API routes (must be last)
app.get('/{*splat}', (_req, res) => {
  res.sendFile('ui/dist/index.html', { root: process.cwd() })
})

app.listen(PORT, () => {
  console.log(`Splash server running on http://localhost:${PORT}`)
})
