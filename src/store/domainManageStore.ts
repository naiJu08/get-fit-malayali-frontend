import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const domainTypes = {
  EMPLOYEE: 'Employee',
  ASSESSOR: 'Assessor',
  ORGANISATION: 'Organisation',
  NUTRITIONIST: 'Nutritionist',
} as const

export type DomainType = string

type DomainManageStore = {
  domainType: DomainType | ''
  setDomainType: (domainType: DomainType) => void
}

export const useDomainManageStore = create<DomainManageStore>()(
  persist(
    (set) => ({
      domainType: '',
      setDomainType: (domainType) => set({ domainType }),
    }),
    { name: 'domain-manage' }
  )
)
