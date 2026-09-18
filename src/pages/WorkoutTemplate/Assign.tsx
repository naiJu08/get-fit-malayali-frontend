import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import CustomDrawer from '../../components/common/drawer'
import { getData, postData } from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import { useSnackbarManager } from '../../components/common/snackbar'

type Props = {
  subscriptionId?: string | number | null
  currentName?: string
  onAssigned?: () => void
}

export default function WorkoutTemplateAssign({
  subscriptionId,
  currentName,
  onAssigned,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [templateId, setTemplateId] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [assigning, setAssigning] = useState(false)
  const { enqueueSnackbar } = useSnackbarManager()

  const listUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    })
    if (search.trim()) params.set('search', search.trim())
    return `${apiUrl.WORKOUT_TEMPLATES}?${params.toString()}`
  }, [page, perPage, search])

  const { data, isLoading, isFetching } = useQuery(
    ['workout-template-assignment-list', listUrl],
    () => getData(listUrl),
    { enabled: !!subscriptionId && drawerOpen, keepPreviousData: true }
  )

  if (!subscriptionId) return null

  const templates = data?.workout_templates ?? []
  const totalCount = Number(data?.meta?.total_count ?? 0)
  const totalPages = Math.max(
    1,
    Number(data?.meta?.total_pages ?? Math.ceil(totalCount / perPage) ?? 1)
  )

  const closeDrawer = () => {
    setDrawerOpen(false)
    setTemplateId('')
  }

  const assign = async () => {
    if (!templateId) return
    try {
      setAssigning(true)
      await postData(
        `${apiUrl.SUBSCRIPTIONS}/${subscriptionId}/assign_workout_template`,
        { workout_template_id: Number(templateId) }
      )
      enqueueSnackbar('Workout template assigned successfully', {
        variant: 'success',
      })
      closeDrawer()
      onAssigned?.()
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.errors?.[0] ||
          error?.response?.data?.message ||
          'Unable to assign workout template',
        { variant: 'error' }
      )
    } finally {
      setAssigning(false)
    }
  }

  return (
    <>
      <div className="border rounded p-3 bg-white mb-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm font-semibold">Workout Template</div>
          <span className="text-sm text-gray-600">
            Current: {currentName || 'No template assigned'}
          </span>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="ml-auto px-3 py-2 rounded bg-primaryGreen text-white text-sm hover:opacity-90"
          >
            Assign Template
          </button>
        </div>
      </div>

      <CustomDrawer
        open={drawerOpen}
        handleClose={closeDrawer}
        className="w-screen max-w-[1000px]"
        unmountOnClose
        title="Assign Workout Template"
        handleSubmit={assign}
        disableSubmit={!templateId || assigning}
        actionLoader={assigning}
        actionLabel="Assign Template"
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label className="flex-1 text-sm text-gray-600">
              Search templates
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                value={search}
                placeholder="Search by template name"
                onChange={(event) => {
                  setPage(1)
                  setSearch(event.target.value)
                }}
              />
            </label>
            <span className="text-xs text-gray-500">
              Showing {templates.length} of {totalCount} templates
            </span>
          </div>

          <div className="border rounded-lg divide-y">
            {isLoading || isFetching ? (
              <div className="p-8 text-center text-sm text-gray-500">
                Loading workout templates...
              </div>
            ) : templates.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No workout templates found.
              </div>
            ) : (
              templates.map((template: any) => {
                const selected = String(template.id) === String(templateId)
                return (
                  <button
                    type="button"
                    key={template.id}
                    onClick={() => setTemplateId(String(template.id))}
                    className={`w-full text-left p-4 transition-colors hover:bg-gray-50 ${
                      selected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {template.name || 'Untitled template'}
                        </p>
                        {template.description && (
                          <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                            {template.description}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                          <span>
                            Duration: {template.duration_days ?? 0} days
                          </span>
                          <span>Days: {template.days_count ?? 0}</span>
                          {template.created_at && (
                            <span>
                              Created:{' '}
                              {new Date(
                                template.created_at
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
                          selected ? 'border-blue-500' : 'border-gray-300'
                        }`}
                      >
                        {selected && (
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                        )}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <div className="flex flex-col gap-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2">
                Rows per page
                <select
                  className="border rounded px-2 py-1"
                  value={perPage}
                  onChange={(event) => {
                    setPage(1)
                    setPerPage(Number(event.target.value))
                  }}
                >
                  {[10, 20, 30, 50].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="border rounded px-3 py-1 disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="border rounded px-3 py-1 disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </CustomDrawer>
    </>
  )
}
