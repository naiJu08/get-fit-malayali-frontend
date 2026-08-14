import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SmartTable from '../../components/common/table/SmartTable'
import Icons from '../../components/common/icons'
import { calcWindowHeight } from '../../utilities/calcHeight'
import ListingHeader from '../../components/common/ListingTiles'
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal'
import { useSnackbarManager } from '../../components/common/snackbar'
import YogaTemplateForm from './create'
import { useAuthStore } from '../../store/authStore'
import {
  useYogaTemplateList,
  deleteYogaTemplate,
  duplicateYogaTemplate,
} from './api'
import { checkPermissions } from '../../layout/store'

export default function YogaTemplateIndex() {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbarManager()
  const role = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const [params, setParams] = useState({ page: 1, per_page: 20, search: '' })
  const [open, setOpen] = useState(false)
  const [editRow, setEditRow] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const { data, isFetching, refetch } = useYogaTemplateList(params)
  const templates = data?.yoga_templates ?? []

  const duplicate = async (row: any) => {
    try {
      await duplicateYogaTemplate(row.id)
      enqueueSnackbar('Yoga template duplicated successfully', {
        variant: 'success',
      })
      refetch()
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.errors?.join(', ') ||
          'Failed to duplicate template',
        { variant: 'error' }
      )
    }
  }

  const remove = async () => {
    if (!deleteId) return
    try {
      await deleteYogaTemplate(deleteId)
      enqueueSnackbar('Yoga template deleted successfully', {
        variant: 'success',
      })
      setDeleteId(null)
      refetch()
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.errors?.join(', ') ||
          'Template cannot be deleted',
        { variant: 'error' }
      )
    }
  }

  const columns: any[] = [
    {
      title: 'Name',
      field: 'name',
      customCell: true,
      renderCell: (row: any) => ({
        cell: (
          <button
            className="text-blue-600 hover:underline"
            onClick={() => navigate(`/yoga-templates/${row.id}`)}
          >
            {row.name}
          </button>
        ),
      }),
    },
    { title: 'Intensity Level', field: 'intensity_level' },
    { title: 'Days', field: 'duration_days' },
    { title: 'Template Days', field: 'days_count' },
    {
      title: 'Created At',
      field: 'created_at',
      customCell: true,
      renderCell: (row: any) => ({
        cell: row.created_at
          ? new Date(row.created_at).toLocaleDateString()
          : '-',
      }),
    },
  ]
  const openEdit = (row: any) => setEditRow(row)

  const actions =
    role === 'nutritionist'
      ? []
      : [
          {
            title: 'View',
            toolTip: 'View',
            icon: <Icons name="eye" />,
            action: (row: any) => navigate(`/yoga-templates/${row.id}`),
          },
          {
            title: 'Edit',
            toolTip: 'Edit',
            icon: <Icons name="edit" />,
            action: openEdit,
          },
          {
            title: 'Duplicate',
            toolTip: 'Duplicate',
            icon: <Icons name="duplicate-icon" />,
            action: duplicate,
          },
          {
            title: 'Delete',
            toolTip: 'Delete',
            icon: <Icons name="table-delete" />,
            action: (row: any) => setDeleteId(row.id),
          },
        ]

  return (
    <div>
      <ListingHeader
        data={{ title: 'Yoga Templates', icon: 'yoga' }}
        onActionClick={
          role !== 'nutritionist' ? () => setOpen(true) : undefined
        }
        actionProps={{ actionTitle: 'Create Template' }}
        checkPermission={
          role !== 'nutritionist' && checkPermissions('Employee', 'create')
        }
      />
      <div className="p-4">
        <SmartTable
          data={templates}
          dataRowKey="id"
          toolbar
          search
          searchPlaceholder="Search Template Name"
          searchValue={params.search}
          height={
            templates.length === 0
              ? calcWindowHeight(218)
              : calcWindowHeight(150)
          }
          onSearchChange={(search: string) =>
            setParams({ ...params, search, page: 1 })
          }
          onSearch={() => refetch()}
          columns={columns}
          actionProps={actions}
          externalActions
          columnToggle
          pagination
          isLoading={isFetching}
          paginationProps={{
            currentPage: data?.meta?.current_page ?? 1,
            total: data?.meta?.total_count ?? 0,
            rowsPerPage: params.per_page,
            totalPages: data?.meta?.total_pages ?? 1,
            onPagination: (page: number) => setParams({ ...params, page }),
            onRowsPerPage: (rows: string | number) =>
              setParams({ ...params, per_page: Number(rows), page: 1 }),
          }}
        />
      </div>
      <YogaTemplateForm
        isOpen={open}
        handleClose={() => setOpen(false)}
        onSuccess={() => refetch()}
      />
      <YogaTemplateForm
        isOpen={!!editRow}
        handleClose={() => setEditRow(null)}
        edit
        rowData={editRow}
        onSuccess={() => refetch()}
      />
      <ConfirmDeleteModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={remove}
        title="Delete yoga template?"
        subTitle="Assigned templates cannot be deleted."
      />
    </div>
  )
}
