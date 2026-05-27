import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ActiveAlert } from '@/types'

interface ResolvedAlertInfo {
  riverId: string
  resolvedAt: Date
}

interface AlertContextValue {
  alerts: ActiveAlert[]
  allAlerts: ActiveAlert[]
  resolvedAlerts: ResolvedAlertInfo[]
  count: number
  dismissAlert: (riverId: string) => void
  status: 'loading' | 'connected' | 'error'
}

const STORAGE_KEY = 'splash-dismissed-alerts'

const AlertContext = createContext<AlertContextValue | null>(null)

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<ActiveAlert[]>([])
  const [resolvedAlerts, setResolvedAlerts] = useState<ResolvedAlertInfo[]>([])
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading')
  const [dismissedAt, setDismissedAt] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    } catch {
      return {}
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissedAt))
    } catch (err) {
      console.warn('Failed to persist alert dismissals:', err)
    }
  }, [dismissedAt])

  useEffect(() => {
    fetch('/api/alerts/active')
      .then((res) => res.json())
      .then((data: ActiveAlert[]) => {
        setAlerts((prev) => {
          const serverIds = new Set(data.map((a: ActiveAlert) => a.riverId))
          const extras = prev.filter((a) => !serverIds.has(a.riverId))
          return [
            ...data.map((a: ActiveAlert) => ({ ...a, triggeredAt: new Date(a.triggeredAt) })),
            ...extras,
          ]
        })
        setStatus('connected')
      })
      .catch(() => setStatus('error'))
  }, [])

  useEffect(() => {
    const es = new EventSource('/api/events')

    es.addEventListener('alert-trigger', (event: MessageEvent) => {
      const alert = JSON.parse(event.data) as ActiveAlert
      alert.triggeredAt = new Date(alert.triggeredAt)
      setAlerts((prev) => [...prev.filter((a) => a.riverId !== alert.riverId), alert])
      setStatus('connected')
    })

    es.addEventListener('alert-resolve', (event: MessageEvent) => {
      const { riverId } = JSON.parse(event.data)
      setAlerts((prev) => prev.filter((a) => a.riverId !== riverId))
      setResolvedAlerts((prev) => [...prev, { riverId, resolvedAt: new Date() }])
    })

    es.addEventListener('error', () => {
      setStatus('error')
    })

    return () => es.close()
  }, [])

  const dismissAlert = useCallback((riverId: string) => {
    setDismissedAt((prev) => ({ ...prev, [riverId]: Date.now() }))
  }, [])

  const undismissedAlerts = alerts.filter((alert) => {
    const d = dismissedAt[alert.riverId]
    if (d === undefined) return true
    return new Date(alert.triggeredAt).getTime() > d
  })

  return (
    <AlertContext.Provider
      value={{
        alerts: undismissedAlerts,
        allAlerts: alerts,
        resolvedAlerts,
        count: undismissedAlerts.length,
        dismissAlert,
        status,
      }}
    >
      {children}
    </AlertContext.Provider>
  )
}

export function useAlerts(): AlertContextValue {
  const ctx = useContext(AlertContext)
  if (!ctx) throw new Error('useAlerts must be used within AlertProvider')
  return ctx
}
