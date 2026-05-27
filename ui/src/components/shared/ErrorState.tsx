import { TriangleAlert, ClockAlert } from 'lucide-react'

interface ErrorStateProps {
  message?: string
  type: 'error' | 'stale'
  lastUpdated?: string
}

function ErrorState({ message, type, lastUpdated }: ErrorStateProps) {
  const isError = type === 'error'

  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border p-10 text-center ${
      isError ? 'border-red-500/10 bg-red-500/5' : 'border-amber-500/10 bg-amber-500/5'
    }`}>
      {isError ? (
        <TriangleAlert className="h-10 w-10 text-danger-4 mb-4" />
      ) : (
        <ClockAlert className="h-10 w-10 text-status-stale mb-4" />
      )}
      <h3 className="text-lg font-display font-semibold text-white mb-1">
        Water level data unavailable
      </h3>
      <p className="text-sm text-slate-400 max-w-md">
        {message ?? 'Data may be stale.'}
        {lastUpdated && ` Last updated: ${lastUpdated}`}
      </p>
    </div>
  )
}

export default ErrorState
