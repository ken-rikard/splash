import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { RiverCard } from './RiverCard'
import EmptyState from './EmptyState'
import type { RiverData } from '@/types'

const SAMPLE_RIVERS: RiverData[] = [
  {
    id: 'nve-1',
    name: 'Suldalslågen',
    source: 'NVE',
    stationId: '12.23.0',
    currentLevel: 245.8,
    unit: 'm³/s',
    alertLevel: 2,
    lastUpdated: new Date(),
    status: 'ok',
  },
  {
    id: 'nve-2',
    name: 'Vosso',
    source: 'NVE',
    stationId: '62.5.0',
    currentLevel: 89.2,
    unit: 'm³/s',
    alertLevel: 1,
    lastUpdated: new Date(),
    status: 'ok',
  },
  {
    id: 'nve-3',
    name: 'Gaula',
    source: 'NVE',
    stationId: '122.4.0',
    currentLevel: 412.0,
    unit: 'm³/s',
    alertLevel: 3,
    lastUpdated: new Date(),
    status: 'ok',
  },
  {
    id: 'nve-4',
    name: 'Drammenselva',
    source: 'NVE',
    stationId: '7.1.0',
    currentLevel: 678.5,
    unit: 'm³/s',
    alertLevel: 4,
    lastUpdated: new Date(),
    status: 'ok',
  },
  {
    id: 'nve-5',
    name: 'Glomma',
    source: 'NVE',
    stationId: '2.12.0',
    currentLevel: 1200.0,
    unit: 'm³/s',
    alertLevel: 5,
    lastUpdated: new Date(),
    status: 'ok',
  },
  {
    id: 'nve-6',
    name: 'Nidelva',
    source: 'NVE',
    stationId: '123.1.0',
    currentLevel: null,
    unit: 'm³/s',
    alertLevel: 1,
    lastUpdated: new Date(),
    status: 'stale',
  },
  {
    id: 'nve-7',
    name: 'Numedalslågen',
    source: 'NVE',
    stationId: '26.3.0',
    currentLevel: 156.3,
    unit: 'm³/s',
    alertLevel: 2,
    lastUpdated: new Date(),
    status: 'ok',
  },
]

function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [rivers] = useState<RiverData[]>(SAMPLE_RIVERS)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">River Levels</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-lg border border-neutral-200">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (rivers.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">River Levels</h1>
        <EmptyState />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">River Levels</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rivers.map((river) => (
          <RiverCard key={river.id} river={river} />
        ))}
      </div>
    </div>
  )
}

export default DashboardPage
