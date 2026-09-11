import type { StateStorage } from 'zustand/middleware'

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days
const isBrowser = typeof window !== 'undefined'
const isSecureContext = isBrowser && window.location.protocol === 'https:'

const getCookie = (name: string) => {
  if (!isBrowser) {
    return null
  }

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[-.[\]{}()*+?^$|]/g, '\\$&')}=([^;]*)`)
  )

  return match ? decodeURIComponent(match[1]) : null
}

const setCookie = (
  name: string,
  value: string,
  maxAge = COOKIE_MAX_AGE_SECONDS
) => {
  if (!isBrowser) {
    return
  }

  const secure = isSecureContext ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; Path=/; Max-Age=${maxAge}; SameSite=Strict${secure}`
}

const removeCookie = (name: string) => {
  if (!isBrowser) {
    return
  }

  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Strict`
}

export const cookieStorage: StateStorage = {
  getItem: (name: string) => getCookie(name),
  setItem: (name: string, value: string) => setCookie(name, value),
  removeItem: (name: string) => removeCookie(name),
}
