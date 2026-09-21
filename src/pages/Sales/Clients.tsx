import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import SmartTable from '../../components/common/table/SmartTable'
import ListingHeader from '../../components/common/ListingTiles'
import Icons from '../../components/common/icons'
import { TabContainer } from '../../components/common/tab'
import { TabItemProps } from '../../common/types'
import { useSnackbarManager } from '../../components/common/snackbar'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { getErrorMessage } from '../../utilities/parsers'
import {
  useSalesClients,
  useUnassignedClients,
  acquireSalesClient,
} from './api'

const accountStatusColor = (value: any) => {
  switch (String(value || '').toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'pending':
    case 'inactive':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'suspended':
    case 'blocked':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const sourceBadge = (source: string) => {
  switch (source) {
    case 'lead_conversion':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
          Lead Converted
        </span>
      )
    case 'superadmin_created':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          Admin Created
        </span>
      )
    case 'superadmin_assigned':
    case 'admin_assigned':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          Superadmin Assigned
        </span>
      )
    case 'self_registered':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Self-Registered
        </span>
      )
  }
}

export default function SalesClients() {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbarManager()
  const [activeTab, setActiveTab] = useState<'my_clients' | 'unassigned'>(
    'my_clients'
  )

  // My Clients params
  const [myParams, setMyParams] = useState({
    page: 1,
    per_page: 20,
    search: '',
  })
  const {
    data: myData,
    isFetching: isMyFetching,
    refetch: refetchMyClients,
  } = useSalesClients(myParams)
  const myClients = myData?.clients || []

  // Unassigned Clients params
  const [unassignedParams, setUnassignedParams] = useState({
    page: 1,
    per_page: 20,
    search: '',
  })
  const {
    data: unassignedData,
    isFetching: isUnassignedFetching,
    refetch: refetchUnassigned,
  } = useUnassignedClients(unassignedParams)
  const unassignedClients = unassignedData?.clients || []
  const unassignedCount =
    unassignedData?.unassigned_count ??
    myData?.unassigned_count ??
    unassignedClients.length

  const [acquiringId, setAcquiringId] = useState<string | number | null>(null)
  const [confirmClient, setConfirmClient] = useState<any>(null)

  const copy = useCallback(
    async (url: string) => {
      try {
        await navigator.clipboard.writeText(url)
        enqueueSnackbar('Profile completion link copied', {
          variant: 'success',
        })
      } catch {
        enqueueSnackbar('Unable to copy profile completion link', {
          variant: 'error',
        })
      }
    },
    [enqueueSnackbar]
  )

  const handleAcquire = async (client: any) => {
    setAcquiringId(client.id)
    try {
      const res: any = await acquireSalesClient(client.id)
      enqueueSnackbar(res?.message || 'Client acquired successfully!', {
        variant: 'success',
      })
      setConfirmClient(null)
      refetchUnassigned()
      refetchMyClients()
      // Optionally switch to My Clients so user immediately sees their newly acquired client
      setActiveTab('my_clients')
    } catch (err: any) {
      const msg =
        getErrorMessage(err) ||
        'This client has already been acquired by another sales representative.'
      enqueueSnackbar(msg, { variant: 'error' })
      setConfirmClient(null)
      refetchUnassigned()
      refetchMyClients()
    } finally {
      setAcquiringId(null)
    }
  }

  // Columns for My Clients
  const myColumns: any[] = useMemo(
    () => [
      {
        title: 'Client',
        field: 'name',
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <div>
              <button
                type="button"
                className="text-blue-600 hover:underline font-medium text-left"
                onClick={() => navigate('/sales/clients/' + row.id)}
              >
                {row.name || 'Client #' + row.id}
              </button>
              <div className="text-xs text-secondary">{row.email || '--'}</div>
            </div>
          ),
          toolTip: row.email || '',
        }),
        isVisible: true,
      },
      { title: 'Phone', field: 'phone', isVisible: true },
      {
        title: 'Source',
        field: 'registration_source',
        customCell: true,
        renderCell: (row: any) => ({
          cell: sourceBadge(row.registration_source),
        }),
        isVisible: true,
      },
      {
        title: 'Account Status',
        field: 'status',
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <span
              className={
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ' +
                accountStatusColor(row.status)
              }
            >
              {row.status
                ? row.status.charAt(0).toUpperCase() + row.status.slice(1)
                : 'Unknown'}
            </span>
          ),
        }),
        isVisible: true,
      },
      {
        title: 'Profile',
        field: 'profile_completed',
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <span
              className={
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ' +
                (row.profile_completed
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-yellow-100 text-yellow-800 border-yellow-200')
              }
            >
              {row.profile_completed ? 'Completed' : 'Not completed'}
            </span>
          ),
        }),
        isVisible: true,
      },
      {
        title: 'Registration Link',
        field: 'profile_completion_url',
        customCell: true,
        renderCell: (row: any) => ({
          cell: row.profile_completion_url ? (
            <button
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg shadow-md shadow-blue-500/25 transition-all duration-200 active:scale-95 cursor-pointer"
              onClick={() => copy(row.profile_completion_url)}
            >
              <Icons name="link" className="h-3.5 w-3.5" /> Copy link
            </button>
          ) : (
            'Completed'
          ),
        }),
        isVisible: true,
      },
    ],
    [copy, navigate]
  )

  // Columns for Unassigned Pool
  const unassignedColumns: any[] = useMemo(
    () => [
      {
        title: 'Client',
        field: 'name',
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <div>
              <div className="font-semibold text-slate-800 text-sm">
                {row.name || 'Client #' + row.id}
              </div>
              <div className="text-xs text-secondary">{row.email || '--'}</div>
            </div>
          ),
          toolTip: row.email || '',
        }),
        isVisible: true,
      },
      { title: 'Phone', field: 'phone', isVisible: true },
      {
        title: 'Source',
        field: 'registration_source',
        customCell: true,
        renderCell: (row: any) => ({
          cell: sourceBadge(row.registration_source || 'self_registered'),
        }),
        isVisible: true,
      },
      {
        title: 'Registered On',
        field: 'created_at',
        customCell: true,
        renderCell: (row: any) => {
          const dateStr = row.created_at
            ? moment(row.created_at).format('DD MMM YYYY, hh:mm A')
            : '--'
          return {
            cell: <span className="text-xs text-slate-600">{dateStr}</span>,
            toolTip: dateStr,
          }
        },
        isVisible: true,
      },
      {
        title: 'Profile Status',
        field: 'profile_completed',
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <span
              className={
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ' +
                (row.profile_completed
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-yellow-100 text-yellow-800 border-yellow-200')
              }
            >
              {row.profile_completed ? 'Completed' : 'Pending Profile'}
            </span>
          ),
        }),
        isVisible: true,
      },
      {
        title: 'Action',
        field: 'acquire_action',
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <button
              type="button"
              onClick={() => setConfirmClient(row)}
              disabled={acquiringId === row.id}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-lg shadow-md shadow-emerald-500/20 transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {acquiringId === row.id ? (
                <>
                  <svg
                    className="animate-spin h-3.5 w-3.5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Acquiring...
                </>
              ) : (
                <>
                  <svg
                    className="w-3.5 h-3.5 text-emerald-100"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  Acquire Client
                </>
              )}
            </button>
          ),
        }),
        isVisible: true,
      },
    ],
    [acquiringId]
  )

  const tabs: TabItemProps[] = useMemo(
    () => [
      {
        id: 'my_clients',
        label: 'My Clients',
        count: myData?.meta?.total_count ?? myClients.length,
        countBgClass:
          activeTab === 'my_clients'
            ? 'bg-blue-600 text-white font-bold'
            : 'bg-slate-100 text-slate-700 border border-slate-200',
      },
      {
        id: 'unassigned',
        label: 'Unassigned / Self-Registered Pool',
        count: unassignedCount > 0 ? `${unassignedCount} new` : unassignedCount,
        countBgClass:
          activeTab === 'unassigned'
            ? 'bg-emerald-600 text-white font-bold'
            : unassignedCount > 0
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold'
              : 'bg-slate-100 text-slate-600',
      },
    ],
    [activeTab, myData?.meta?.total_count, myClients.length, unassignedCount]
  )

  return (
    <div>
      <ListingHeader
        data={{ title: 'Clients', icon: 'user' }}
        checkPermission={false}
      />

      <div className="px-4">
        <TabContainer
          data={tabs}
          activeTab={activeTab}
          onClick={(tab) => setActiveTab(tab.id as any)}
        >
          {null}
        </TabContainer>
      </div>

      <div className="p-4 space-y-4">
        {/* Tab 1: My Clients */}
        {activeTab === 'my_clients' && (
          <SmartTable
            data={myClients}
            dataRowKey="id"
            columns={myColumns}
            actionProps={[
              {
                title: 'View',
                toolTip: 'View client details',
                icon: <Icons name="eye" />,
                action: (row: any) => navigate(`/sales/clients/${row.id}`),
              },
            ]}
            externalActions
            toolbar
            search
            searchPlaceholder="Search my clients"
            searchValue={myParams.search}
            onSearchChange={(search) =>
              setMyParams({ ...myParams, search, page: 1 })
            }
            columnToggle
            pagination
            height={calcWindowHeight(myClients.length ? 160 : 220)}
            emptyTitle="No clients found in your sales queue"
            emptySubTitle="Check the Unassigned / Self-Registered Pool tab to acquire self-registered clients."
            isLoading={isMyFetching}
            paginationProps={{
              currentPage: myData?.meta?.current_page ?? 1,
              total: myData?.meta?.total_count ?? 0,
              rowsPerPage: myParams.per_page,
              totalPages: myData?.meta?.total_pages ?? 1,
              onPagination: (page) => setMyParams({ ...myParams, page }),
              onRowsPerPage: (rows) =>
                setMyParams({ ...myParams, per_page: Number(rows), page: 1 }),
              dropOptions: [10, 20, 30, 50, 100],
            }}
          />
        )}

        {/* Tab 2: Unassigned / Self-Registered Pool */}
        {activeTab === 'unassigned' && (
          <div className="space-y-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-emerald-600 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  These are self-registered or unassigned clients. Any active
                  Sales representative can acquire them on a first-come,
                  first-served basis.
                </span>
              </div>
              <button
                type="button"
                onClick={() => refetchUnassigned()}
                className="font-semibold text-emerald-700 hover:text-emerald-800 underline ml-2"
              >
                Refresh Pool
              </button>
            </div>

            <SmartTable
              data={unassignedClients}
              dataRowKey="id"
              columns={unassignedColumns}
              externalActions
              toolbar
              search
              searchPlaceholder="Search unassigned clients"
              searchValue={unassignedParams.search}
              onSearchChange={(search) =>
                setUnassignedParams({ ...unassignedParams, search, page: 1 })
              }
              columnToggle
              pagination
              height={calcWindowHeight(unassignedClients.length ? 210 : 260)}
              emptyTitle="No unassigned clients at the moment"
              emptySubTitle="When new clients register via the mobile app or web signup, they will appear here."
              isLoading={isUnassignedFetching}
              paginationProps={{
                currentPage: unassignedData?.meta?.current_page ?? 1,
                total: unassignedData?.meta?.total_count ?? 0,
                rowsPerPage: unassignedParams.per_page,
                totalPages: unassignedData?.meta?.total_pages ?? 1,
                onPagination: (page) =>
                  setUnassignedParams({ ...unassignedParams, page }),
                onRowsPerPage: (rows) =>
                  setUnassignedParams({
                    ...unassignedParams,
                    per_page: Number(rows),
                    page: 1,
                  }),
                dropOptions: [10, 20, 30, 50, 100],
              }}
            />
          </div>
        )}
      </div>

      {/* Confirmation Modal before acquiring */}
      {confirmClient && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setConfirmClient(null)}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                  <svg
                    className="w-5 h-5 text-emerald-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold leading-tight">
                    Acquire Client
                  </h3>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Claim this self-registered client into your queue
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmClient(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Are you sure you want to acquire{' '}
                <strong className="text-slate-900 font-semibold">
                  {confirmClient.name || 'this client'}
                </strong>{' '}
                ({confirmClient.email || confirmClient.phone || '--'})?
              </p>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-500 space-y-1">
                <div>
                  • This client will be assigned directly to your Sales account.
                </div>
                <div>
                  • You will be responsible for creating package proposals,
                  confirming subscriptions, and assigning service staff.
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmClient(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors"
                disabled={Boolean(acquiringId)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAcquire(confirmClient)}
                disabled={Boolean(acquiringId)}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md shadow-emerald-500/25 transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {acquiringId === confirmClient.id
                  ? 'Acquiring...'
                  : 'Confirm & Acquire'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
