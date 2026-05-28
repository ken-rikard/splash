import { Link } from 'react-router'
import { Bell, X, ChevronRight, Clock } from 'lucide-react'
import { StatusDot } from '@/components/shared/StatusIndicator'
import { Button } from '@/components/ui/button'
import type { ActiveAlert } from '@/types'

const LEVEL_LABELS = ['Empty', 'Low', 'Perfect', 'High', 'Extreme']

export function AlertCard({
  alert,
  onDismiss,
  index = 0,
}: {
  alert: ActiveAlert
  onDismiss: (riverId: string) => void
  index?: number
}) {
  const levelLabel = LEVEL_LABELS[alert.conditionLevel - 1]
  const thresholdLabel = alert.config.type === 'level'
    ? `Level ${alert.config.level!} (${LEVEL_LABELS[alert.config.level! - 1]})`
    : `${alert.config.customValue} m³/s`

  return (
    <div
      className="group rounded-lg border border-danger-4/20 bg-surface p-5 hover:border-danger-4/40 transition-all duration-300 opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Bell className="h-5 w-5 text-danger-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-white truncate">
              {alert.snapshot.name}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {alert.currentValue} {alert.snapshot.unit} — exceeds {thresholdLabel}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="flex-shrink-0 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onDismiss(alert.riverId)}
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <StatusDot level={alert.conditionLevel} status="ok" />
        <span className="text-xs font-medium text-slate-400">
          {levelLabel}
        </span>
        <span className="text-xs text-slate-600 ml-auto inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(alert.triggeredAt).toLocaleString()}
        </span>
      </div>

      <Link
        to={`/river/${alert.riverId}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-water hover:text-cyan-300 transition-colors mt-3 min-h-11 tracking-widest uppercase"
      >
        View River Details
        <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  )
}
