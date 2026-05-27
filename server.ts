import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { engine } from './src/index.js'
import type { RiverData } from './src/core/types.js'

const PORT = parseInt(process.env.PORT ?? '3000', 10)
const app = express()
const clients = new Set<express.Response>()

// Middleware
app.use(cors())

function enrichWithRegistry(river: RiverData) {
  const entry = engine.registry ? registryCache.get(river.id) : undefined
  if (!entry) return river as RiverData & { grade?: string; description?: string }
  return { ...river, grade: entry.grade, description: entry.description }
}

let registryCache = new Map<string, { grade: string; description: string }>()

async function refreshRegistryCache() {
  if (!engine.registry) return
  const entries = await engine.registry.load()
  registryCache = new Map(
    entries.filter((e) => e.grade || e.description).map((e) => [e.id, { grade: e.grade, description: e.description }])
  )
}

refreshRegistryCache()
setInterval(refreshRegistryCache, 60000)

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

  engine.eventBus.on('data-update', onUpdate)
  engine.eventBus.on('error', onError)
  engine.eventBus.on('stale', onStale)

  // Heartbeat every 30s to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n')
  }, 30000)

  req.on('close', () => {
    clients.delete(res)
    engine.eventBus.removeListener('data-update', onUpdate as any)
    engine.eventBus.removeListener('error', onError as any)
    engine.eventBus.removeListener('stale', onStale as any)
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
