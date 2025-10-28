// hooks/useActivityTracker.ts
import { useEffect } from 'react'

const useActivityTracker = (onInactive: () => void, timeout: number) => {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const resetTimer = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(onInactive, timeout)
    }

    const events = [
      'load',
      'mousemove',
      'mousedown',
      'click',
      'scroll',
      'keypress',
    ]

    events.forEach((event) => window.addEventListener(event, resetTimer))

    resetTimer()

    return () => {
      clearTimeout(timeoutId)
      events.forEach((event) => window.removeEventListener(event, resetTimer))
    }
  }, [onInactive, timeout])
}

export default useActivityTracker
