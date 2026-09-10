import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import Icons from '../../../components/common/icons'
import SmartTable from '../../../components/common/table/SmartTable'
import ConfirmDeleteModal from '../../../components/common/modal/ConfirmDeleteModal'
import { calcWindowHeight } from '../../../utilities/calcHeight'
import { deleteAssignedClient, useAssignedClients } from '../api'
import { useSnackbarManager } from '../../../components/common/snackbar'

const formatTitleCase = (value?: string | null) => {
  if (!value) return ''
  return value
    .split(' ')
    .filter((segment) => segment.trim())
    .map((segment) => {
      const lower = segment.toLowerCase()
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

const statusLabel = (value?: string) =>
  (value || 'pending')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const getStatusBadgeClass = (status?: string) => {
  switch (status) {
    case 'accepted':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'assessment_completed':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'package_confirmed':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export default function AcceptedClients({ user }: { user: any }) {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbarManager()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [unassigning, setUnassigning] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [clientToUnassign, setClientToUnassign] = useState<any>(null)

  const {
    data: assignedData,
    isFetching: clientsLoading,
    refetch: refetchAssigned,
  } = useAssignedClients({
    admin_id: user?.id,
    status: 'accepted',
    page,
    per_page: pageSize,
    search,
  } as any)

  const acceptedClients = assignedData?.items || []

  const handleViewClient = (row: any) => {
    const userId = row?.user_id ?? row?.user?.id ?? row?.id
    if (!userId) return
    navigate(`/users/${userId}/details`)
  }

  const handleOpenUnassign = (row: any) => {
    setClientToUnassign(row)
    setDeleteModalOpen(true)
  }

  const handleConfirmUnassign = async () => {
    if (!clientToUnassign?.id) return
    try {
      setUnassigning(true)
      const res = await deleteAssignedClient(clientToUnassign.id)
      enqueueSnackbar(res?.message || 'Client unassigned successfully', {
        variant: 'success',
      })
      setDeleteModalOpen(false)
      setClientToUnassign(null)
      await refetchAssigned()
    } catch (err: any) {
      const msg =
        err?.response?.data?.errors?.[0] ||
        err?.response?.data?.message ||
        'Failed to unassign client'
      enqueueSnackbar(msg, { variant: 'error' })
    } finally {
      setUnassigning(false)
    }
  }

  const clientColumns: any[] = [
    {
      title: 'Client Name',
      field: 'user_name',
      customCell: true,
      renderCell: (row: any) => ({
        cell: (
          <button
            type="button"
            className="text-blue-600 hover:underline font-medium text-left"
            onClick={() => handleViewClient(row)}
          >
            {formatTitleCase(row?.user_name) || '--'}
          </button>
        ),
        toolTip: formatTitleCase(row?.user_name),
      }),
      sortable: false,
      resizable: true,
      isVisible: true,
    },
    {
      title: 'Phone Number',
      field: 'user_phone',
      customCell: true,
      renderCell: (row: any) => ({
        cell: row?.user_phone || '--',
        toolTip: row?.user_phone || '',
      }),
      sortable: false,
      resizable: true,
      isVisible: true,
    },
    {
      title: 'Email',
      field: 'user_email',
      customCell: true,
      renderCell: (row: any) => ({
        cell: row?.user_email || '--',
        toolTip: row?.user_email || '',
      }),
      sortable: false,
      resizable: true,
      isVisible: true,
    },
    {
      title: 'Package',
      field: 'anticipated_package',
      customCell: true,
      renderCell: (row: any) => {
        const pkgName = row?.anticipated_package?.plan?.name
        return {
          cell: pkgName || '--',
          toolTip: pkgName || '',
        }
      },
      sortable: false,
      resizable: true,
      isVisible: true,
    },
    {
      title: 'Status',
      field: 'workflow_status',
      customCell: true,
      renderCell: (row: any) => ({
        cell: (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(
              row?.workflow_status
            )}`}
          >
            {statusLabel(row?.workflow_status)}
          </span>
        ),
        toolTip: statusLabel(row?.workflow_status),
      }),
      sortable: false,
      resizable: true,
      isVisible: true,
    },
    {
      title: 'Next Follow-up',
      field: 'next_follow_up',
      customCell: true,
      renderCell: (row: any) => {
        const scheduledAt = row?.next_follow_up?.scheduled_at
        return {
          cell: scheduledAt
            ? moment(scheduledAt).format('DD-MM-YYYY HH:mm')
            : '--',
          toolTip: scheduledAt
            ? moment(scheduledAt).format('DD-MM-YYYY HH:mm')
            : '',
        }
      },
      sortable: false,
      resizable: true,
      isVisible: true,
    },
    {
      title: 'Accepted At',
      field: 'accepted_at',
      customCell: true,
      renderCell: (row: any) => ({
        cell: row?.accepted_at
          ? moment(row.accepted_at).format('DD-MM-YYYY HH:mm')
          : '--',
        toolTip: row?.accepted_at
          ? moment(row.accepted_at).format('DD-MM-YYYY HH:mm')
          : '',
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
          ? moment(row.assigned_at).format('DD-MM-YYYY HH:mm')
          : '--',
        toolTip: row?.assigned_at
          ? moment(row.assigned_at).format('DD-MM-YYYY HH:mm')
          : '',
      }),
      sortable: false,
      resizable: true,
      isVisible: true,
    },
  ]

  return (
    <>
      <SmartTable
        data={acceptedClients}
        dataRowKey="id"
        toolbar={true}
        search={true}
        searchPlaceholder="Search accepted clients"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setPage(1)
        }}
        columnToggle={true}
        isLoading={clientsLoading || unassigning}
        height={
          acceptedClients?.length === 0
            ? calcWindowHeight(210)
            : calcWindowHeight(270)
        }
        emptyTitle="No accepted clients found"
        emptySubTitle="Clients accepted by this user will appear here"
        columns={clientColumns}
        pagination={true}
        externalActions={true}
        actionProps={[
          {
            icon: <Icons name="eye" />,
            title: 'View',
            toolTip: 'View Client',
            action: (row: any) => handleViewClient(row),
          },
          {
            icon: <Icons name="delete" />,
            title: 'Unassign',
            toolTip: 'Unassign Client',
            action: (row: any) => handleOpenUnassign(row),
          },
        ]}
        paginationProps={{
          onPagination: (p: number) => setPage(p),
          total: assignedData?.total ?? 0,
          currentPage: assignedData?.current_page ?? page,
          rowsPerPage: Number(pageSize),
          totalPages: assignedData?.total_pages ?? 1,
          onRowsPerPage: (n: number | string) => {
            setPageSize(Number(n))
            setPage(1)
          },
          dropOptions: [10, 20, 30, 50, 100],
        }}
      />

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setClientToUnassign(null)
        }}
        onConfirm={handleConfirmUnassign}
        loading={unassigning}
        title="Unassign Client?"
        subTitle={`Are you sure you want to unassign ${
          clientToUnassign?.user_name || 'this client'
        }?`}
        confirmLabel="Unassign"
      />
    </>
  )
}
