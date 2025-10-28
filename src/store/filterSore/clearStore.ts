import { useAccountFilterStore } from './accountStore'
import { useAccreditationFilterStore } from './accreditationStore'
import { useAdminUserFilterStore } from './adminUserStore'
import { useAssessorFilterStore } from './assessorStore'
import { useOrganisationFilterStore } from './OrganisationStore'
import { organizationFileRepositoryFilterStore } from './fileRepositoryStore'

export function useClearFilter(type?: string) {
  const accountStore = useAccountFilterStore()
  const accreditationStore = useAccreditationFilterStore()
  const adminUserStore = useAdminUserFilterStore()
  const assessorStore = useAssessorFilterStore()
  const organisationStore = useOrganisationFilterStore()
  const organisationFileStore = organizationFileRepositoryFilterStore()

  const stores = [
    {
      store: accountStore,
      clearFilter: 'clearAccountFilter',
      clearRows: 'clearSelectedRows',
      clearAdvacneFilter: 'clearAdvanceFilter',
    },
    {
      store: accreditationStore,
      clearFilter: 'clearAccreditationFilter',
      clearRows: 'clearSelectedRows',
      clearAdvacneFilter: 'clearAdvanceFilter',
    },
    {
      store: adminUserStore,
      clearFilter: 'clearAdminUserFilter',
      clearRows: 'clearSelectedRows',
      clearAdvacneFilter: 'clearAdvanceFilter',
    },
    {
      store: assessorStore,
      clearFilter: 'clearAssessorFilter',
      clearRows: 'clearSelectedRows',
      clearAdvacneFilter: 'clearAdvanceFilter',
    },
    {
      store: organisationStore,
      clearFilter: 'clearOrganisationFilter',
      clearRows: 'clearSelectedRows',
      clearAdvacneFilter: 'clearAdvanceFilter',
    },
    {
      store: organisationFileStore,
      clearFilter: 'clearOrgFileFilter',
      clearRows: 'clearSelectedRows',
      clearAdvacneFilter: 'clearAdvanceFilter',
    },
  ]

  if (type == 'filter_only') {
    return () => {
      stores.forEach(({ store, clearFilter, clearAdvacneFilter }) => {
        if (typeof (store as any)[clearFilter] === 'function') {
          ;(store as any)[clearFilter]('from_filter')
        }
        if (typeof (store as any)[clearAdvacneFilter] === 'function') {
          ;(store as any)[clearAdvacneFilter]()
        }
      })
    }
  } else {
    return () => {
      stores.forEach(
        ({ store, clearFilter, clearRows, clearAdvacneFilter }) => {
          if (typeof (store as any)[clearFilter] === 'function') {
            ;(store as any)[clearFilter]()
          }
          if (typeof (store as any)[clearRows] === 'function') {
            ;(store as any)[clearRows]()
          }
          if (typeof (store as any)[clearAdvacneFilter] === 'function') {
            ;(store as any)[clearAdvacneFilter]()
          }
        }
      )
    }
  }
}
export {}
