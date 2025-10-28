import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { AdvanceFilter, StoreFilterParams } from '../../common/types'
import { defaultPageParams } from '../constants'

const defaultParams = [
  { title: 'Created Date', slug: 'created_date', isChecked: false },
  /*{ title: 'Active Orders', slug: 'active_orders', isChecked: false },
  { title: 'Total Orders', slug: 'total_orders', isChecked: false },
  { title: 'Amount Due', slug: 'amount_due', isChecked: false },
  {
    title: 'Life Time Sales',
    slug: 'life_time_sales',
    isChecked: false,
  },*/
  { title: 'Account Tier', slug: 'account_tier', isChecked: false },
  { title: 'Sector', slug: 'sector', isChecked: false },
  { title: 'Industry', slug: 'industry', isChecked: false },
  { title: 'Sub-Sector', slug: 'sub_sector', isChecked: false },
  { title: 'Lead Source', slug: 'lead_source', isChecked: false },
  { title: 'Address 1: Country', slug: 'country', isChecked: false },
  { title: 'Address 1: State', slug: 'state', isChecked: false },
  { title: 'Created By', slug: 'created_by', isChecked: false },
  { title: 'Team', slug: 'team', isChecked: false },
]
export const useAccountFilterStore = create<AccountFilterstoreType>()(
  persist(
    (set) => ({
      pageParams: defaultPageParams,
      advanceFilter: {
        filterParams: defaultParams,
        isDetailed: true,
      },
      selectedRows: [],

      setAdvanceFilter: (data) => set(() => ({ advanceFilter: data })),
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
      clearSelectedRows: () => set({ selectedRows: [] }),
      clearAccountFilter: (key) =>
        set((state) => ({
          pageParams: key
            ? { ...defaultPageParams, search: state?.pageParams?.search }
            : defaultPageParams,
        })),
    }),
    { name: 'fit__acc_store' }
  )
)

type AccountFilterstoreType = {
  advanceFilter: AdvanceFilter
  pageParams: StoreFilterParams
  selectedRows?: (number | string)[]

  setAdvanceFilter: (data: AdvanceFilter) => void
  setSelectedRows: (data: (number | string)[]) => void
  setPageParams: (data: StoreFilterParams) => void
  clearAccountFilter: (key?: string) => void
  clearSelectedRows: () => void
  clearAdvanceFilter: () => void
}
