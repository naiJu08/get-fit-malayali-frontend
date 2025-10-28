import { useEffect } from 'react'

export const useTabVisibility = () => {
  useEffect(() => {
    let lastHiddenTime = Date.now()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const currentTime = Date.now()

        if (currentTime - lastHiddenTime > 10 * 60 * 1000) {
          window.location.reload()
        }
      } else {
        lastHiddenTime = Date.now()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
}
export const useReloadOnStorageChange = () => {
  useEffect(() => {
    const handleStorageChange = (event: any) => {
      if (event.key === 'shouldReload') {
        window.open('/', '_self')
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])
}
