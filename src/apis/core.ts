import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'

import { useAuthStore } from '../store/authStore'
import { domainTypes, useDomainManageStore } from '../store/domainManageStore'

const domainSwitch = () => {
  const domainType = useDomainManageStore.getState().domainType
  switch (domainType) {
    case domainTypes.EMPLOYEE:
      return process.env.REACT_APP_BASE_URL
    case domainTypes.ASSESSOR:
      return process.env.REACT_APP_ASSESSOR_BASE_URL
    case domainTypes.ORGANISATION:
      return process.env.REACT_APP_ORGANISATION_BASE_URL
    default:
      return process.env.REACT_APP_BASE_URL
  }
}
const serverApi = axios.create({
  baseURL: domainSwitch(),
})
let errorSnackbarTimeout: any = null
// const responseCache = new Map()

// function generateCacheKey(url: string, headers: any) {
//   const headerKeys = ['Your-Header-Key'] // Specify the header keys that affect caching
//   const headerValues = headerKeys.map((key) => headers[key]).join('|')
//   return `${url}?${headerValues}`
// }
const showError = (message: string) => {
  // Clear the existing timeout if it exists
  if (errorSnackbarTimeout) {
    clearTimeout(errorSnackbarTimeout)
  }

  // Set a new timeout
  errorSnackbarTimeout = setTimeout(() => {
    const event = new CustomEvent('show-snackbar', {
      detail: { message, variant: 'error' },
    })
    window.dispatchEvent(event)
  }, 300) // 300 milliseconds debounce period
}
window.addEventListener('navigate', (event) => {
  const customEvent = event as CustomEvent<{ path: string }>
  const path = customEvent.detail.path
  window.location.href = path
})
const navigateToHome = () => {
  const event = new CustomEvent('navigate', { detail: { path: '/' } })
  window.dispatchEvent(event)
  // window.location.href = '/'
}
const handleSession = () => {
  const event = new CustomEvent('session-expired', { detail: { path: '/' } })
  window.dispatchEvent(event)
}
const handleMaintenanceSession = () => {
  const event = new CustomEvent('maintenance-session', {
    detail: { path: '/' },
  })
  window.dispatchEvent(event)
}
// Response interceptor
serverApi.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (err: AxiosError) => {
    if (axios.isAxiosError(err) && err.response) {
      // Swallow 409 (Conflict) responses: show red snackbar and pass through as resolved to avoid runtime overlays
      if (err.response.status === 409) {
        const errorObject: any = err.response.data
        const message =
          errorObject?.message || errorObject?.error?.message || 'Conflict'
        showError(message)
        // Pass the response along as resolved to prevent runtime overlay
        return Promise.resolve(err.response as any)
      }
      if (err.response.status && err.response.status === 404) {
        const errorObject: any = err.response.data
        showError(errorObject?.error?.message ?? 'Page not found')
        setTimeout(() => {
          navigateToHome()
        }, 1000)

        return
      }
      if (err.response.status && err.response.status === 401) {
        handleSession()
        // showError('Authentication failed')
      }
      if (err.response.status && err.response.status === 503) {
        handleMaintenanceSession()
      }

      return Promise.reject(err)
    }
    return Promise.reject(err)
  }
)
// axios.interceptors.request.use(
//   (config) => {
//     const cacheKey = generateCacheKey(config.url, config.headers)
//     if (responseCache.has(cacheKey)) {
//       const cached = responseCache.get(cacheKey)

//       // Return cached response as a promise
//       return Promise.resolve(cached)
//     }

//     return config // Proceed with the request if no cache is found
//   },
//   (error) => Promise.reject(error)
// )

// // Response interceptor to cache responses
// axios.interceptors.response.use(
//   (response) => {
//     const cacheKey = generateCacheKey(
//       response.config.url,
//       response.config.headers
//     )

//     // Cache the response
//     responseCache.set(cacheKey, response)

//     return response
//   },
//   (error) => Promise.reject(error)
// )

// Request interceptor
serverApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token

    const franchisee = useAuthStore.getState().franchisee
    const impersonate = useAuthStore.getState().impersonating
    const userData = useAuthStore.getState().userData
    config.headers = config.headers || {}

    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data'
    } else {
      config.headers['Content-Type'] = 'application/json'
    }
    if (franchisee) {
      config.headers['Franchisee'] = franchisee?.id
      config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    }
    if (impersonate) {
      config.headers['IMPERSONATE-ID'] = userData?.id
    }
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    return config
  },
  (error: any) => Promise.reject(error)
)

export default serverApi
