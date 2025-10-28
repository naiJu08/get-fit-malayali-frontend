import { create } from 'zustand'

export const useAppStore = create<AppStoreType>()((set) => ({
  activeRouteSlug: 'DASHBOARD',
  isLoading: false,
  menuOpened: true,
  reset_password_token: undefined,
  is_password_expired: undefined,
  setPasswordExpired: (is_authenticated) =>
    set(() => ({ is_password_expired: is_authenticated })),
  underMaintenance: false,
  setUnderMaintenance: (val) => set(() => ({ underMaintenance: val })),
  setIsLoading: (loaderState) => set(() => ({ isLoading: loaderState })),
  setMenuOpened: (menustate) => set(() => ({ menuOpened: menustate })),
  setActiveRouteSlug: (slug) => set(() => ({ activeRouteSlug: slug })),
  openNotification: false,
  setResetToken: (data) => set(() => ({ reset_password_token: data })),
  setOpenNotification: (notification) =>
    set(() => ({ openNotification: notification })),
  clearSensitiveDatas: () =>
    set(() => ({
      reset_password_token: undefined,
      is_password_expired: undefined,
    })),
}))

type AppStoreType = {
  isLoading: boolean | undefined
  menuOpened: boolean | undefined
  setPasswordExpired: (authenticated: boolean | undefined) => void
  reset_password_token: string | undefined
  is_password_expired: boolean | undefined
  activeRouteSlug: string | undefined
  setIsLoading: (loaderState: boolean | undefined) => void
  setMenuOpened: (loaderState: boolean | undefined) => void
  setActiveRouteSlug: (slug: string) => void
  underMaintenance: boolean
  setResetToken: (data: string) => void
  clearSensitiveDatas: () => void
  setUnderMaintenance: (val: boolean) => void
  openNotification: boolean
  setOpenNotification: (value: boolean) => void
}
