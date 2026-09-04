import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SnackbarProvider } from 'notistack'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import { SnackbarManagerProvider } from './components/common/snackbar'
import reportWebVitals from './reportWebVitals'

import './styles/styles.scss'
import './polyfills/resizeObserver'

const isResizeObserverLoopError = (args: any[]) => {
  const msg = args
    .map((a) => {
      try {
        return typeof a === 'string' ? a : JSON.stringify(a)
      } catch {
        return String(a)
      }
    })
    .join(' ')
  return (
    msg.includes(
      'ResizeObserver loop completed with undelivered notifications'
    ) || msg.includes('ResizeObserver loop limit exceeded')
  )
}

const originalConsoleWarn = console.warn
console.warn = (...args: any[]) => {
  if (isResizeObserverLoopError(args)) return
  originalConsoleWarn(...args)
}

const isResizeObserverLoopMessage = (message?: unknown) => {
  const msg = String(message || '')
  return (
    msg.includes(
      'ResizeObserver loop completed with undelivered notifications'
    ) || msg.includes('ResizeObserver loop limit exceeded')
  )
}

const isResizeObserverLoopEvent = (event: any) => {
  return (
    isResizeObserverLoopMessage(event?.message) ||
    isResizeObserverLoopMessage(event?.error?.message) ||
    isResizeObserverLoopMessage(event?.reason?.message) ||
    isResizeObserverLoopMessage(event?.reason)
  )
}

window.addEventListener(
  'error',
  (event) => {
    if (isResizeObserverLoopEvent(event as any)) {
      event.preventDefault()
      event.stopImmediatePropagation?.()
    }
  },
  true
)

window.addEventListener(
  'unhandledrejection',
  (event) => {
    if (isResizeObserverLoopEvent(event as any)) {
      event.preventDefault()
      event.stopImmediatePropagation?.()
    }
  },
  true
)

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
      useErrorBoundary: false,
      // Prevent throwing to React error overlay
      throwOnError: false,
    },
  },
})
root.render(
  <BrowserRouter>
    {/* <React.StrictMode> */}
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <QueryClientProvider client={queryClient}>
        <SnackbarManagerProvider>
          <App />
        </SnackbarManagerProvider>
      </QueryClientProvider>
    </SnackbarProvider>
    {/* </React.StrictMode> */}
  </BrowserRouter>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
