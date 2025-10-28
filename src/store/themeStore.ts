import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create<ThemeStoreType>()(
  persist(
    (set) => ({
      isDark: false,
      theme: 'default',
      setTheme: (data) => set(() => ({ theme: data })),
      setIsDark: () => set(() => ({ isDark: true })),
      clearIsDark: () => set(() => ({ isDark: false })),
    }),
    { name: 'theme' }
  )
)

type ThemeStoreType = {
  isDark: boolean
  theme: string
  setIsDark: () => void
  setTheme: (data: string) => void
  clearIsDark: () => void
}
