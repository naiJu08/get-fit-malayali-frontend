import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { AdvanceFilter, StoreFilterParams } from '../../common/types'
import { defaultPageParams } from '../constants'

const defaultParams = [
  { title: 'Created Date', slug: 'created_date', isChecked: false },
  { title: 'Created By', slug: 'created_by', isChecked: false },
]

export const useAdminUserFilterStore = create<AdminUserFilterstoreType>()(
  persist(
    (set) => ({
      pageParams: defaultPageParams,
      advanceFilter: {
        filterParams: defaultParams,
        isDetailed: true,
      },
      selectedRows: [],

      setAdvanceFilter: (data) => set(() => ({ advanceFilter: data })),
      clearSelectedRows: () => set({ selectedRows: [] }),
      setPageParams: (data) => set(() => ({ pageParams: data })),
      clearAdvanceFilter: () =>
        set(() => ({
          advanceFilter: {
            filterParams: defaultParams?.map((item) => ({
              ...item,
              isChecked: false,
            })),
            isDetailed: true,
          },
        })),
      setSelectedRows: (data) => set(() => ({ selectedRows: data })),
      clearAdminUserFilter: (key) =>
        set((state) => ({
          pageParams: key
            ? { ...defaultPageParams, search: state?.pageParams?.search }
            : defaultPageParams,
        })),
      resetStore: () =>
        set(() => ({
          pageParams: defaultPageParams,
          advanceFilter: {
            filterParams: defaultParams,
            isDetailed: true,
          },
          selectedRows: [],
          search: '',
        })),
    }),
    { name: 'fit__admin_user_store' }
  )
)

type AdminUserFilterstoreType = {
  pageParams: StoreFilterParams
  selectedRows?: (number | string)[]
  advanceFilter: AdvanceFilter
  setSelectedRows: (data: (number | string)[]) => void
  setPageParams: (data: StoreFilterParams) => void
  setAdvanceFilter: (data: AdvanceFilter) => void
  clearAdminUserFilter: (key?: string) => void
  clearSelectedRows: () => void
  clearAdvanceFilter: () => void
  resetStore: () => void
}
