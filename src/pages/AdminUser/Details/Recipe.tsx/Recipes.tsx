import { useEffect, useMemo, useState, type SetStateAction } from 'react'
import { useNavigate } from 'react-router-dom'

import SmartTable from '../../../../components/common/table/SmartTable'
import Button from '../../../../components/common/buttons/Button'
import Icons from '../../../../components/common/icons'
import CustomDrawer from '../../../../components/common/drawer'
// import TextField from '../../../../components/common/inputs/TextField'
import SearchInput from '../../../../components/common/inputs/SearchInput'
import { TableColumns } from '../../../../common/types'
import { useAdminUserFilterStore } from '../../../../store/filterSore/adminUserStore'
import { calcWindowHeight } from '../../../../utilities/calcHeight'
import { getSortedColumnName } from '../../../../utilities/parsers'
import { checkPermissions } from '../../../../layout/store'
import { useRecipes } from '../../../Recipe/api'
import { getUserRecipeColumns } from './userRecipeColumns'
import { useAssignRecipes, useUserRecipes } from './recipes.api'

type RecipesTabProps = {
  userId?: string | number
}

type AssignParams = {
  page: number
  per_page: number
  search: string
  ordering?: string
}

export default function RecipesTab({ userId }: RecipesTabProps) {
  const [columns, setColumns] = useState<TableColumns[]>([])
  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false)
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<
    (string | number)[]
  >([])
  const [assignNotes, setAssignNotes] = useState('')

  const [assignParams, setAssignParams] = useState<AssignParams>({
    page: 1,
    per_page: 10,
    search: '',
    ordering: undefined as string | undefined,
  })
  const navigate = useNavigate()
  const { pageParams, setPageParams } = useAdminUserFilterStore()
  const { page, per_page, search, ordering } = pageParams

  const searchParams = {
    page,
    per_page: Number(per_page ?? 10),
    search,
    ordering,
  }

  const canListRecipes = useMemo(() => Boolean(userId), [userId])

  useEffect(() => {
    setColumns(
      getUserRecipeColumns((row: any) => {
        const recipeId = row?.recipe?.id ?? row?.recipe_id ?? row?.id
        if (recipeId) navigate(`/recipe/${recipeId}`)
      })
    )
  }, [navigate])

  const { data, isFetching } = useUserRecipes(userId, searchParams)
  const { data: assignableRecipes, isFetching: loadingAllRecipes } =
    useRecipes(assignParams)
  const { mutate: assignRecipesMutation, isLoading: assigning } =
    useAssignRecipes()

  const openAssignDrawer = () => {
    setAssignDrawerOpen(true)
    const alreadyAssignedIds = recipeList
      .map((item: any) => {
        const id = item?.recipe?.id ?? item?.recipe_id ?? item?.id
        return typeof id === 'string' ? Number(id) : id
      })
      .filter(Boolean)
    console.log('Already assigned recipe IDs:', alreadyAssignedIds)
    setSelectedRecipeIds(alreadyAssignedIds)
    setAssignNotes('')
  }

  const closeAssignDrawer = () => {
    setAssignDrawerOpen(false)
    setSelectedRecipeIds([])
    setAssignNotes('')
  }

  const handleRefresh = () => {
    setPageParams({ ...pageParams, page: 1 })
  }

  const handleSort = (orderColumn: any, orderDirection: any) => {
    setPageParams({
      ...pageParams,
      sortColumn: orderColumn,
      sortType: orderDirection,
      ordering: getSortedColumnName(orderColumn, orderDirection),
    })
  }

  const onChangePage = (pageNumber: number) => {
    setPageParams({ ...pageParams, page: pageNumber })
  }

  const onChangeRowsPerPage = (count: number | string) => {
    setPageParams({ ...pageParams, per_page: Number(count), page: 1 })
  }

  if (!canListRecipes) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">
          User information unavailable. Cannot load recipes.
        </p>
      </div>
    )
  }

  const recipeList = Array.isArray(data?.recipes)
    ? (data?.recipes ?? [])
    : Array.isArray(data?.user_recipes)
      ? (data?.user_recipes ?? [])
      : []
  const meta = data?.meta ?? {}

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {checkPermissions('Employee', 'create') && (
          <Button icon="plus" label="Add Recipe" onClick={openAssignDrawer} />
        )}
      </div>

      <SmartTable
        data={recipeList}
        dataRowKey="id"
        toolbar
        searchValue={String(pageParams?.search || '')}
        onSearchChange={(val) => setPageParams({ ...pageParams, search: val })}
        onSearch={() => setPageParams({ ...pageParams, page: 1 })}
        columns={columns}
        height={
          recipeList.length === 0
            ? calcWindowHeight(218)
            : calcWindowHeight(200)
        }
        pagination
        isLoading={isFetching}
        sortType={pageParams.sortType}
        sortColumn={pageParams.sortColumn}
        handleColumnSort={handleSort}
        emptyTitle="No recipes found"
        columnToggle
        externalActions
        actionProps={[
          {
            icon: <Icons name="eye" />,
            action: (row: any) => {
              const recipeId = row?.recipe?.id ?? row?.recipe_id ?? row?.id
              if (recipeId) navigate(`/recipe/${recipeId}`)
            },
            title: 'View',
            toolTip: 'View',
          },
        ]}
        paginationProps={{
          onPagination: onChangePage,
          total: meta?.total_count ?? 0,
          currentPage:
            typeof meta?.current_page === 'number'
              ? (meta?.current_page as number)
              : (pageParams?.page ?? 1),
          rowsPerPage: Number(pageParams?.per_page ?? meta?.per_page ?? 10),
          onRowsPerPage: onChangeRowsPerPage,
          totalPages: Math.max(
            1,
            Math.ceil(
              (Number(meta?.total_count ?? 0) || 0) /
                Number(pageParams?.per_page ?? meta?.per_page ?? 10)
            )
          ),
          dropOptions: [10, 20, 30, 50, 100],
        }}
      />
      <AssignRecipesDrawer
        open={assignDrawerOpen}
        onClose={closeAssignDrawer}
        recipesData={assignableRecipes}
        loading={loadingAllRecipes}
        selectedIds={selectedRecipeIds}
        onToggle={(recipeId) => {
          setSelectedRecipeIds((prev) =>
            prev.includes(recipeId)
              ? prev.filter((id) => id !== recipeId)
              : [...prev, recipeId]
          )
        }}
        notes={assignNotes}
        onChangeNotes={setAssignNotes}
        params={assignParams}
        onChangeParams={setAssignParams}
        onSubmit={() => {
          if (!userId || selectedRecipeIds.length === 0) return
          assignRecipesMutation(
            {
              user_id: userId,
              recipe_ids: selectedRecipeIds,
              notes: assignNotes || undefined,
            },
            {
              onSuccess: () => {
                closeAssignDrawer()
                handleRefresh()
              },
            }
          )
        }}
        submitting={assigning}
      />
    </div>
  )
}

