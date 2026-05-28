import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'splash-home-location'

interface HomeLocation {
  latitude: number
  longitude: number
  label?: string
}

export function useHomeLocation() {
  const [location, setLocationState] = useState<HomeLocation | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as HomeLocation) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    if (location) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(location))
    }
  }, [location])

  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not available')
      setDenied(true)
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationState({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
        setLoading(false)
        setDenied(false)
      },
      (err) => {
        setLoading(false)
        if (err.code === err.PERMISSION_DENIED) {
          setDenied(true)
          setError('Location access denied. Set your home location manually.')
        } else {
          setError(`Could not get location: ${err.message}`)
        }
      },
      { enableHighAccuracy: false, timeout: 10000 },
    )
  }, [])

  const setLocation = useCallback((lat: number, lng: number, label?: string) => {
    setLocationState({ latitude: lat, longitude: lng, label })
    setError(null)
    setDenied(false)
  }, [])

  const clearLocation = useCallback(() => {
    setLocationState(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { location, loading, error, denied, requestGeolocation, setLocation, clearLocation }
}
