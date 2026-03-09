import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import SmartTable from '../../../../components/common/table/SmartTable'
import Icons from '../../../../components/common/icons'
import { TableColumns } from '../../../../common/types'
import ConfirmDeleteModal from '../../../../components/common/modal/ConfirmDeleteModal'
import InfoBox from '../../../../components/app/alertBox/infoBox'
import Button from '../../../../components/common/buttons/Button'
// import DietPlanForm from './create'
// import { useDietPlans, useDeleteDietPlan } from './api'
import { useAdminUserFilterStore } from '../../../../store/filterSore/adminUserStore'
import { getSortedColumnName } from '../../../../utilities/parsers'
import { calcWindowHeight } from '../../../../utilities/calcHeight'
import { checkPermissions } from '../../../../layout/store'
import { useAuthStore } from '../../../../store/authStore'
import { useDeleteDietPlan, useDietPlans } from './api'
import DietPlanForm from './create'

const toTitleCase = (value?: string | null) => {
  if (!value) return ''
  return value
    .toString()
    .toLowerCase()
    .replace(/\b([a-z])/g, (letter) => letter.toUpperCase())
}

const normalizeDayKeyParam = (value?: string | null) => {
  if (!value) return ''
  const raw = value.toString().trim()
  if (!raw) return ''
  if (
    raw.startsWith('number:') ||
    raw.startsWith('name:') ||
    raw.startsWith('plan-')
  ) {
    return raw
  }
  if (raw.startsWith('day-')) {
    const num = Number(raw.slice(4))
    if (Number.isFinite(num) && num > 0) return `number:${num}`
  }
  const numeric = Number(raw)
  if (Number.isFinite(numeric) && numeric > 0) return `number:${numeric}`
  return `name:${raw.toLowerCase()}`
}

interface DietPlanTabProps {
  template: any
  loading: boolean
  error: string
}

export default function DietPlanTab({
  template,
  loading,
  error,
}: DietPlanTabProps) {
  if (loading) {
    return (
      <div className="p-6">
        <InfoBox content="Loading diet plans..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <InfoBox content={error} />
      </div>
    )
  }

  if (!template?.id) {
    return (
      <div className="p-6">
        <InfoBox content="Template information unavailable." />
      </div>
    )
  }

  return (
    <DietPlanContent
      templateName={template?.name}
      templateId={template?.id}
      templateDurationDays={template?.duration_days}
    />
  )
}

