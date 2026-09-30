import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import Checkbox from '../../../../components/common/inputs/Checkbox'
import SmartTable from '../../../../components/common/table/SmartTable'
import Icons from '../../../../components/common/icons'
import { TableColumns } from '../../../../common/types'
import ConfirmDeleteModal from '../../../../components/common/modal/ConfirmDeleteModal'
import InfoBox from '../../../../components/app/alertBox/infoBox'
import Button from '../../../../components/common/buttons/Button'
// import DietPlanForm from './create'
import CopyMealsDialog, { DietCopyTargetType } from '../../CopyMealsDialog'
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
      templateDays={template?.days}
    />
  )
}

function DietPlanContent({
  templateName,
  templateId,
  templateDurationDays,
  templateDays,
}: {
  templateName?: string
  templateId: string | number
  templateDurationDays?: number
  templateDays?: any[]
}) {
  const navigate = useNavigate()
  const roleName = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const isNutritionist = roleName === 'nutritionist'
  const [selectedDayNumbers, setSelectedDayNumbers] = useState<string[]>([])
  const [selectedMealIds, setSelectedMealIds] = useState<string[]>([])
  const [copyType, setCopyType] = useState<DietCopyTargetType | null>(null)
  const [urlSearchParams, setUrlSearchParams] = useSearchParams()
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const handleViewDay = useCallback(
    (row: any) => {
      const key =
        row?.day_key || (row?.day_number ? `number:${row.day_number}` : '')
      if (!key) return
      setUrlSearchParams({ day: key })
    },
    [setUrlSearchParams]
  )

  const { pageParams, setPageParams } = useAdminUserFilterStore()
  const { search, ordering } = pageParams

  const searchParams = {
    page: 1,
    per_page: 1000,
    search,
    ordering,
    diet_plan_template_id: Number(templateId),
  }

  const { data, isFetching, refetch } = useDietPlans(searchParams)
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
    const grouped = new Map<string, any>()
    const persistedDays =
      Array.isArray(templateDays) && templateDays.length
        ? templateDays
        : Array.from(
            { length: Number(templateDurationDays || 0) },
            (_, index) => ({
              day_number: index + 1,
              day_name: 'Day ' + (index + 1),
            })
          )
    persistedDays.forEach((day: any) => {
      const key = 'number:' + day.day_number
      grouped.set(key, {
        id: day.id || key,
        day_name: day.day_name || 'Day ' + day.day_number,
        day_number: day.day_number,
        day_key: key,
        effective_total_calories: 0,
      })
    })
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
  }, [dietPlans, buildDayKey, templateDays, templateDurationDays])
  const rawSelectedDayKey =
    urlSearchParams.get('day') ||
    urlSearchParams.get('day-number') ||
    urlSearchParams.get('day_number') ||
    ''
  const selectedDayKey = useMemo(
    () => normalizeDayKeyParam(rawSelectedDayKey),
    [rawSelectedDayKey]
  )

  const requestedDayNumber = useMemo(() => {
    if (!selectedDayKey) return null
    if (selectedDayKey.startsWith('number:')) {
      const num = Number(selectedDayKey.slice(7))
      if (Number.isFinite(num)) return num
    }
    const num = Number(rawSelectedDayKey)
    if (Number.isFinite(num)) return num
    return null
  }, [selectedDayKey, rawSelectedDayKey])

  const maxAllowedDays = useMemo(() => {
    const dur = Number(templateDurationDays || 0)
    if (dur > 0) return dur
    if (Array.isArray(templateDays) && templateDays.length > 0) {
      return templateDays.length
    }
    if (aggregatedPlans.length > 0) {
      const nums = aggregatedPlans
        .map((p) => Number(p.day_number))
        .filter((n) => Number.isFinite(n) && n > 0)
      if (nums.length > 0) return Math.max(...nums)
    }
    return 0
  }, [templateDurationDays, templateDays, aggregatedPlans])

  const isInvalidDay = useMemo(() => {
    if (!selectedDayKey) return false
    if (isFetching && !aggregatedPlans.length) return false

    if (requestedDayNumber !== null) {
      if (requestedDayNumber <= 0) return true
      if (maxAllowedDays > 0 && requestedDayNumber > maxAllowedDays) {
        return true
      }
    }

    const matchesKey = aggregatedPlans.some(
      (item) => item?.day_key === selectedDayKey
    )
    if (matchesKey) return false

    if (requestedDayNumber !== null) {
      const matchesNum = aggregatedPlans.some(
        (item) => Number(item?.day_number) === requestedDayNumber
      )
      if (matchesNum) return false
    }

    if (maxAllowedDays > 0) {
      return true
    }

    return false
  }, [
    selectedDayKey,
    isFetching,
    aggregatedPlans,
    requestedDayNumber,
    maxAllowedDays,
  ])

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

  const viewingDayRows = useMemo(() => {
    if (!selectedDayRows.length) return []
    return selectedDayRows.map((row: any, index: number) => ({
      ...row,
      serial: index + 1,
    }))
  }, [selectedDayRows])

  const allDaysSelected =
    aggregatedPlans.length > 0 &&
    selectedDayNumbers.length === aggregatedPlans.length
  const toggleAllDays = useCallback(
    (checked: boolean) =>
      setSelectedDayNumbers(
        checked ? aggregatedPlans.map((day: any) => String(day.day_number)) : []
      ),
    [aggregatedPlans]
  )

  const columns: TableColumns[] = useMemo(
    () => [
      {
        title: (
          <Checkbox
            id="select-all-diet-days"
            name="select-all-diet-days"
            checked={allDaysSelected}
            intermediate={selectedDayNumbers.length > 0 && !allDaysSelected}
            handleChange={(event) => toggleAllDays(event.target.checked)}
          />
        ),
        field: 'select',
        colWidth: 56,
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <Checkbox
              id={'select-diet-day-' + row.day_number}
              name={'select-diet-day-' + row.day_number}
              checked={selectedDayNumbers.includes(String(row.day_number))}
              handleChange={() =>
                setSelectedDayNumbers((current) =>
                  current.includes(String(row.day_number))
                    ? current.filter(
                        (value) => value !== String(row.day_number)
                      )
                    : [...current, String(row.day_number)]
                )
              }
            />
          ),
        }),
      },
      {
        title: 'Day',
        field: 'day_number',
        resizable: true,
        isVisible: true,
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <button
              type="button"
              className="text-blue-600 hover:underline font-medium"
              onClick={() => handleViewDay(row)}
            >
              Day {row?.day_number ?? ''}
            </button>
          ),
        }),
        sortKey: 'day_number',
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
    [allDaysSelected, handleViewDay, selectedDayNumbers, toggleAllDays]
  )

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
    try {
      await deleteDietPlan(selectedDietPlanId)
    } catch {
      /* Handled by mutation onError */
    } finally {
      setDeleteModalOpen(false)
      setSelectedDietPlanId(null)
    }
  }, [deleteDietPlan, selectedDietPlanId])

  useEffect(() => {
    if (typeof pageParams?.page !== 'number' || pageParams.page !== 1) {
      setPageParams({ ...pageParams, page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedDayKey])

  const handleSort = (orderColumn?: any, orderDirection?: any) => {
    setPageParams({
      ...pageParams,
      sortColumn: orderColumn,
      sortType: orderDirection,
      ordering: getSortedColumnName(orderColumn, orderDirection),
    })
  }

  const clearDaySelection = () => {
    setUrlSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('day')
      next.delete('day-number')
      next.delete('day_number')
      return next
    })
  }

  const viewingDay = Boolean(selectedDayKey)

  const allMealsSelected =
    viewingDayRows.length > 0 &&
    selectedMealIds.length === viewingDayRows.length
  const toggleAllMeals = useCallback(
    (checked: boolean) =>
      setSelectedMealIds(
        checked ? viewingDayRows.map((meal: any) => String(meal.id)) : []
      ),
    [viewingDayRows]
  )

  const dayColumns: TableColumns[] = useMemo(
    () => [
      {
        title: (
          <Checkbox
            id="select-all-diet-meals"
            name="select-all-diet-meals"
            checked={allMealsSelected}
            intermediate={selectedMealIds.length > 0 && !allMealsSelected}
            handleChange={(event) => toggleAllMeals(event.target.checked)}
          />
        ),
        field: 'select_meal',
        colWidth: 56,
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <Checkbox
              id={'select-diet-meal-' + row.id}
              name={'select-diet-meal-' + row.id}
              checked={selectedMealIds.includes(String(row.id))}
              handleChange={() =>
                setSelectedMealIds((current) =>
                  current.includes(String(row.id))
                    ? current.filter((value) => value !== String(row.id))
                    : [...current, String(row.id)]
                )
              }
            />
          ),
        }),
      },
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
        title: 'Meal ',
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
        title: 'Meal Time',
        field: 'meal_time_time',
        resizable: true,
        isVisible: true,
        customCell: true,
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
    [allMealsSelected, navigate, selectedMealIds, toggleAllMeals]
  )

  const tableColumns = viewingDay ? dayColumns : columns
  const currentDataset = viewingDay ? viewingDayRows : aggregatedPlans
  const totalItems = currentDataset.length
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return currentDataset.slice(start, start + rowsPerPage)
  }, [currentDataset, currentPage, rowsPerPage])

  const tableTitle = viewingDay
    ? `Day ${selectedDayMeta?.day_number || (selectedDayKey.startsWith('number:') ? selectedDayKey.slice(7) : '')} - Meals`
    : toTitleCase(templateName || 'Diet Plans')

  const aggregatedActions = [
    {
      icon: <Icons name="eye" />,
      action: handleViewDay,
      title: 'View',
      toolTip: 'View',
    },
  ]

  const dayActions = [
    {
      icon: <Icons name="eye" />,
      action: (row: any) => navigate(`/diet_details/${row?.id}`),
      title: 'View',
      toolTip: 'View',
    },
    ...(!isNutritionist
      ? [
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
      : []),
  ]

  const actionProps = viewingDay ? dayActions : aggregatedActions
  const copySourceDayNumbers = viewingDay
    ? selectedMealIds.length > 0 && selectedDayMeta?.day_number
      ? [String(selectedDayMeta.day_number)]
      : []
    : selectedDayNumbers
  const showCopyActions = copySourceDayNumbers.length > 0

  if (isInvalidDay) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-240px)] w-full py-12 px-4 text-center bg-white rounded-2xl border border-gray-100 shadow-xs my-2">
        {/* Decorative Icon Container */}
        <div className="relative mb-6">
          <div className="absolute -inset-2 rounded-full bg-red-100/60 blur-lg animate-pulse" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-red-50 to-orange-50 border border-red-100 flex items-center justify-center shadow-md">
            <svg
              className="w-12 h-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight mb-2">
          Page Not Found
        </h2>

        {/* Subtitle */}
        <p className="text-sm md:text-base text-gray-500 max-w-md mb-8 leading-relaxed">
          The requested day{' '}
          <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
            Day {requestedDayNumber ?? rawSelectedDayKey}
          </span>{' '}
          does not exist for this diet template.
        </p>

        {/* Action Button */}
        <button
          type="button"
          className="inline-flex items-center gap-2.5 px-6 py-2.5 bg-primaryGreen text-white text-sm font-semibold rounded-xl hover:bg-primaryGreen/90 active:scale-95 transition-all shadow-md hover:shadow-lg cursor-pointer"
          onClick={clearDaySelection}
        >
          <Icons
            name="left-arrow-icon"
            className="w-4 h-4 fill-current text-white"
          />
          <span>Back to All Days</span>
        </button>
      </div>
    )
  }

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
        {!viewingDay && checkPermissions('Employee', 'create') && (
          <Button
            className="bg-primaryGreen"
            label="Create Diet Plan"
            icon="plus"
            onClick={openCreate}
          />
        )}
        {viewingDay && checkPermissions('Employee', 'create') && (
          <Button
            className="bg-primaryGreen"
            label="Create Meal"
            icon="plus"
            onClick={() => {
              const dayNum =
                selectedDayMeta?.day_number ||
                (selectedDayKey.startsWith('number:')
                  ? Number(selectedDayKey.slice(7))
                  : 0)
              const dayName =
                selectedDayMeta?.day_name || (dayNum ? `Day ${dayNum}` : '')
              openCreate({
                day_name: dayName,
                day_number: dayNum,
              })
            }}
          />
        )}
      </div>
      <SmartTable
        data={paginatedData}
        dataRowKey="id"
        toolbar={true}
        title={tableTitle}
        toolbarExtra={
          showCopyActions ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500">
                {viewingDay
                  ? selectedMealIds.length + ' meal(s)'
                  : selectedDayNumbers.length + ' day(s)'}{' '}
                selected
              </span>
              {(
                [
                  'same_template',
                  'other_template',
                  'client',
                ] as DietCopyTargetType[]
              ).map((target) => (
                <button
                  key={target}
                  type="button"
                  className="px-3 py-1.5 text-xs rounded-lg border border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
                  onClick={() => setCopyType(target)}
                >
                  {target === 'same_template'
                    ? 'Copy to Same Template'
                    : target === 'other_template'
                      ? 'Copy to Other Template'
                      : 'Copy to Client'}
                </button>
              ))}
            </div>
          ) : undefined
        }
        searchValue={String(pageParams?.search || '')}
        onSearchChange={(val) =>
          setPageParams({ ...pageParams, search: val, page: 1 })
        }
        onSearch={() => setPageParams({ ...pageParams, page: 1 })}
        columns={tableColumns}
        height={
          currentDataset.length === 0
            ? calcWindowHeight(300)
            : calcWindowHeight(280)
        }
        pagination={true}
        paginationProps={{
          currentPage,
          total: totalItems,
          rowsPerPage,
          totalPages,
          onPagination: (p: number) => setCurrentPage(p),
          onRowsPerPage: (r: number | string) => {
            setRowsPerPage(Number(r))
            setCurrentPage(1)
          },
          dropOptions: [10, 20, 30, 50, 100],
        }}
        isLoading={isFetching}
        sortType={pageParams.sortType}
        sortColumn={pageParams.sortColumn}
        handleColumnSort={handleSort}
        emptyTitle="No records to display"
        columnToggle
        externalActions={true}
        actionProps={actionProps}
      />

      {copyType && (
        <CopyMealsDialog
          open={Boolean(copyType)}
          onClose={() => setCopyType(null)}
          sourceTemplateId={templateId}
          sourceDays={aggregatedPlans.map((day: any) => ({
            ...day,
            id: day.day_number,
            title: `Day ${day.day_number}`,
          }))}
          sourceDayNumbers={copySourceDayNumbers}
          sourceMealIds={viewingDay ? selectedMealIds : []}
          targetType={copyType}
          onSuccess={async () => {
            await refetch()
            setSelectedDayNumbers([])
            setSelectedMealIds([])
          }}
        />
      )}

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
