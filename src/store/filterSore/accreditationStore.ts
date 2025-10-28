import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { AdvanceFilter, StoreFilterParams } from '../../common/types'
import { defaultPageParams } from '../constants'

const defaultParams = [
  { title: 'Accreditation', slug: 'accreditation', isChecked: false },
  { title: 'Organisation', slug: 'org_name', isChecked: false },
  // { title: 'Assessor Tier', slug: 'customer_tier', isChecked: false },
  // { title: 'Address 1: Country', slug: 'country', isChecked: false },
  // { title: 'Address 1: State', slug: 'state', isChecked: false },
  // { title: 'Created By', slug: 'created_by', isChecked: false },
  // { title: 'Team', slug: 'team', isChecked: false },
]

export const useAccreditationFilterStore =
  create<AccreditationFilterstoreType>()(
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
        clearAccreditationFilter: (key) =>
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
      { name: 'filt_accred_store' }
    )
  )

type AccreditationFilterstoreType = {
  pageParams: StoreFilterParams
  selectedRows?: (number | string)[]
  advanceFilter: AdvanceFilter
  setSelectedRows: (data: (number | string)[]) => void
  setPageParams: (data: StoreFilterParams) => void
  setAdvanceFilter: (data: AdvanceFilter) => void
  clearAccreditationFilter: (key?: string) => void
  clearSelectedRows: () => void
  clearAdvanceFilter: () => void
  resetStore: () => void
}
