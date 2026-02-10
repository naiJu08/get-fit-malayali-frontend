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
// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (reason?: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Response interceptor
serverApi.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (err: AxiosError) => {
    const originalRequest: any = err.config

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
        const refreshToken = useAuthStore.getState().refreshToken
        const refreshTokenExpiresAt =
          useAuthStore.getState().refreshTokenExpiresAt

        // Don't intercept if this is the refresh token endpoint itself - it means refresh token is invalid
        if (originalRequest.url?.includes('/auth/refresh_token')) {
          console.log('[401] Refresh token endpoint failed - logging out')
          const errorObject: any = err.response.data
          const errorMessage =
            errorObject?.message ||
            errorObject?.error?.message ||
            'Your session has expired. Please login again.'
          showError(errorMessage)
          useAuthStore.getState().clearAuthenticated()
          handleSession()
          return Promise.reject(err)
        }

        // If no refresh token, just reject - don't logout yet
        if (!refreshToken) {
          console.log('[401] No refresh token available')
          return Promise.reject(err)
        }

        // Check if refresh token has expired
        if (refreshTokenExpiresAt && Date.now() >= refreshTokenExpiresAt) {
          console.log('[401] Refresh token has expired - logging out')
          showError('Your session has expired. Please login again.')
          useAuthStore.getState().clearAuthenticated()
          handleSession()
          return Promise.reject(err)
        }

        // If already retried, just reject - the refresh already failed
        if (originalRequest._retry) {
          console.log('[401] Already retried - request failed')
          return Promise.reject(err)
        }

        // If refresh is already in progress, queue this request
        if (isRefreshing) {
          console.log('[401] Refresh in progress - queueing request')
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          })
            .then((token) => {
              originalRequest.headers['Authorization'] = 'Bearer ' + token
              return serverApi(originalRequest)
            })
            .catch((err) => {
              return Promise.reject(err)
            })
        }

        // Start refresh process
        console.log('[401] Starting token refresh...')
        originalRequest._retry = true
        isRefreshing = true

        try {
          // Call refresh token endpoint using a fresh axios instance without interceptors
          const refreshAxios = axios.create({
            baseURL: domainSwitch(),
          })

          console.log(
            '[401] Calling refresh endpoint with token:',
            refreshToken?.substring(0, 10) + '...'
          )

          const response = await refreshAxios.post('/auth/refresh_token', {
            refresh_token: refreshToken,
          })

          console.log('[401] Refresh response:', response.data)

          const newAccessToken =
            response.data?.token || response.data?.access_token
          const newRefreshToken = response.data?.refresh_token
          const expiresIn = response.data?.expires_in
          const refreshExpiresIn = response.data?.refresh_expires_in

          if (newAccessToken) {
            console.log('[401] Token refresh successful! New token received')
            // Update tokens in store
            useAuthStore.getState().setToken(newAccessToken)
            if (newRefreshToken) {
              useAuthStore.getState().setRefreshToken(newRefreshToken)
            }
            if (expiresIn) {
              const expiresAt = Date.now() + expiresIn * 1000
              useAuthStore.getState().setTokenExpiresAt(expiresAt)
            }
            // Update refresh token expiry
            if (refreshExpiresIn) {
              const refreshExpiresAt = Date.now() + refreshExpiresIn * 1000
              useAuthStore.getState().setRefreshTokenExpiresAt(refreshExpiresAt)
            } else if (expiresIn) {
              const refreshExpiresAt = Date.now() + expiresIn * 7 * 1000
              useAuthStore.getState().setRefreshTokenExpiresAt(refreshExpiresAt)
            }

            // Update the failed request with new token
            originalRequest.headers['Authorization'] =
              `Bearer ${newAccessToken}`

            // Process queued requests
            processQueue(null, newAccessToken)

            // Retry the original request
            return serverApi(originalRequest)
          } else {
            throw new Error('No token received')
          }
        } catch (refreshError: any) {
          console.error('[401] Token refresh failed:', refreshError)
          processQueue(refreshError, null)

          // Show user-friendly error message
          const errorMessage =
            refreshError?.response?.data?.message ||
            refreshError?.response?.data?.error?.message ||
            'Your session has expired. Please login again.'
          showError(errorMessage)

          useAuthStore.getState().clearAuthenticated()
          handleSession()
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
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

// Helper function to refresh token
const refreshAccessToken = async () => {
  const refreshToken = useAuthStore.getState().refreshToken
  const refreshTokenExpiresAt = useAuthStore.getState().refreshTokenExpiresAt

  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  // Check if refresh token has expired
  if (refreshTokenExpiresAt && Date.now() >= refreshTokenExpiresAt) {
    console.log('[Refresh] Refresh token has expired')
    useAuthStore.getState().clearAuthenticated()
    handleSession()
    throw new Error('Refresh token expired')
  }

  try {
    const refreshAxios = axios.create({
      baseURL: domainSwitch(),
    })

    const response = await refreshAxios.post('/auth/refresh_token', {
      refresh_token: refreshToken,
    })

    const newAccessToken = response.data?.token || response.data?.access_token
    const newRefreshToken = response.data?.refresh_token
    const expiresIn = response.data?.expires_in
    const refreshExpiresIn = response.data?.refresh_expires_in

    if (newAccessToken) {
      useAuthStore.getState().setToken(newAccessToken)
      if (newRefreshToken) {
        useAuthStore.getState().setRefreshToken(newRefreshToken)
      }
      if (expiresIn) {
        const expiresAt = Date.now() + expiresIn * 1000
        useAuthStore.getState().setTokenExpiresAt(expiresAt)
      }
      // Update refresh token expiry
      if (refreshExpiresIn) {
        const refreshExpiresAt = Date.now() + refreshExpiresIn * 1000
        useAuthStore.getState().setRefreshTokenExpiresAt(refreshExpiresAt)
      } else if (expiresIn) {
        const refreshExpiresAt = Date.now() + expiresIn * 7 * 1000
        useAuthStore.getState().setRefreshTokenExpiresAt(refreshExpiresAt)
      }
      return newAccessToken
    }

    throw new Error('No token received from refresh')
  } catch (error: any) {
    // Only clear auth and show session expired if it's a 401 error
    if (error?.response?.status === 401) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        'Your session has expired. Please login again.'
      showError(errorMessage)
      useAuthStore.getState().clearAuthenticated()
      handleSession()
    }
    throw error
  }
}

