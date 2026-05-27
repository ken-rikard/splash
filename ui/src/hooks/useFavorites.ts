import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'splash-favorites'

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return new Set<string>(stored ? JSON.parse(stored) : [])
    } catch {
      return new Set<string>()
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]))
    } catch (err) {
      console.warn('Failed to persist favorites:', err)
    }
  }, [favorites])

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) {
        try {
          setFavorites(new Set<string>(JSON.parse(e.newValue)))
        } catch { }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const isFavorite = useCallback((id: string): boolean => {
    return favorites.has(id)
  }, [favorites])

  const toggleFavorite = useCallback((id: string): void => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    count: favorites.size,
  }
}
