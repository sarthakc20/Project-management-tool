import { useEffect, useState } from 'react'

const loaded = new Set<string>()

/**
 * Shows a brief loading state the first time a screen mounts in a session, mirroring the
 * latency of a real fetch without slowing repeat navigation.
 * TODO(BACKEND): Replace with real query loading/error states from the API client.
 */
export function useSimulatedLoad(key: string, ms = 320) {
  const [loading, setLoading] = useState(() => !loaded.has(key))
  useEffect(() => {
    if (!loading) return
    const t = setTimeout(() => {
      loaded.add(key)
      setLoading(false)
    }, ms)
    return () => clearTimeout(t)
  }, [key, ms, loading])
  return loading
}
