import { TriangleAlert, ClockAlert } from 'lucide-react'

interface ErrorStateProps {
  message?: string
  type: 'error' | 'stale'
  lastUpdated?: string
}

function ErrorState({ message, type, lastUpdated }: ErrorStateProps) {
  const isError = type === 'error'

  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border p-8 text-center ${
      isError ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
    }`}>
      {isError ? (
        <TriangleAlert className="h-10 w-10 text-red-500 mb-3" />
      ) : (
        <ClockAlert className="h-10 w-10 text-amber-500 mb-3" />
      )}
      <h3 className="text-lg font-semibold text-neutral-900 mb-1">
        Water level data unavailable
      </h3>
      <p className="text-sm text-neutral-600 max-w-md">
        {message ?? 'Data may be stale.'}
        {lastUpdated && ` Last updated: ${lastUpdated}`}
      </p>
    </div>
  )
}

export default ErrorState
