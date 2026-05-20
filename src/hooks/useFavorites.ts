import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

const FAVORITES_KEY = 'qingsun-favorites'

function storageKey(userKey: string) {
  return `${FAVORITES_KEY}-${userKey}`
}

function loadFavorites(userKey: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(userKey))
    if (raw) {
      const parsed = JSON.parse(raw) as string[]
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    /* ignore */
  }
  return []
}

export function useFavorites() {
  const { user, isAuthenticated } = useAuth()
  const userKey = isAuthenticated && user ? `user-${user.id}` : 'guest'
  const [ids, setIds] = useState<string[]>(() => loadFavorites(userKey))

  useEffect(() => {
    setIds(loadFavorites(userKey))
  }, [userKey])

  useEffect(() => {
    localStorage.setItem(storageKey(userKey), JSON.stringify(ids))
  }, [userKey, ids])

  const isFavorite = useCallback((contentId: string) => ids.includes(contentId), [ids])

  const toggleFavorite = useCallback((contentId: string) => {
    setIds((prev) =>
      prev.includes(contentId) ? prev.filter((id) => id !== contentId) : [...prev, contentId],
    )
  }, [])

  return { isFavorite, toggleFavorite }
}
