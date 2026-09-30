import { create } from 'zustand'

import { StoreFilterParams } from '../../common/types'
import { defaultPageParams } from '../constants'

type PlanFilterStore = {
  pageParams: StoreFilterParams
  selectedRows: (number | string)[]
  setPageParams: (data: StoreFilterParams) => void
  setSelectedRows: (data: (number | string)[]) => void
  reset: () => void
}

export const usePlanFilterStore = create<PlanFilterStore>((set) => ({
  pageParams: { ...defaultPageParams },
  selectedRows: [],
  setPageParams: (data) => set(() => ({ pageParams: data })),
  setSelectedRows: (data) => set(() => ({ selectedRows: data })),
  reset: () =>
    set(() => ({
      pageParams: { ...defaultPageParams },
      selectedRows: [],
    })),
}))
