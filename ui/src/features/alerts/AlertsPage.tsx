import { BellOff } from 'lucide-react'
import { useAlerts } from '@/hooks/useAlerts'
import { AlertCard } from './AlertCard'
import ErrorState from '@/components/shared/ErrorState'

function AlertsPage() {
  const { alerts, resolvedAlerts, allAlerts, dismissAlert, status } = useAlerts()

  if (status === 'loading') {
    return (
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-8 tracking-tight">Alerts</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-8 tracking-tight">Alerts</h1>
        <ErrorState type="error" message="Could not connect to the river monitoring service. Alert data may be outdated." />
      </div>
    )
  }

  const subtitle = allAlerts.length === 0
    ? 'No alerts currently triggered.'
    : `${alerts.length} active · ${allAlerts.length - alerts.length} dismissed`

  return (
    <div>
      <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">Alerts</h1>
      <p className="text-sm text-slate-400 mb-8">{subtitle}</p>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BellOff className="h-12 w-12 text-slate-600 mb-4" />
          <h2 className="text-lg font-display font-semibold text-white mb-1">All clear</h2>
          <p className="text-sm text-slate-400 max-w-sm">
            No rivers are currently exceeding their configured thresholds.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <AlertCard
              key={alert.riverId}
              alert={alert}
              onDismiss={dismissAlert}
              index={i}
            />
          ))}
        </div>
      )}

      {resolvedAlerts.length > 0 && alerts.length > 0 && (
        <details className="mt-8 group">
          <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
            Resolved ({resolvedAlerts.length})
          </summary>
          <div className="mt-3 space-y-2">
            {resolvedAlerts.map((r) => (
              <div key={r.riverId} className="flex items-center gap-2 text-xs text-slate-600">
                <span className="inline-block h-2 w-2 rounded-full bg-slate-600" />
                {r.riverId} — resolved {new Date(r.resolvedAt).toLocaleTimeString()}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

export default AlertsPage
