import SmartTable from '../../components/common/table/SmartTable'
import { useEffect, useRef, useState } from 'react'
import { TableColumns } from '../../common/types'
import InfoBox from '../../components/app/alertBox/infoBox'
import DynamicDropdown from '../../components/common/DynamicDropdown'
import ListingHeader from '../../components/common/ListingTiles'
import { useAdminUserFilterStore } from '../../store/filterSore/adminUserStore'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { getSortedColumnName } from '../../utilities/parsers'
import { handleReturnEmptyMsg } from '../../utilities/validation'
import { getData } from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import { useAdminUser, DISABLE_NONLOGIN_APIS } from './api'
import { getColumns } from './columns'
export default function Subscriptions() {
  const [columns, setColumns] = useState<TableColumns[]>([])
  const [planIdFilter, setPlanIdFilter] = useState<string>('')
  const [planLabel, setPlanLabel] = useState<string>('All Plans')
  const [plansCache, setPlansCache] = useState<Record<string, string>>({})
  const { pageParams, setPageParams } = useAdminUserFilterStore()
  const { page, page_size, search, ordering, filters } = pageParams
  const searchParams = {
    page: page,
    per_page: page_size,
    search: search,
    ordering: ordering,
    ...filters,
  }

  const didInitRef = useRef(false)
  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true
      setPlanIdFilter('')
      setPlanLabel('All Plans')
      setPageParams({ ...pageParams, search: '', filters: {}, page: 1 })
    }
  }, [])

  useEffect(() => {
    const planFromStore = (filters as any)?.plan_id
    setPlanIdFilter(planFromStore ? String(planFromStore) : '')
    if (planFromStore) {
      const cached = plansCache[String(planFromStore)]
      if (cached) {
        setPlanLabel(cached)
      } else {
        resolvePlanLabel(planFromStore)
      }
    } else {
      setPlanLabel('All Plans')
    }
  }, [filters])

  const resolvePlanLabel = async (id?: number | string) => {
    if (!id) {
      setPlanLabel('All Plans')
      return
    }
    try {
      const res: any = await getData(`${apiUrl.PLANS}/${id}`)
      const name =
        res?.name ?? res?.plan_name ?? res?.data?.name ?? res?.data?.plan_name
      if (name) setPlanLabel(String(name))
    } catch {}
  }

  const { data, isFetching } = useAdminUser(searchParams)
  const onChangePage = (row: number) => {
    setPageParams({
      ...pageParams,
      page: row,
    })
  }
  const onChangeRowsPerPage = (count: number | string) => {
    setPageParams({
      ...pageParams,
      page_size: count,
      page: 1,
    })
  }
  useEffect(() => {
    setColumns(getColumns())
  }, [])

  const handleSeach = (key?: string) => {
    setPageParams({
      ...pageParams,
      search: key as string,
      page: 1,
    })
  }

  const applyPlanFilter = (val?: string) => {
    const value = typeof val === 'string' ? val : planIdFilter
    const nextFilters: any = { ...(pageParams?.filters || {}) }
    if (value?.trim()) {
      nextFilters.plan_id = Number(value)
    } else {
      delete nextFilters.plan_id
    }
    setPageParams({
      ...pageParams,
      filters: nextFilters,
      page: 1,
    })
  }

  // status filter removed

  const getPlansDropdown = async (search: string, pageNum: number) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('per_page', '1000')
    if (pageNum) params.set('page', String(pageNum))
    const url = `${apiUrl.PLANS}?${params.toString()}`
    const res = await getData(url)
    const items: any[] = Array.isArray(res)
      ? (res as any[])
      : (res?.items ?? res?.plans ?? [])
    const mapped = items.map((p: any) => ({
      id: p?.id,
      value: p?.name ?? p?.plan_name ?? 'Plan',
    }))
    const nextCache: Record<string, string> = { ...plansCache }
    for (const it of mapped) {
      if (it?.id != null) nextCache[String(it.id)] = it.value
    }
    setPlansCache(nextCache)
    return [{ id: null, value: 'All Plans' }, ...mapped]
  }

  const basicData = {
    title: 'Payment History',
    icon: 'paymentapproval-icon',
  }

  const handleSort = (orderColumn: any, orderDirection: any) => {
    setPageParams({
      ...pageParams,
      sortColumn: orderColumn,
      sortType: orderDirection,
      ordering: getSortedColumnName(orderColumn, orderDirection),
    })
  }

  // No actions or destructive operations on this page
  return (
    <div>
      {DISABLE_NONLOGIN_APIS ? (
        <div className="p-6">
          <InfoBox content={'This section is disabled for this build.'} />
        </div>
      ) : (
        <>
          <ListingHeader data={basicData} checkPermission={false} />
          <div className=" p-4">
            <SmartTable
              data={data?.items ?? []}
              dataRowKey="id"
              toolbar={true}
              search={true}
              searchValue={pageParams?.search || ''}
              onSearchChange={(val) =>
                setPageParams({ ...pageParams, search: val, page: 1 })
              }
              onSearch={(val) => handleSeach(val)}
              toolbarExtra={
                <div className="flex items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-600">Plan</label>
                    <div className="w-64 flex flex-col gap-1 z-20 border p-[12px] rounded-lg bg-white">
                      <DynamicDropdown
                        key={`plan-dd-${planIdFilter || 'all'}-${planLabel}`}
                        tileItem={{ label: 'Plan', value: planLabel }}
                        value={planIdFilter}
                        getData={getPlansDropdown}
                        setUpdateCREId={(id: any) => {
                          const v = id ? String(id) : ''
                          setPlanIdFilter(v)
                          if (v) {
                            const cached = plansCache?.[v]
                            if (cached) setPlanLabel(cached)
                          } else {
                            setPlanLabel('All Plans')
                          }
                          applyPlanFilter(v)
                          if (v && !plansCache?.[v]) resolvePlanLabel(v)
                        }}
                      />
                    </div>
                  </div>
                </div>
              }
              height={
                data?.items?.length === 0
                  ? calcWindowHeight(150)
                  : calcWindowHeight(150)
              }
              isLoading={isFetching}
              sortType={pageParams.sortType as any}
              sortColumn={pageParams.sortColumn as any}
              handleColumnSort={handleSort}
              emptyTitle="No records to display"
              emptySubTitle={handleReturnEmptyMsg(search)}
              columns={columns}
              pagination={true}
              paginationProps={{
                onPagination: onChangePage,
                total: data?.total ?? 0,
                currentPage: pageParams?.page ?? 1,
                rowsPerPage: Number(pageParams?.page_size ?? 10),
                onRowsPerPage: onChangeRowsPerPage,
                dropOptions: [10, 20, 30, 50, 100],
              }}
              actionProps={[]}
              columnToggle
              externalActions={false}
            />
          </div>

          {/* No modals/actions for Payment History */}
        </>
      )}
    </div>
  )
}
