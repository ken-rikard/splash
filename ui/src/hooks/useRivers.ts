import { useState, useEffect } from 'react'
import type { RiverData } from '@/types'

type RiverStatus = 'loading' | 'connected' | 'error' | 'stale'

export function useRivers() {
  const [rivers, setRivers] = useState<RiverData[]>([])
  const [status, setStatus] = useState<RiverStatus>('loading')

  // Initial fetch
  useEffect(() => {
    fetch('/api/rivers')
      .then((res) => res.json())
      .then((data: RiverData[]) => {
        setRivers(data)
        setStatus(data.length > 0 ? 'connected' : 'connected')
      })
      .catch(() => setStatus('error'))
  }, [])

  // SSE subscription for live updates
  useEffect(() => {
    const es = new EventSource('/api/events')

    es.addEventListener('data-update', (event: MessageEvent) => {
      const data = JSON.parse(event.data) as RiverData[]
      setRivers(data)
      setStatus('connected')
    })

    es.addEventListener('error', () => {
      setStatus('error')
    })

    es.addEventListener('stale', () => {
      setStatus('connected')
    })

    return () => {
      es.close()
    }
  }, [])

  return { rivers, status }
}