// Request interceptor
serverApi.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip token check for refresh token endpoint
    if (config.url?.includes('/auth/refresh_token')) {
      return config
    }

    const token = useAuthStore.getState().token
    const tokenExpiresAt = useAuthStore.getState().tokenExpiresAt
    const refreshToken = useAuthStore.getState().refreshToken
    const refreshTokenExpiresAt = useAuthStore.getState().refreshTokenExpiresAt

    console.log('[Token Check]', {
      hasToken: !!token,
      hasRefreshToken: !!refreshToken,
      tokenExpiresAt,
      refreshTokenExpiresAt,
      currentTime: Date.now(),
      timeUntilExpiry: tokenExpiresAt ? tokenExpiresAt - Date.now() : null,
      timeUntilRefreshExpiry: refreshTokenExpiresAt
        ? refreshTokenExpiresAt - Date.now()
        : null,
    })

    // Check if token is about to expire (within 5 minutes)
    const bufferTime = 5 * 60 * 1000 // 5 minutes in milliseconds
    const isTokenExpiringSoon =
      tokenExpiresAt && Date.now() + bufferTime >= tokenExpiresAt
    const isRefreshTokenExpired =
      refreshTokenExpiresAt && Date.now() >= refreshTokenExpiresAt

    console.log('[Token Expiry Check]', {
      isTokenExpiringSoon,
      isRefreshTokenExpired,
      bufferTime,
      isRefreshing,
    })

    // Proactively refresh token if it's expiring soon and refresh token is still valid
    if (
      isTokenExpiringSoon &&
      refreshToken &&
      !isRefreshing &&
      !isRefreshTokenExpired
    ) {
      console.log('[Proactive Refresh] Starting token refresh...')
      try {
        const newToken = await refreshAccessToken()
        console.log('[Proactive Refresh] Success! New token received')
        config.headers = config.headers || {}
        config.headers['Authorization'] = `Bearer ${newToken}`
      } catch (error) {
        // If refresh fails, let the request proceed and handle 401 in response interceptor
        console.error('[Proactive Refresh] Failed:', error)
      }
    }

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
    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    return config
  },
  (error: any) => Promise.reject(error)
)

export default serverApi
