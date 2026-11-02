import { useEffect, useSyncExternalStore } from 'react'
import { useSession } from '@/services/session'

const query = '(prefers-color-scheme: dark)'

function subscribe(cb: () => void) {
  const mq = window.matchMedia(query)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

export function useSystemDark() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}

/** Resolves the stored preference (light / dark / system) and applies it to <html>. */
export function useApplyTheme() {
  const theme = useSession((s) => s.theme)
  const systemDark = useSystemDark()
  const dark = theme === 'dark' || (theme === 'system' && systemDark)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])
  return dark
}

export function useResolvedTheme() {
  const theme = useSession((s) => s.theme)
  const systemDark = useSystemDark()
  return theme === 'dark' || (theme === 'system' && systemDark) ? 'dark' : 'light'
}
