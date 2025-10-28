// hooks/useIdleTimeout.ts
import { useEffect, useRef } from 'react'

type UseIdleTimeoutProps = {
  timeout: number // Timeout in milliseconds
  onIdle: () => void // Callback to be called after timeout
}

const useIdleTimeout = ({ timeout, onIdle }: UseIdleTimeoutProps) => {
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)

  const resetTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }
    idleTimerRef.current = setTimeout(() => {
      onIdle()
    }, timeout)
  }

  useEffect(() => {
    document.addEventListener('mousemove', resetTimer)
    document.addEventListener('keypress', resetTimer)

    resetTimer() // Set the initial timer

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
      document.removeEventListener('mousemove', resetTimer)
      document.removeEventListener('keypress', resetTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeout, onIdle])
}

export default useIdleTimeout
