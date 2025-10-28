import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { AdvanceFilter, StoreFilterParams } from '../../common/types'
import { defaultPageParams } from '../constants'

const defaultParams = [
  { title: 'Created Date', slug: 'created_date', isChecked: false },
  { title: 'Created By', slug: 'created_by', isChecked: false },
]

export const organizationFileRepositoryFilterStore =
  create<OrganizationFileRepositoryFilterStoreType>()(
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
        clearOrgFileFilter: (key) =>
          set((state) => ({
            pageParams: key
              ? { ...defaultPageParams, search: state?.pageParams?.search }
              : defaultPageParams,
          })),
      }),
      { name: 'fit__file_repo_store' }
    )
  )

type OrganizationFileRepositoryFilterStoreType = {
  pageParams: StoreFilterParams
  selectedRows?: (number | string)[]
  advanceFilter: AdvanceFilter
  setSelectedRows: (data: (number | string)[]) => void
  setPageParams: (data: StoreFilterParams) => void
  setAdvanceFilter: (data: AdvanceFilter) => void
  clearOrgFileFilter: (key?: string) => void
  clearSelectedRows: () => void
  clearAdvanceFilter: () => void
}
