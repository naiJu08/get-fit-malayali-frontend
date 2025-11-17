import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import SmartTable from '../../../../components/common/table/SmartTable'
import Icons from '../../../../components/common/icons'
import { TableColumns } from '../../../../common/types'
import { useAdminUserFilterStore } from '../../../../store/filterSore/adminUserStore'
import { getSortedColumnName } from '../../../../utilities/parsers'
import { useYogaPlans } from './api'
import YogaPlanForm from './create'

type Props = {
  planName?: string
  planId?: string | number
}

export default function YogaPlanIndex({ planName, planId }: Props) {
  const navigate = useNavigate()
  const { id: routePlanId } = useParams()
  const effectivePlanId = planId ?? routePlanId

  const [columns] = useState<TableColumns[]>([
    {
      title: 'Title',
      field: 'title',
      resizable: true,
      isVisible: true,
      customCell: true,
      renderCell: (row: any) => ({
        cell: (
          <button
            type="button"
            className="text-blue-600 hover:underline"
            onClick={() =>
              navigate(`/plans/${row?.plan_id}/yogaplan_details/${row?.id}`)
            }
          >
            {row?.title ?? ''}
          </button>
        ),
      }),
      sortKey: 'title',
      link: true,
      rowClick: (row: any) =>
        navigate(`/plans/${row?.plan_id}/yogaplan_details/${row?.id}`),
    },
    {
      title: 'Day',
      field: 'day_number',
      resizable: true,
      isVisible: true,
      customCell: true,
      renderCell: (row: any) => ({ cell: row?.day_number ?? '' }),
      sortKey: 'day_number',
    },
    {
      title: 'Exercises',
      field: 'exercises_count',
      resizable: true,
      isVisible: true,
      customCell: true,
      renderCell: (row: any) => ({ cell: row?.exercises_count ?? 0 }),
    },
    {
      title: 'Total Duration (mins)',
      field: 'total_duration',
      resizable: true,
      isVisible: true,
      customCell: true,
      renderCell: (row: any) => ({ cell: row?.total_duration ?? 0 }),
    },
    {
      title: 'Description',
      field: 'description',
      resizable: true,
      isVisible: true,
      customCell: true,
      renderCell: (row: any) => ({ cell: row?.description ?? '' }),
      sortKey: 'description',
    },
  ])

  const { pageParams, setPageParams } = useAdminUserFilterStore()
  const { page, per_page, search, ordering } = pageParams

  const searchParams = {
    page,
    per_page: Number(per_page ?? 10),
    search,
    ordering,
    plan_id: effectivePlanId,
  }

  const { data, isFetching } = useYogaPlans(searchParams)

  const [formOpen, setFormOpen] = useState(false)
  const [formValues, setFormValues] = useState<any | null>(null)

  const openEdit = (row: any) => {
    setFormValues({
      id: row?.id,
      plan_id: row?.plan_id ?? effectivePlanId,
      day_number: row?.day_number ?? '',
      title: row?.title ?? '',
      description: row?.description ?? '',
      duration_minutes: row?.duration_minutes ?? row?.total_duration ?? 0,
    })
    setFormOpen(true)
  }

  const handleClose = () => setFormOpen(false)

  useEffect(() => {
    if (typeof pageParams?.page !== 'number' || pageParams.page !== 1) {
      setPageParams({ ...pageParams, page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSort = (orderColumn?: any, orderDirection?: any) => {
    setPageParams({
      ...pageParams,
      sortColumn: orderColumn,
      sortType: orderDirection,
      ordering: getSortedColumnName(orderColumn, orderDirection),
    })
  }

  const onChangePage = (pageNumber: number) => {
    setPageParams({
      ...pageParams,
      page: pageNumber,
    })
  }

  const onChangeRowsPerPage = (count: number | string) => {
    setPageParams({
      ...pageParams,
      per_page: Number(count),
      page: 1,
    })
  }

  return (
    <div>
      <SmartTable
        data={data?.yoga_plans ?? []}
        dataRowKey="id"
        toolbar={true}
        title={planName || 'Yoga Plans'}
        searchValue={String(pageParams?.search || '')}
        onSearchChange={(val) =>
          setPageParams({ ...pageParams, search: val, page: 1 })
        }
        onSearch={() => setPageParams({ ...pageParams, page: 1 })}
        columns={columns}
        pagination={true}
        isLoading={isFetching}
        sortType={pageParams.sortType}
        sortColumn={pageParams.sortColumn}
        handleColumnSort={handleSort}
        emptyTitle="No records to display"
        paginationProps={{
          onPagination: onChangePage,
          total: data?.meta?.total_count ?? 0,
          currentPage:
            typeof data?.meta?.current_page === 'number'
              ? (data?.meta?.current_page as number)
              : (pageParams?.page ?? 1),
          rowsPerPage: Number(
            pageParams?.per_page ?? data?.meta?.per_page ?? 10
          ),
          onRowsPerPage: onChangeRowsPerPage,
          totalPages: Math.max(
            1,
            Math.ceil(
              (Number(data?.meta?.total_count ?? 0) || 0) /
                Number(pageParams?.per_page ?? data?.meta?.per_page ?? 10)
            )
          ),
          dropOptions: [10, 20, 30, 50, 100],
        }}
        columnToggle
        externalActions={true}
        actionProps={[
          {
            icon: <Icons name="eye" />,
            action: (row: any) =>
              navigate(`/plans/${row?.plan_id}/yogaplan_details/${row?.id}`),
            title: 'view',
            toolTip: 'View',
          },
          {
            icon: <Icons name="edit" />,
            action: (row: any) => openEdit(row),
            title: 'edit',
            toolTip: 'Edit',
          },
        ]}
      />

      <YogaPlanForm
        isOpen={formOpen}
        handleClose={handleClose}
        edit={true}
        rowData={formValues ?? undefined}
        planId={planId}
      />
    </div>
  )
}
