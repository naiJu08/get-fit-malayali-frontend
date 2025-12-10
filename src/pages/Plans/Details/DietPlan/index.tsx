import { useEffect, useState } from 'react'
import SmartTable from '../../../../components/common/table/SmartTable'
import Icons from '../../../../components/common/icons'
import { TableColumns } from '../../../../common/types'
import { useDietPlans, useDeleteDietPlan } from './api'
import { useAdminUserFilterStore } from '../../../../store/filterSore/adminUserStore'
import { getSortedColumnName } from '../../../../utilities/parsers'
import { useNavigate, useParams } from 'react-router-dom'
import DietPlanForm from './create'
import { calcWindowHeight } from '../../../../utilities/calcHeight'
import { checkPermissions } from '../../../../layout/store'
import Button from '../../../../components/common/buttons/Button'
import { useAuthStore } from '../../../../store/authStore'

export default function DietPlanIndex({
  planName,
  planId,
}: {
  planName?: string
  planId?: string | number
}) {
  const navigate = useNavigate()
  const { id: routePlanId } = useParams()
  const effectivePlanId = planId ?? routePlanId
  const roleName = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const isNutritionist = roleName === 'nutritionist'
  const [columns] = useState<TableColumns[]>([
    {
      title: 'Day',
      field: 'day_number',
      // sortable: true,
      resizable: true,
      isVisible: true,
      customCell: true,
      renderCell: (row: any) => ({
        cell: (
          <button
            type="button"
            className="text-blue-600 hover:underline"
            onClick={() => navigate(`/diet_details/${row?.id}`)}
          >
            {row?.day_number ?? ''}
          </button>
        ),
      }),
      sortKey: 'day_number',
    },
    {
      title: 'Sequence',
      field: 'sequence_number',
      // sortable: true,
      resizable: true,
      isVisible: true,
      customCell: true,
      renderCell: (row: any) => ({ cell: row?.sequence_number ?? '' }),
      sortKey: 'sequence_number',
    },
    {
      title: 'Meal Time',
      field: 'meal_time',
      // sortable: true,
      resizable: true,
      isVisible: true,
      customCell: true,
      renderCell: (row: any) => ({ cell: row?.meal_time ?? '' }),
      sortKey: 'meal_time',
    },
    {
      title: 'Meal Name',
      field: 'meal_name',
      // sortable: true,
      resizable: true,
      isVisible: true,
      customCell: true,
      renderCell: (row: any) => {
        const items = Array.isArray(row?.items) ? (row.items as any[]) : []
        let label: any = row?.meal_name ?? ''
        if (items.length > 0) {
          const parsed = items
            .map((it: any) => {
              const name = it?.meal_name ?? ''
              const reqRaw = (it?.requirement ?? it?.key_requirement ?? '')
                .toString()
                .toLowerCase()
              const req =
                reqRaw === 'mandatory'
                  ? 'mandatory'
                  : reqRaw === 'optional'
                    ? 'optional'
                    : ''
              return { name, req }
            })
            .filter((p: any) => Boolean(p.name))

          const mandatory = parsed
            .filter((p: any) => p.req === 'mandatory')
            .map((p: any) => p.name)
          const optional = parsed
            .filter((p: any) => p.req === 'optional')
            .map((p: any) => p.name)

          const nodes: Array<string | JSX.Element> = []
          if (mandatory.length) {
            mandatory.forEach((name: string, idx: number) => {
              if (idx > 0)
                nodes.push(
                  <span
                    className="text-green-600 font-semibold"
                    key={`m-sep-${idx}`}
                  >
                    {' '}
                    +{' '}
                  </span>
                )
              nodes.push(<span key={`m-${idx}`}>{name}</span>)
            })
          }
          if (optional.length) {
            if (nodes.length)
              nodes.push(
                <span className="font-semibold" key={`comma-sep`}>
                  {', '}
                </span>
              )
            optional.forEach((name: string, idx: number) => {
              if (idx > 0)
                nodes.push(
                  <span
                    className="text-orange-600 font-semibold"
                    key={`o-sep-${idx}`}
                  >
                    {' '}
                    or{' '}
                  </span>
                )
              nodes.push(<span key={`o-${idx}`}>{name}</span>)
            })
          }

          label = <span>{nodes}</span>
        }
        return { cell: label }
      },
      sortKey: 'meal_name',
    },
    {
      title: 'Calories',
      field: 'effective_total_calories',
      // sortable: true,
      resizable: true,
      isVisible: true,
      customCell: true,
      renderCell: (row: any) => ({ cell: row?.effective_total_calories ?? '' }),
      sortKey: 'effective_total_calories',
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

  const { data, isFetching } = useDietPlans(searchParams)

  const { mutate: deleteDietPlan } = useDeleteDietPlan()

  const [formOpen, setFormOpen] = useState(false)
  const [formValues, setFormValues] = useState<any | null>(null)
  const [editMode, setEditMode] = useState(false)

  const openCreate = () => {
    setEditMode(false)
    setFormValues({
      plan_id: effectivePlanId,
      day_number: 1,
      sequence_number: 1,
      meal_time: '',
      meal_name: '',
      calories: '',
    })
    setFormOpen(true)
  }

  const openEdit = (row: any) => {
    setEditMode(true)
    console.log('EDIT ROW', row)

    setFormValues({
      id: row?.id,
      plan_id: row?.plan_id ?? effectivePlanId,
      day_number: row?.day_number ?? '',
      sequence_number: row?.sequence_number ?? '',
      meal_time: row?.meal_time ?? '',
      meal_name: row?.meal_name ?? '',
      calories: row?.calories ?? '',
      // pass existing items so the form can prefill meals in edit mode
      items: Array.isArray(row?.items) ? row.items : [],
    })
    setFormOpen(true)
  }
  const handleClose = () => {
    setFormOpen(false)
    setEditMode(false)
    setFormValues(null)
  }

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
    <div className="">
      <div className="flex justify-end mb-4">
        {!isNutritionist && checkPermissions('Employee', 'create') && (
          <Button
            className="bg-primaryGreen"
            label="Create Diet Plan"
            icon="plus"
            onClick={openCreate}
          />
        )}
      </div>
      <SmartTable
        data={data?.diet_plans ?? []}
        dataRowKey="id"
        toolbar={true}
        title={planName || 'Diet Plans'}
        // search={true}
        searchValue={String(pageParams?.search || '')}
        onSearchChange={(val) =>
          setPageParams({ ...pageParams, search: val, page: 1 })
        }
        onSearch={() => setPageParams({ ...pageParams, page: 1 })}
        columns={columns}
        height={
          (data?.plans?.length ?? 0) === 0
            ? calcWindowHeight(218)
            : calcWindowHeight(200)
        }
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
        actionProps={
          isNutritionist
            ? []
            : [
                {
                  icon: <Icons name="eye" />,
                  action: (row: any) =>
                    navigate(
                      `/plans/${row?.plan_id}/dietplan_details/${row?.id}`
                    ),
                  title: 'view',
                  toolTip: 'View',
                },
                {
                  icon: <Icons name="edit" />,
                  action: (row: any) => openEdit(row),
                  title: 'edit',
                  toolTip: 'Edit',
                },
                {
                  icon: <Icons name="delete" />,
                  action: (row: any) => deleteDietPlan(row?.id),
                  title: 'delete',
                  toolTip: 'Delete',
                },
              ]
        }
      />

      <DietPlanForm
        isOpen={formOpen}
        handleClose={handleClose}
        edit={editMode}
        rowData={formValues ?? undefined}
        planId={effectivePlanId}
      />
    </div>
  )
}
