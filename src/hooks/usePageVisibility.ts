import { useState, useEffect } from 'react'

function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState<boolean>(!document.hidden)

  useEffect(() => {
    function handleVisibilityChange() {
      setIsVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return isVisible
}

export default usePageVisibility
