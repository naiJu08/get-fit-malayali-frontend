import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// import WebSocketComponent from './components/app/websocket/index'
import { useSnackbarManager } from './components/common/snackbar'
import MainRoutes from './routes/mainRoutes'
import { useAuthStore } from './store/authStore'
import { useDomainManageStore } from './store/domainManageStore'
// import { useThemeStore } from './store/filterSore/clearStore'
// import useIdleTimeout from './utilities/idleTimer'
import { useThemeStore } from './store/themeStore'
// import useActivityTracker from './utilities/activitytracker'
import {
  useReloadOnStorageChange,
  useTabVisibility,
} from './utilities/visibility'

import './App.css'
import './styles/styles.scss'

const App = () => {
  const { isDark, theme } = useThemeStore()

  const { enqueueSnackbar } = useSnackbarManager()
  const navigate = useNavigate()
  const { clearAuthenticated } = useAuthStore()
  const { domainType } = useDomainManageStore()
  // const handleClear = useClearFilter()

  // const handleLogout = () => {
  //   localStorage.setItem('shouldReload', 'false')
  //   clearAuthenticated()
  //   handleClear()
  // }
  // useActivityTracker(handleLogout, 15 * 60 * 1000)

  useEffect(() => {
    if (domainType === 'Employee') {
      document.title = 'Diversity Mark - Admin Portal'
    } else if (domainType === 'Assessor') {
      document.title = 'Diversity Mark - Assessor Portal'
    } else {
      document.title = 'Diversity Mark - Signatory Portal'
    }
  }, [domainType])

  useEffect(() => {
    const handleSession = () => {
      clearAuthenticated()
      localStorage.clear()
      localStorage.setItem('shouldReload', 'false')
    }

    window.addEventListener('session-expired', handleSession)

    return () => {
      window.removeEventListener('session-expired', handleSession)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])
  // useEffect(() => {
  //   document.documentElement.setAttribute('data-theme', 'dark')
  // }, [])
  useEffect(() => {
    const handleShowSnackbar = (e: any) => {
      const { message, variant } = e?.detail
      enqueueSnackbar(message, { variant })
    }

    window.addEventListener('show-snackbar', handleShowSnackbar)

    return () => {
      window.removeEventListener('show-snackbar', handleShowSnackbar)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enqueueSnackbar])

  // Legacy/fallback handler: return true from window.onerror for specific noisy errors
  useEffect(() => {
    const originalOnError = window.onerror
    window.onerror = function (
      message: any,
      _source,
      _lineno,
      _colno,
      error: any
    ) {
      const msgText = String(message || '')
      const isResizeObserverIssue =
        msgText.includes('ResizeObserver loop limit exceeded') ||
        msgText.includes(
          'ResizeObserver loop completed with undelivered notifications'
        )
      const isAxios = !!(error && (error.isAxiosError || error?.response))
      const looksAxiosMsg = msgText.includes('Request failed with status code')
      if (isResizeObserverIssue || isAxios || looksAxiosMsg) {
        // Swallow; snackbar already handled elsewhere
        return true
      }
      return originalOnError
        ? originalOnError(message, _source, _lineno, _colno, error)
        : false
    }
    return () => {
      window.onerror = originalOnError || null
    }
  }, [enqueueSnackbar])

  // Suppress unhandled promise rejection overlays (e.g., Axios 4xx/5xx)
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Prevent default error overlay
      event.preventDefault()
      try {
        const reason: any = event.reason
        const msg =
          reason?.response?.data?.message ||
          reason?.response?.data?.error?.message ||
          reason?.message ||
          'Request failed'
        enqueueSnackbar(msg, { variant: 'error' })
      } catch {
        enqueueSnackbar('Request failed', { variant: 'error' })
      }
    }
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () =>
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enqueueSnackbar])

  // Suppress Axios errors that bubble to 'error' event and show snackbar instead
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const err: any = event?.error
      const msgText = String(event?.message || '')
      const isResizeObserverIssue =
        msgText.includes('ResizeObserver loop limit exceeded') ||
        msgText.includes(
          'ResizeObserver loop completed with undelivered notifications'
        )
      if (isResizeObserverIssue) {
        // Ignore noisy ResizeObserver errors
        event.preventDefault()
        return
      }
      const isAxios = !!(err && (err.isAxiosError || err?.response))
      const looksAxiosMsg = msgText.includes('Request failed with status code')
      if (isAxios || looksAxiosMsg) {
        event.preventDefault()
        try {
          const msg =
            err?.response?.data?.message ||
            err?.response?.data?.error?.message ||
            err?.message ||
            msgText ||
            'Request failed'
          enqueueSnackbar(msg, { variant: 'error' })
        } catch {
          enqueueSnackbar('Request failed', { variant: 'error' })
        }
        return
      }
    }
    window.addEventListener('error', handleError, { capture: true })
    return () =>
      window.removeEventListener('error', handleError, { capture: true } as any)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enqueueSnackbar])

  window.addEventListener('error', (event) => {
    if (event.error && event.error.name === 'ChunkLoadError') {
      window.location.reload()
    }
  })

  useEffect(() => {
    // Check if the sessionStorage item is set
    const message = sessionStorage.getItem('showSnackbar')
    if (message) {
      // Show the snackbar
      enqueueSnackbar(message, { variant: 'success' })

      // Remove the item so it doesn't show again on refresh
      sessionStorage.removeItem('showSnackbar')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useTabVisibility()
  useReloadOnStorageChange()

  //const { domainType } = useDomainManageStore()
  // if (!handleCheckDomain(domainType)) {
  //   clearAuthenticated()
  //   localStorage.setItem('shouldReload', 'false')
  // }

  // useEffect(() => {
  //   if (!domainType) {
  //     window.location.reload()
  //   }
  // }, [])

  return (
    <div className={`${isDark ? 'dark' : 'light'} ${theme}`}>
      {/* <WebSocketComponent /> */}
      {<MainRoutes />}
    </div>
  )
}

export default App
