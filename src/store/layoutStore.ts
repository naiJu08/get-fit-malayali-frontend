import { create } from 'zustand'

type LayoutType = 'headerNav' | 'sideNav'

export const useLayoutStore = create<LayoutStoreType>()((set) => ({
  setLayoutType: (val) => set(() => ({ layoutType: val })),
  layoutType: 'sideNav',

  setExpand: (val) => set(() => ({ expand: val })),
  expand: true,
}))

type LayoutStoreType = {
  layoutType: 'headerNav' | 'sideNav'
  setLayoutType: (val: LayoutType) => void

  expand: boolean
  setExpand: (val: boolean) => void
}
