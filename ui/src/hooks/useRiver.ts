import { useState, useEffect } from 'react'
import type { RiverData } from '@/types'

type RiverDetailStatus = 'loading' | 'connected' | 'error'

export function useRiver(id: string) {
  const [river, setRiver] = useState<RiverData | null>(null)
  const [status, setStatus] = useState<RiverDetailStatus>('loading')

  useEffect(() => {
    setStatus('loading')

    fetch(`/api/rivers/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Not found')
        }
        return res.json() as Promise<RiverData>
      })
      .then((data) => {
        setRiver(data)
        setStatus('connected')
      })
      .catch(() => {
        setStatus('error')
      })
  }, [id])

  return { river, status }
}