function DietPlanContent({
  templateName,
  templateId,
  templateDurationDays,
}: {
  templateName?: string
  templateId: string | number
  templateDurationDays?: number
}) {
  const navigate = useNavigate()
  const roleName = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const isNutritionist = roleName === 'nutritionist'

  const columns: TableColumns[] = useMemo(
    () => [
      {
        title: 'Day Number',
        field: 'day_number',
        resizable: true,
        isVisible: true,
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <button
              type="button"
              className="text-blue-600 hover:underline"
              onClick={() => {
                const baseKey = (row?.day_key || row?.day_name || '')
                  .toString()
                  .trim()
                  .toLowerCase()
                const fallback =
                  baseKey || (row?.day_number ? `day-${row.day_number}` : '')
                if (fallback) {
                  navigate(
                    `/diet-template/${templateId}/diet-plan?day=${encodeURIComponent(
                      fallback
                    )}`
                  )
                }
              }}
            >
              {row?.day_number ?? ''}
            </button>
          ),
        }),
        sortKey: 'day_number',
      },
      {
        title: 'Day',
        field: 'day_name',
        resizable: true,
        isVisible: true,
        customCell: true,
        renderCell: (row: any) => ({ cell: row?.day_name ?? '' }),
        sortKey: 'day_name',
      },
      {
        title: 'Calories',
        field: 'effective_total_calories',
        resizable: true,
        isVisible: true,
        customCell: true,
        renderCell: (row: any) => ({
          cell: row?.effective_total_calories ?? '',
        }),
        sortKey: 'effective_total_calories',
      },
    ],
    [navigate]
  )

  const { pageParams, setPageParams } = useAdminUserFilterStore()
  const { search, ordering } = pageParams
  const [urlSearchParams, setUrlSearchParams] = useSearchParams()

  const searchParams = {
    page: 1,
    per_page: 1000,
    search,
    ordering,
    diet_plan_template_id: Number(templateId),
  }

  const { data, isFetching } = useDietPlans(searchParams)
  const buildDayKey = useCallback((plan: any) => {
    const numberKey = plan?.day_number ? `number:${plan.day_number}` : ''
    if (numberKey) return numberKey
    const base = (plan?.day_name || '').toString().trim().toLowerCase()
    if (base) return `name:${base}`
    return `plan-${plan?.id}`
  }, [])
  const dietPlans = useMemo(
    () => (Array.isArray(data?.diet_plans) ? data?.diet_plans : []),
    [data?.diet_plans]
  )
  const aggregatedPlans = useMemo(() => {
    if (!dietPlans.length) return []
    const grouped = new Map<string, any>()
    dietPlans.forEach((plan: any) => {
      const key = buildDayKey(plan)
      const calories = Number(plan?.effective_total_calories) || 0
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: plan?.id,
          day_name: plan?.day_name,
          day_number: plan?.day_number,
          day_key: key,
          effective_total_calories: calories,
        })
      } else {
        const existing = grouped.get(key)
        existing.effective_total_calories =
          (Number(existing.effective_total_calories) || 0) + calories
      }
    })
    return Array.from(grouped.values())
  }, [dietPlans, buildDayKey])
  const rawSelectedDayKey = urlSearchParams.get('day') || ''
  const selectedDayKey = useMemo(
    () => normalizeDayKeyParam(rawSelectedDayKey),
    [rawSelectedDayKey]
  )
  const selectedDayRows = useMemo(() => {
    if (!selectedDayKey) return []
    const primaryMatch = dietPlans.filter(
      (plan: any) => buildDayKey(plan) === selectedDayKey
    )
    if (primaryMatch.length) return primaryMatch

    const numericKeyMatch = selectedDayKey.startsWith('number:')
      ? Number(selectedDayKey.slice(7))
      : null
    const nameKeyMatch = selectedDayKey.startsWith('name:')
      ? selectedDayKey.slice(5)
      : ''

    if (Number.isFinite(numericKeyMatch)) {
      return dietPlans.filter((plan: any) => {
        const num = Number(plan?.day_number)
        return Number.isFinite(num) && num === numericKeyMatch
      })
    }

    if (nameKeyMatch) {
      return dietPlans.filter(
        (plan: any) =>
          (plan?.day_name || '').toString().trim().toLowerCase() ===
          nameKeyMatch
      )
    }

    return []
  }, [dietPlans, selectedDayKey, buildDayKey])
  const selectedDayMeta = useMemo(() => {
    if (!selectedDayKey) return null
    return (
      aggregatedPlans.find((item) => item?.day_key === selectedDayKey) || null
    )
  }, [aggregatedPlans, selectedDayKey])
  const { mutateAsync: deleteDietPlan, isLoading: deleteLoading } =
    useDeleteDietPlan()

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedDietPlanId, setSelectedDietPlanId] = useState<
    string | number | null
  >(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formValues, setFormValues] = useState<any | null>(null)
  const [editMode, setEditMode] = useState(false)

  const openCreate = (dayInfo?: { day_name: string; day_number: number }) => {
    setEditMode(false)
    const initialValues: any = {
      diet_plan_template_id: templateId,
    }

    // If creating meal for a specific day, prefill and disable day fields
    if (dayInfo) {
      initialValues.day_name = dayInfo.day_name
      initialValues.day_number = dayInfo.day_number
    }

    setFormValues(initialValues)
    setFormOpen(true)
  }

  const openEdit = (row: any) => {
    setEditMode(true)
    setFormValues({
      id: row?.id,
      diet_plan_template_id: row?.diet_plan_template_id ?? templateId,
      day_number: row?.day_number ?? '',
      sequence_number: row?.sequence_number ?? '',
      meal_time: row?.meal_time ?? '',
      meal_name: row?.meal_name ?? '',
      calories: row?.calories ?? '',
      items: Array.isArray(row?.items) ? row.items : [],
    })
    setFormOpen(true)
  }

  const handleClose = () => {
    setFormOpen(false)
    setEditMode(false)
    setFormValues(null)
  }

  const handleDeleteClick = useCallback((row: any) => {
    setSelectedDietPlanId(row?.id ?? null)
    setDeleteModalOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedDietPlanId) return
    await deleteDietPlan(selectedDietPlanId)
    setDeleteModalOpen(false)
    setSelectedDietPlanId(null)
  }, [deleteDietPlan, selectedDietPlanId])

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

  const handleViewDay = (row: any) => {
    if (!row?.day_key) return
    setUrlSearchParams({ day: row.day_key })
  }

  const clearDaySelection = () => {
    setUrlSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('day')
      return next
    })
  }

  const viewingDay = Boolean(selectedDayKey)

  const dayColumns: TableColumns[] = useMemo(
    () => [
      {
        title: 'Meal Order',
        field: 'serial',
        resizable: false,
        isVisible: true,
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <button
              type="button"
              className="text-blue-600 hover:underline"
              onClick={() => navigate(`/diet_details/${row?.id}`)}
            >
              {row?.serial ?? ''}
            </button>
          ),
        }),
        sortKey: 'serial',
      },
      {
        title: 'Meal Time',
        field: 'meal_time',
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
              {row?.meal_time ?? ''}
            </button>
          ),
        }),
        sortKey: 'meal_time',
      },
      {
        title: 'Meal Name',
        field: 'meal_name',
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
        resizable: true,
        isVisible: true,
        customCell: true,
        renderCell: (row: any) => ({
          cell: row?.effective_total_calories ?? '',
        }),
        sortKey: 'effective_total_calories',
      },
    ],
    [navigate]
  )

  const viewingDayRows = useMemo(() => {
    if (!selectedDayRows.length) return []
    return selectedDayRows.map((row: any, index: number) => ({
      ...row,
      serial: index + 1,
    }))
  }, [selectedDayRows])

  const tableColumns = viewingDay ? dayColumns : columns
  const tableData = viewingDay ? viewingDayRows : aggregatedPlans
  const tableTitle = viewingDay
    ? `${toTitleCase(selectedDayMeta?.day_name || 'Selected Day')} - Meals`
    : toTitleCase(templateName || 'Diet Plans')

  const aggregatedActions = isNutritionist
    ? []
    : [
        {
          icon: <Icons name="eye" />,
          action: handleViewDay,
          title: 'View',
          toolTip: 'View',
        },
      ]

  const dayActions = isNutritionist
    ? [
        {
          icon: <Icons name="eye" />,
          action: (row: any) => navigate(`/diet_details/${row?.id}`),
          title: 'View',
          toolTip: 'View',
        },
      ]
    : [
        {
          icon: <Icons name="eye" />,
          action: (row: any) => navigate(`/diet_details/${row?.id}`),
          title: 'View',
          toolTip: 'View',
        },
        {
          icon: <Icons name="edit" />,
          action: (row: any) => openEdit(row),
          title: 'Edit',
          toolTip: 'Edit',
        },
        {
          icon: <Icons name="delete" />,
          action: (row: any) => handleDeleteClick(row),
          title: 'Delete',
          toolTip: 'Delete',
        },
      ]

  const actionProps = viewingDay ? dayActions : aggregatedActions

  return (
    <div className="">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {viewingDay && (
            <>
              {/* <span className="font-semibold text-gray-700">
                Viewing day: {selectedDayMeta?.day_name || 'Selected Day'}
              </span>
              <span className="text-xs text-gray-500">
                Total Calories: {selectedDayMeta?.effective_total_calories ?? '--'}
              </span> */}
              <button
                type="button"
                className="px-3 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                onClick={clearDaySelection}
              >
                Back to all days
              </button>
            </>
          )}
        </div>
        {!viewingDay &&
          !isNutritionist &&
          checkPermissions('Employee', 'create') && (
            <Button
              className="bg-primaryGreen"
              label="Create Diet Plan"
              icon="plus"
              onClick={openCreate}
            />
          )}
        {viewingDay &&
          !isNutritionist &&
          checkPermissions('Employee', 'create') && (
            <Button
              className="bg-primaryGreen"
              label="Create Meal"
              icon="plus"
              onClick={() =>
                openCreate({
                  day_name: selectedDayMeta?.day_name || '',
                  day_number: selectedDayMeta?.day_number || 0,
                })
              }
            />
          )}
      </div>
      <SmartTable
        data={tableData}
        dataRowKey="id"
        toolbar={true}
        title={tableTitle}
        searchValue={String(pageParams?.search || '')}
        onSearchChange={(val) =>
          setPageParams({ ...pageParams, search: val, page: 1 })
        }
        onSearch={() => setPageParams({ ...pageParams, page: 1 })}
        columns={tableColumns}
        height={
          tableData.length === 0 ? calcWindowHeight(218) : calcWindowHeight(250)
        }
        pagination={false}
        isLoading={isFetching}
        sortType={pageParams.sortType}
        sortColumn={pageParams.sortColumn}
        handleColumnSort={handleSort}
        emptyTitle="No records to display"
        columnToggle
        externalActions={true}
        actionProps={actionProps}
      />

      <DietPlanForm
        isOpen={formOpen}
        handleClose={handleClose}
        edit={editMode}
        rowData={formValues ?? undefined}
        planId={templateId}
        planDurationDays={templateDurationDays}
        existingPlans={dietPlans}
      />

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteModalOpen(false)
            setSelectedDietPlanId(null)
          }
        }}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Are you sure?"
        subTitle="Do you really want to delete this diet plan? This process cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  )
}
