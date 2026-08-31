import { useEffect, useState } from 'react'
import { STORE_UPDATE_EVENT } from './chatStore'

/** Re-runs `read` whenever the localStorage-backed store changes, in this tab or another. */
export function useLiveStore<T>(read: () => T, deps: unknown[]): T {
  const [value, setValue] = useState<T>(read)

  useEffect(() => {
    const refresh = () => setValue(read())
    refresh()
    window.addEventListener(STORE_UPDATE_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(STORE_UPDATE_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return value
}
