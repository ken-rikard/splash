import { Waves } from 'lucide-react'

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Waves className="h-12 w-12 text-slate-600 mb-4" />
      <h3 className="text-lg font-display font-semibold text-white mb-1">No rivers yet</h3>
      <p className="text-sm text-slate-400 max-w-sm">
        Rivers will appear here once data is loaded from monitoring stations.
      </p>
    </div>
  )
}

export default EmptyState
