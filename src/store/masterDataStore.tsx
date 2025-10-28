import { create } from 'zustand'
import { persist } from 'zustand/middleware'
export const useMasterData = create<MasterCollection>()(
  persist(
    (set) => ({
      masterData: {},
      setMasterData: (data) => set(() => ({ masterData: data })),
    }),
    { name: 'master__collection' }
  )
)

type MasterCollection = {
  masterData: {
    [key: string]: any[]
  }
  setMasterData: (data: any) => void
}
