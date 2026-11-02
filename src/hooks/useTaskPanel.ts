import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * The task detail panel is driven by the `?task=` search param so any view can open it
 * and the URL stays shareable.
 */
export function useTaskPanel() {
  const [params, setParams] = useSearchParams()
  const taskId = params.get('task')
  const open = useCallback(
    (id: string) =>
      setParams((p) => {
        const next = new URLSearchParams(p)
        next.set('task', id)
        return next
      }),
    [setParams],
  )
  const close = useCallback(
    () =>
      setParams((p) => {
        const next = new URLSearchParams(p)
        next.delete('task')
        return next
      }),
    [setParams],
  )
  return { taskId, open, close }
}

/** Generic helper for keeping a single string filter in the URL. */
export function useParamState(key: string, fallback = '') {
  const [params, setParams] = useSearchParams()
  const value = params.get(key) ?? fallback
  const set = useCallback(
    (v: string) =>
      setParams(
        (p) => {
          const next = new URLSearchParams(p)
          if (!v || v === fallback) next.delete(key)
          else next.set(key, v)
          return next
        },
        { replace: true },
      ),
    [key, fallback, setParams],
  )
  return [value, set] as const
}
