import { useEffect } from 'react'

import { useDomainManageStore } from '../store/domainManageStore'
import { useAuthStore } from '../store/authStore'

export const domainTypes: Record<domains, string> = {
  'assessor-portal': 'Assessor',
  'org-portal': 'Organisation',
  'admin-portal': 'Employee',
}

type domains = 'assessor-portal' | 'admin-portal' | 'org-portal'

export const handleCheckDomain = (domain: string): boolean => {
  return (Object.keys(domainTypes) as domains[]).some((key) =>
    domain.includes(key)
  )
}

export const handleSetDomainType = (
  setDomainType: (domainType: string) => void
): void => {
  const url = new URL(window.location.href)
  // const hostname = url.origin
  // const hostname = process.env.REACT_APP_PORTAL_DOMAIN

  const hostname = process.env.REACT_APP_PORTAL_DOMAIN
    ? process.env.REACT_APP_PORTAL_DOMAIN
    : url.origin

  const hasReloaded = localStorage.getItem('hasReloaded')

  if (hasReloaded !== 'true') {
    localStorage.clear()
    localStorage.setItem('hasReloaded', 'true')
  }
  for (const key in domainTypes) {
    if (hostname.includes(key)) {
      setTimeout(() => {
        setDomainType(domainTypes[key as keyof typeof domainTypes])
        if (hasReloaded !== 'true') {
          localStorage.setItem('shouldReload', 'false')
        }
      }, 500)
      return
    }
  }
}

export const useSetDomainTypeFromUrl = () => {
  const { setDomainType } = useDomainManageStore()
  const { authenticated } = useAuthStore()
  useEffect(() => {
    if (!authenticated) handleSetDomainType(setDomainType)

    return () => {
      localStorage.removeItem('hasReloaded')
      // localStorage.setItem('shouldReload', 'false')
    }
  }, [setDomainType, authenticated])
}
