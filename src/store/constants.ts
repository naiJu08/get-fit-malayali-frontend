import { StoreFilterParams } from '../common/types'

export const defaultPageParams: StoreFilterParams = {
  page: 1,
  page_size: 30,
  search: '',
  ordering: '',
  filters: {},
  sortType: 'asc',
  sortColumn: '',
  filterProps: {},
}
