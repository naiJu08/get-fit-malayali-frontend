import { useEffect, useState } from 'react'
import { QbsTable } from 'qbs-react-grid'
import Icons from '../../../../components/common/icons'
import { TableColumns } from '../../../../common/types'
import { useDietPlans } from './api'
import { useAdminUserFilterStore } from '../../../../store/filterSore/adminUserStore'
import { getSortedColumnName } from '../../../../utilities/parsers'
import ListingHeader from '../../../../components/common/ListingTiles'
import { useNavigate } from 'react-router-dom'
import DietPlanForm from './create'

export default function DietPlanIndex({
  planName,
  planId,
}: {
  planName?: string
  planId?: string | number
}) {
  const navigate = useNavigate()
  const [columns] = useState<TableColumns[]>([
    // {
    //   title: 'Plan',
    //   field: 'plan_name',
    //   sortable: true,
    //   resizable: true,
    //   isVisible: true,
    //   customCell: true,
    //   renderCell: (row: any) => ({ cell: row?.plan_name ?? '' }),
    //   sortKey: 'plan_name',
    // },
    {
      title: 'Day',
      field: 'day_number',
      sortable: true,
      resizable: true,
      isVisible: true,
      customCell: true,
      renderCell: (row: any) => ({ cell: row?.day_number ?? '' }),
      sortKey: 'day_number',
    },
    {
      title: 'Sequence',
      field: 'sequence_number',
      sortable: true,
      resizable: true,
      isVisible: true,
      customCell: true,
      renderCell: (row: any) => ({ cell: row?.sequence_number ?? '' }),
      sortKey: 'sequence_number',
    },
    {
      title: 'Meal Time',
      field: 'meal_time',
      sortable: true,
      resizable: true,
      isVisible: true,
      customCell: true,
      renderCell: (row: any) => ({ cell: row?.meal_time ?? '' }),
      sortKey: 'meal_time',
    },
    {
      title: 'Meal Name',
      field: 'meal_name',
      sortable: true,
      resizable: true,
      isVisible: true,
      customCell: true,
      renderCell: (row: any) => ({ cell: row?.meal_name ?? '' }),
      sortKey: 'meal_name',
    },
    {
      title: 'Calories',
      field: 'calories',
      sortable: true,
      resizable: true,
      isVisible: true,
      customCell: true,
      renderCell: (row: any) => ({ cell: row?.calories ?? '' }),
      sortKey: 'calories',
    },
    {
      title: 'Created At',
      field: 'created_at',
      resizable: true,
      isVisible: true,
      customCell: true,
      renderCell: (row: any) => ({
        cell: row?.created_at
          ? new Date(row?.created_at).toLocaleDateString()
          : '',
      }),
      sortKey: 'created_at',
    },
  ])

  const { pageParams, setPageParams } = useAdminUserFilterStore()
  const { page, per_page, search, ordering } = pageParams

  const searchParams = {
    page,
    per_page: Number(per_page ?? 10),
    search,
    ordering,
    plan_id: planId,
  }

  const { data, isFetching } = useDietPlans(searchParams)

  const [formOpen, setFormOpen] = useState(false)
  const [formValues, setFormValues] = useState<any | null>(null)
  const openEdit = (row: any) => {
    setFormValues({
      id: row?.id,
      plan_id: row?.plan_id ?? planId,
      day_number: row?.day_number ?? '',
      sequence_number: row?.sequence_number ?? '',
      meal_time: row?.meal_time ?? '',
      meal_name: row?.meal_name ?? '',
      calories: row?.calories ?? '',
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

  const headerProps = { actionTitle: '' }

  return (
    <div className="">
      <div className="mb-3">
        <ListingHeader
          data={{ title: planName || 'Diet Plans', icon: 'user' }}
          actionProps={headerProps}
        />
      </div>
      <QbsTable
        data={data?.diet_plans ?? []}
        dataRowKey="id"
        toolbar={true}
        search={true}
        searchValue={pageParams?.search}
        onSearch={(key?: string) =>
          setPageParams({ ...pageParams, search: key as string, page: 1 })
        }
        asyncSearch
        handleSearchValue={(key?: string) =>
          setPageParams({ ...pageParams, search: key as string, page: 1 })
        }
        columns={columns}
        pagination={true}
        isLoading={isFetching}
        sortType={pageParams.sortType}
        sortColumn={pageParams.sortColumn}
        handleColumnSort={handleSort}
        emptyTitle="No records to display"
        renderSortIcon={(st?: 'asc' | 'desc' | undefined) => {
          return st === 'asc' ? (
            <Icons name="ascending-icon" />
          ) : st === 'desc' ? (
            <Icons name="descending-icon" />
          ) : (
            <Icons name="qbs-sort-icon" />
          )
        }}
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
          dropOptions: [10, 20, 30, 50, 100],
        }}
        columnToggle
        actionProps={[
          {
            icon: <Icons name="eye" />,
            action: (row: any) => navigate(`/diet_details/${row?.id}`),
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
      <DietPlanForm
        isOpen={formOpen}
        handleClose={handleClose}
        edit={true}
        rowData={formValues ?? undefined}
        planId={planId}
      />
    </div>
  )
}