type AssignDrawerProps = {
  open: boolean
  onClose: () => void
  recipesData: any
  loading: boolean
  selectedIds: (string | number)[]
  onToggle: (recipeId: string | number) => void
  notes: string
  onChangeNotes: (value: string) => void
  params: AssignParams
  onChangeParams: (fn: SetStateAction<AssignParams>) => void
  onSubmit: () => void
  submitting: boolean
}

function AssignRecipesDrawer({
  open,
  onClose,
  recipesData,
  loading,
  selectedIds,
  onToggle,
  // notes,
  // onChangeNotes,
  params,
  onChangeParams,
  onSubmit,
  submitting,
}: AssignDrawerProps) {
  const recipeList: any[] = recipesData?.recipes ?? []
  const meta = recipesData?.meta ?? {}

  return (
    <CustomDrawer
      open={open}
      handleClose={onClose}
      title="Assign Recipes"
      handleSubmit={onSubmit}
      actionLabel="Assign"
      disableSubmit={selectedIds.length === 0 || submitting}
      actionLoader={submitting}
      contentBg
      className="w-screen max-w-[100vw]"
      unmountOnClose
    >
      <div className="w-full px-4 py-5 space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
          <div>
            <SearchInput
              placeholder="Search Recipe"
              searchValue={params.search}
              handleChange={(value: string) =>
                onChangeParams((prev: AssignParams) => ({
                  ...prev,
                  search: value,
                  page: 1,
                }))
              }
              handleSearch={() =>
                onChangeParams((prev: AssignParams) => ({ ...prev, page: 1 }))
              }
            />
          </div>
        </div>

        <div>
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Loading recipes...</div>
          ) : recipeList.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No recipes found.</div>
          ) : (
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {recipeList.map((recipe) => {
                const rawId = recipe?.id
                const rid = typeof rawId === 'string' ? Number(rawId) : rawId
                const nutrition = recipe?.nutrition || {}
                const isSelected = selectedIds.includes(rid)
                const macros = [
                  { label: 'Calories', value: nutrition?.calories ?? '--' },
                  { label: 'Protein', value: nutrition?.protein ?? '--' },
                  { label: 'Carbs', value: nutrition?.carbs ?? '--' },
                  { label: 'Fat', value: nutrition?.fat ?? '--' },
                  { label: 'Fiber', value: nutrition?.fiber ?? '--' },
                ]

                return (
                  <button
                    type="button"
                    key={rid}
                    onClick={() => onToggle(rid)}
                    className={`text-left p-4 rounded-2xl border transition-all duration-200 bg-white/90 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40 h-[250px] ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-primary/20'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">
                          {recipe?.meal_category ?? 'Uncategorized'}
                        </p>
                        <p className="text-base font-semibold text-gray-900 break-all">
                          {recipe?.name ?? 'Untitled recipe'}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                          Serving size: {recipe?.serving_unit ?? '—'} | Assigned
                          by selection
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-primary cursor-pointer"
                        checked={isSelected}
                        onChange={() => onToggle(rid)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                      {macros.map((macro) => (
                        <span
                          key={macro.label}
                          className="px-2 py-1 rounded-full bg-slate-100 text-gray-600 font-medium"
                        >
                          {macro.label}: {macro.value}
                        </span>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-xs text-gray-500">
          <span className="text-sm font-medium text-gray-600">
            Page {meta?.current_page ?? params.page} of{' '}
            {meta?.total_pages ?? '--'}
          </span>
          <div className="flex gap-2">
            <Button
              label="Prev"
              outlined
              disabled={(meta?.current_page ?? params.page) <= 1}
              onClick={() =>
                onChangeParams((prev: AssignParams) => ({
                  ...prev,
                  page: Math.max(1, (meta?.current_page ?? prev.page) - 1),
                }))
              }
            />
            <Button
              label="Next"
              disabled={
                meta?.total_pages
                  ? (meta?.current_page ?? params.page) >= meta.total_pages
                  : recipeList.length === 0
              }
              onClick={() =>
                onChangeParams((prev: AssignParams) => ({
                  ...prev,
                  page: (meta?.current_page ?? prev.page) + 1,
                }))
              }
            />
          </div>
        </div>

        {/* <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4">
          <p className="text-sm font-medium text-gray-600 mb-2">Notes</p>
          <TextArea
            id="assign-notes"
            name="assign-notes"
            placeholder="Add notes for the recipient (optional)"
            value={notes}
            onChange={(e: any) => onChangeNotes(e.target.value)}
          />
        </div> */}
      </div>
    </CustomDrawer>
  )
}
