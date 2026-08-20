import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SmartTable from '../../../components/common/table/SmartTable'
import Icons from '../../../components/common/icons'
import { calcWindowHeight } from '../../../utilities/calcHeight'
import { useUserMarketingForms } from '../api'

export default function MarketingFormsTab({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const [params, setParams] = useState({
    page: 1,
    per_page: 20,
    search: '',
    status: '',
  })
  const { data, isFetching } = useUserMarketingForms(userId, params)

  const rows = data?.marketing_forms || []
  const columns: any[] = useMemo(
    () => [
      {
        title: 'Name',
        field: 'name',
        renderCell: (r: any) => ({
          cell: (
            <button
              type="button"
              className="text-blue-600 hover:underline text-left"
              onClick={() =>
                navigate('/marketing/forms/' + r.id, {
                  state: { userId },
                })
              }
            >
              {r.name
                ? r.name.charAt(0).toUpperCase() + r.name.slice(1)
                : r.name}
            </button>
          ),
          toolTip: r.name,
        }),
        customCell: true,
        sortable: false,
        resizable: true,
        isVisible: true,
      },
      {
        title: 'Campaigns',
        field: 'campaigns_count',
        renderCell: (r: any) => ({
          cell: r.campaigns_count || 0,
          toolTip: String(r.campaigns_count || 0),
        }),
        customCell: true,
        sortable: false,
        resizable: true,
        isVisible: true,
      },
      {
        title: 'Status',
        field: 'status',
        renderCell: (r: any) => {
          const statusColor = (() => {
            switch (r.status?.toLowerCase()) {
              case 'active':
                return 'bg-green-100 text-green-800'
              case 'draft':
                return 'bg-yellow-100 text-yellow-800'
              case 'inactive':
                return 'bg-red-100 text-red-800'
              default:
                return 'bg-gray-100 text-gray-800'
            }
          })()
          return {
            cell: (
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColor}`}
              >
                {r.status}
              </span>
            ),
            toolTip: r.status,
          }
        },
        customCell: true,
        sortable: false,
        resizable: true,
        isVisible: true,
      },
    ],
    []
  )

  return (
    <SmartTable
      data={rows}
      dataRowKey="id"
      columns={columns}
      search
      searchPlaceholder="Search forms"
      searchValue={params.search}
      onSearchChange={(value: string) =>
        setParams({ ...params, search: value, page: 1 })
      }
      isLoading={isFetching}
      height={rows.length === 0 ? calcWindowHeight(218) : calcWindowHeight(150)}
      emptyTitle="No forms to display"
      pagination
      paginationProps={{
        onPagination: (page: number) => setParams({ ...params, page }),
        total: data?.meta?.total_count || 0,
        currentPage: data?.meta?.current_page || 1,
        rowsPerPage: params.per_page,
        onRowsPerPage: (per_page: string | number) =>
          setParams({ ...params, per_page: Number(per_page), page: 1 }),
        totalPages: data?.meta?.total_pages || 1,
        dropOptions: [10, 20, 30, 50, 100],
      }}
      externalActions
      actionProps={[
        {
          title: 'View',
          toolTip: 'View',
          icon: <Icons name="eye" />,
          action: (row: any) =>
            navigate('/marketing/forms/' + row.id, {
              state: { userId },
            }),
        },
      ]}
    />
  )
}
