import { useState, useEffect, useCallback } from 'react'
import type { AlertConfig } from '@/types'

export function useAlertConfig(riverId: string) {
  const [config, setConfig] = useState<AlertConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/alerts/config/${riverId}`)
      .then((res) => {
        if (!res.ok && res.status !== 404) throw new Error('Failed to fetch')
        return res.status === 404 ? null : (res.json() as Promise<AlertConfig>)
      })
      .then((data) => {
        if (!cancelled) {
          setConfig(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [riverId])

  const updateConfig = useCallback(
    async (updates: Partial<AlertConfig> & { type: 'level' | 'numeric' }) => {
      const res = await fetch(`/api/alerts/config/${riverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to update config')
      const updated = (await res.json()) as AlertConfig
      setConfig(updated)
      return updated
    },
    [riverId],
  )

  const removeConfig = useCallback(async () => {
    await fetch(`/api/alerts/config/${riverId}`, { method: 'DELETE' })
    setConfig(null)
  }, [riverId])

  return { config, loading, updateConfig, removeConfig }
}
