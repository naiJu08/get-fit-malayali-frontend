import { useEffect, useState } from 'react'
import Button from '../../../components/common/buttons/Button'
import Icons from '../../../components/common/icons'
import SmartTable from '../../../components/common/table/SmartTable'
import { calcWindowHeight } from '../../../utilities/calcHeight'
import {
  createAssignedClient,
  deleteAssignedClient,
  useAdminUser,
  useAssignedClients,
} from '../api'
import { AutoComplete } from 'qbs-core'
import { DialogModal } from '../../../components/common'
import { useSnackbarManager } from '../../../components/common/snackbar'
import moment from 'moment'

export default function Clients({ user }: { user: any }) {
  const [clientsPage, setClientsPage] = useState(1)
  const [clientsPageSize, setClientsPageSize] = useState(10)
  const {
    data: assignedData,
    isFetching: clientsLoading,
    refetch: refetchAssigned,
  } = useAssignedClients({
    admin_id: user?.id,
    page: clientsPage,
    per_page: clientsPageSize,
  } as any)
  const assignedClients = assignedData?.items || []

  const clientColumns: any[] = [
    {
      title: 'Client Name',
      field: 'user_name',
      customCell: true,
      renderCell: (row: any) => ({
        cell: row?.user_name,
        toolTip: row?.user_name,
      }),
      sortable: false,
      resizable: true,
      isVisible: true,
    },
    {
      title: 'Assigned At',
      field: 'assigned_at',
      customCell: true,
      renderCell: (row: any) => ({
        cell: row?.assigned_at
          ? moment(row.assigned_at).format('YYYY-MM-DD HH:mm')
          : '',
        toolTip: row?.assigned_at,
      }),
      sortable: false,
      resizable: true,
      isVisible: true,
    },
  ]

  const [assignOpen, setAssignOpen] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [unassigning, setUnassigning] = useState(false)
  const { enqueueSnackbar } = useSnackbarManager()

  useEffect(() => {
    if (!assignOpen) setSelectedClient(null)
  }, [assignOpen])

  const { data: usersList, isFetching: usersLoading } = useAdminUser(
    {
      page: 1,
      per_page: 9999,
      search: '',
      role: 'user',
      status: 'active',
    } as any
    // { enabled: assignOpen }
  )
  const userOptions = (usersList?.items || []).filter((u: any) => {
    const r = String(u?.role || '').toLowerCase()
    return r === 'user' || r === '3'
  })

  const handleAssignClient = async () => {
    if (!user?.id || !selectedClient?.id) return
    try {
      setAssigning(true)
      const res = await createAssignedClient({
        admin_id: user.id,
        user_id: selectedClient.id,
      })
      try {
        enqueueSnackbar(res?.message || 'Client assigned successfully', {
          variant: 'success',
        })
      } catch {}
      setAssignOpen(false)
      setSelectedClient(null)
      try {
        await refetchAssigned()
      } catch {}
    } finally {
      setAssigning(false)
    }
  }

  const handleUnassignClient = async (row: any) => {
    if (!row?.id) return
    try {
      setUnassigning(true)
      const res = await deleteAssignedClient(row.id)
      try {
        enqueueSnackbar(res?.message || 'Client unassigned successfully', {
          variant: 'success',
        })
      } catch {}
      await refetchAssigned()
    } catch (err: any) {
      try {
        enqueueSnackbar(
          err?.response?.data?.message || 'Failed to unassign client',
          { variant: 'error' }
        )
      } catch {}
    } finally {
      setUnassigning(false)
    }
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button
          className="primaryButton"
          label="Assign Client"
          onClick={() => {
            setSelectedClient(null)
            setAssignOpen(true)
          }}
        />
      </div>
      <SmartTable
        data={assignedClients}
        dataRowKey="id"
        toolbar={false}
        search={false}
        isLoading={clientsLoading || unassigning}
        height={
          assignedClients?.length === 0
            ? calcWindowHeight(218)
            : calcWindowHeight(150)
        }
        emptyTitle="No clients to display"
        emptySubTitle={''}
        columns={clientColumns}
        pagination={true}
        externalActions={true}
        actionProps={[
          {
            icon: <Icons name="delete" />,
            title: 'Unassign',
            toolTip: 'Unassign Client',
            action: (row: any) => handleUnassignClient(row),
          },
        ]}
        paginationProps={{
          onPagination: (page: number) => setClientsPage(page),
          total: assignedData?.total ?? 0,
          currentPage: assignedData?.current_page ?? clientsPage,
          rowsPerPage: Number(clientsPageSize),
          onRowsPerPage: (n: number | string) => setClientsPageSize(Number(n)),
          dropOptions: [10, 20, 30, 50, 100],
        }}
      />

      <DialogModal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign Client"
        onSubmit={handleAssignClient}
        actionLabel="Assign"
        actionLoader={assigning}
        secondaryAction={() => setAssignOpen(false)}
        secondaryActionLabel="Cancel"
        small={false}
        body={
          <div className="min-h-[200px] flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Select User <span className="text-red-500">*</span>
              </label>
              <AutoComplete
                name="assign_user_id"
                type="custom_search_select"
                desc="name"
                descId="id"
                data={userOptions}
                placeholder={
                  usersLoading ? 'Loading users...' : 'Select a user'
                }
                value={selectedClient?.name ?? ''}
                onChange={(opt: any) => setSelectedClient(opt)}
                required
              />
            </div>
          </div>
        }
      />
    </>
  )
}
