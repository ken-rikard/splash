import { Card, CardContent } from '@/components/ui/card'
import { StatusDot } from '@/components/shared/StatusIndicator'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import type { RiverData } from '@/types'

const LEVEL_LABELS = ['Low', 'Moderate', 'High', 'Very High', 'Extreme']

export function RiverCard({ river }: { river: RiverData }) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <StatusDot level={river.alertLevel} status={river.status} />
            <div>
              <p className="text-lg font-semibold">{river.name}</p>
              <p className="text-sm text-neutral-500">{river.unit}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{river.currentLevel ?? '—'}</p>
            <p className="text-xs text-neutral-400">{river.alertLevel}/5 — {LEVEL_LABELS[river.alertLevel - 1]}</p>
          </div>
        </div>
        <Link
          to={`/river/${river.id}`}
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-3 min-h-11"
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  )
}
