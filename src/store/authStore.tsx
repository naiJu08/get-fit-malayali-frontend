import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create<AuthStoreType>()(
  persist(
    (set) => ({
      authenticated: undefined,

      token: undefined,
      setAuthenticated: (is_authenticated) =>
        set(() => ({ authenticated: is_authenticated })),
      impersonating: undefined,
      setImpersonating: (is_impersonating) =>
        set(() => ({ impersonating: is_impersonating })),
      actualeUser: {},
      setActualUser: (data) => set(() => ({ actualeUser: data })),
      userData: {},
      permissionData: [],
      roleData: {},
      franchisee: '',
      setFranchisee: (id) => set(() => ({ franchisee: id })),
      setToken: (data) => set(() => ({ token: data })),
      setUserData: (data) => set(() => ({ userData: data })),
      setRoleData: (data) => set(() => ({ roleData: data })),
      setPermissionData: (data) => set(() => ({ permissionData: data })),
      clearAuthenticated: () =>
        set(() => ({
          authenticated: undefined,
          userData: {},
          roleData: {},
          permissionData: [],
          token: undefined,
        })),
    }),
    { name: 'authenticated' }
  )
)

type AuthStoreType = {
  franchisee: any
  setFranchisee: (id: string) => void
  authenticated: boolean | undefined
  token: string | undefined
  setAuthenticated: (authenticated: boolean | undefined) => void
  impersonating: boolean | undefined
  setImpersonating: (impersonating: boolean | undefined) => void
  clearAuthenticated: () => void
  userData: UserDataProps
  roleData: RoleDataProps
  permissionData: PermissionDataProps[]
  setUserData: (data: UserDataProps) => void
  setActualUser: (data: UserDataProps) => void
  actualeUser: UserDataProps
  setToken: (data: string) => void
  setRoleData: (data: RoleDataProps) => void
  setPermissionData: (data: PermissionDataProps[]) => void
}

export interface UserDataProps {
  id?: string | null
  name?: string | null
  is_admin?: string | null | boolean
  is_operations_head?: string | null
  is_team_lead?: string | null
  email?: string | null
  email_2?: string | null
  first_name?: string | null
  last_name?: string | null
  mobile?: string | null
  mobile_2?: string | null
  username?: string | null
}

export interface RoleDataProps {
  id?: string | null
  name?: string | null
}

export interface PermissionDataProps {
  acl?: string
  codename?: string
  id?: number
}
