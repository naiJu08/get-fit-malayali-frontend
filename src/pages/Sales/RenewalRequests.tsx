import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import SmartTable from '../../components/common/table/SmartTable'
import ListingHeader from '../../components/common/ListingTiles'
import InfoBox from '../../components/app/alertBox/infoBox'
import Icons from '../../components/common/icons'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { getApiErrorMessage } from '../../utilities/commonUtilities'
import { useRenewalRequests } from './api'

export default function RenewalRequests() {
  const navigate = useNavigate()
  const [params, setParams] = useState({
    page: 1,
    per_page: 20,
    search: '',
    status: 'pending',
  })
  const { data, isFetching, error } = useRenewalRequests(params)
  const requests = data?.renewal_requests || []
  const openRequest = (row: any) => {
    const query = new URLSearchParams({ tab: 'packages' })
    if (row.status === 'pending') {
      query.set('renewal_request_id', String(row.id))
      query.set('start_date', row.suggested_start_date)
    }
    navigate(`/sales/clients/${row.user_id}?${query}`)
  }
  const cell = (field: string, title: string, format: (row: any) => any) => ({
    field,
    title,
    isVisible: true,
    customCell: true,
    renderCell: (row: any) => ({ cell: format(row) || '—' }),
  })
  const columns = [
    cell('client_name', 'Client', (r) => r.client_name),
    cell('plan_name', 'Current package', (r) => r.plan_name),
    cell('end_date', 'Expiry date', (r) =>
      moment(r.end_date).format('DD-MM-YYYY')
    ),
    cell(
      'requested_by',
      'Requested by',
      (r) => `${r.requested_by.name} (${r.requested_by.role})`
    ),
    cell(
      'sales_owner',
      'Sales owner',
      (r) => r.sales_owner?.name || 'Superadmin queue'
    ),
    cell('notes', 'Renewal notes', (r) => r.notes),
    cell('status', 'Status', (r) => r.status),
  ]
  return (
    <div>
      <ListingHeader
        data={{ title: 'Renewal Requests' }}
        checkPermission={false}
      />
      <div className="space-y-4 p-4">
        <label className="flex items-center gap-3 text-sm">
          Status
          <select
            className="rounded border border-formBorder bg-white p-2"
            value={params.status}
            onChange={(e) =>
              setParams({ ...params, page: 1, status: e.target.value })
            }
          >
            <option value="pending">Pending</option>
            <option value="proposed">Package proposed</option>
            <option value="confirmed">Confirmed</option>
            <option value="">All</option>
          </select>
        </label>
        {error ? (
          <InfoBox
            content={
              getApiErrorMessage(error) || 'Unable to load renewal requests.'
            }
          />
        ) : (
          <SmartTable
            data={requests}
            dataRowKey="id"
            columns={columns}
            toolbar
            search
            pagination
            externalActions
            searchPlaceholder="Search clients"
            searchValue={params.search}
            onSearchChange={(search) =>
              setParams({ ...params, search, page: 1 })
            }
            isLoading={isFetching}
            emptyTitle="No renewal requests"
            height={calcWindowHeight(210)}
            actionProps={[
              {
                title: 'View',
                toolTip: 'Open renewal package',
                icon: <Icons name="eye" />,
                action: openRequest,
              },
            ]}
            paginationProps={{
              currentPage: data?.meta?.current_page || 1,
              total: data?.meta?.total_count || 0,
              totalPages: data?.meta?.total_pages || 1,
              rowsPerPage: params.per_page,
              onPagination: (page) => setParams({ ...params, page }),
              onRowsPerPage: (rows) =>
                setParams({ ...params, per_page: Number(rows), page: 1 }),
              dropOptions: [10, 20, 50],
            }}
          />
        )}
      </div>
    </div>
  )
}
