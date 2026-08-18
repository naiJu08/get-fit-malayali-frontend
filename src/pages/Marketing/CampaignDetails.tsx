import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSnackbarManager } from '../../components/common/snackbar'
import { useParams, useNavigate } from 'react-router-dom'
import Button from '../../components/common/buttons/Button'
import ListingHeader from '../../components/common/ListingTiles'
import SmartTable from '../../components/common/table/SmartTable'
import { calcWindowHeight } from '../../utilities/calcHeight'
import {
  useCampaignLeads,
  createMarketingLead,
  updateMarketingLead,
  getSalesTeam,
  assignMarketingLead,
  createLeadActivity,
} from './api'
export default function CampaignDetails() {
  const { id } = useParams()
  const nav = useNavigate()
  const { enqueueSnackbar } = useSnackbarManager()
  const { data, isFetching, refetch } = useCampaignLeads(id, {
    page: 1,
    per_page: 100,
  })
  const [editing, setEditing] = useState<any>(null)
  const [activity, setActivity] = useState<any>(null)
  const [assigning, setAssigning] = useState<any>(null)
  const { data: team } = useQuery(['sales_team'], getSalesTeam)
  const rows = data?.leads || []
  const columns: any[] = [
    {
      title: 'Name',
      field: 'first_name',
      renderCell: (r: any) => ({
        cell: r.first_name + ' ' + (r.last_name || ''),
        toolTip: r.first_name,
      }),
      customCell: true,
      sortable: false,
      resizable: true,
      isVisible: true,
    },
    {
      title: 'Contact',
      field: 'email',
      renderCell: (r: any) => ({
        cell: r.email || r.phone || '',
        toolTip: r.email || r.phone || '',
      }),
      customCell: true,
      sortable: false,
      resizable: true,
      isVisible: true,
    },
    {
      title: 'Status',
      field: 'status',
      renderCell: (r: any) => ({
        cell: (
          <span className="capitalize">
            {String(r.status).replace('_', ' ')}
          </span>
        ),
        toolTip: r.status,
      }),
      customCell: true,
      sortable: false,
      resizable: true,
      isVisible: true,
    },
    {
      title: 'Assigned to',
      field: 'assigned_to.name',
      renderCell: (r: any) => ({
        cell: r.assigned_to?.name || 'Unassigned',
        toolTip: r.assigned_to?.name || 'Unassigned',
      }),
      customCell: true,
      sortable: false,
      resizable: true,
      isVisible: true,
    },
  ]
  const save = async () => {
    try {
      if (editing.id)
        await updateMarketingLead({
          campaignId: id,
          id: editing.id,
          data: editing,
        })
      else await createMarketingLead({ campaignId: id, data: editing })
      enqueueSnackbar('Lead saved successfully', { variant: 'success' })
      setEditing(null)
      refetch()
    } catch (e: any) {
      enqueueSnackbar(
        e?.response?.data?.errors?.join(', ') || 'Unable to save lead',
        { variant: 'error' }
      )
    }
  }
  return (
    <div className="p-4">
      <div className="mb-3">
        <Button
          label="Back to campaigns"
          outlined
          onClick={() => nav('/marketing/campaigns')}
        />
      </div>
      <ListingHeader
        data={{ title: 'Campaign Leads', icon: 'customer-icon' }}
        onActionClick={() =>
          setEditing({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            status: 'new_lead',
            notes: '',
          })
        }
        actionProps={{ actionTitle: 'Add lead' }}
        checkPermission
      />
      <SmartTable
        data={rows}
        dataRowKey="id"
        columns={columns}
        search
        searchPlaceholder="Search leads"
        isLoading={isFetching}
        height={calcWindowHeight(rows.length ? 200 : 218)}
        emptyTitle="No leads to display"
        pagination
        paginationProps={{
          onPagination: () => undefined,
          total: data?.meta?.total_count || rows.length,
          currentPage: data?.meta?.current_page || 1,
          rowsPerPage: 100,
          onRowsPerPage: () => undefined,
          totalPages: data?.meta?.total_pages || 1,
        }}
        actionProps={[
          {
            title: 'Edit',
            icon: <span>✎</span>,
            action: (row) => setEditing(row),
          },
          {
            title: 'Assign',
            icon: <span>↗</span>,
            action: (row) => setAssigning(row),
          },
          {
            title: 'Track',
            icon: <span>•</span>,
            action: (row) => setActivity(row),
          },
        ]}
      />
      {editing && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded p-5 w-full max-w-lg space-y-2">
            <h2 className="font-semibold">Lead</h2>
            {['first_name', 'last_name', 'email', 'phone'].map((k) => (
              <input
                key={k}
                className="border rounded p-2 w-full"
                placeholder={k.replace('_', ' ')}
                value={editing[k] || ''}
                onChange={(e) =>
                  setEditing({ ...editing, [k]: e.target.value })
                }
              />
            ))}
            <select
              className="border rounded p-2 w-full"
              value={editing.status}
              onChange={(e) =>
                setEditing({ ...editing, status: e.target.value })
              }
            >
              {['new_lead', 'contacted', 'qualified', 'converted', 'lost'].map(
                (x) => (
                  <option key={x}>{x}</option>
                )
              )}
            </select>
            <textarea
              className="border rounded p-2 w-full"
              placeholder="Notes"
              value={editing.notes || ''}
              onChange={(e) =>
                setEditing({ ...editing, notes: e.target.value })
              }
            />
            <div className="flex justify-end gap-2">
              <Button
                label="Cancel"
                outlined
                primary={false}
                onClick={() => setEditing(null)}
              />
              <Button label="Save" onClick={save} />
            </div>
          </div>
        </div>
      )}
      {assigning && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded p-5 w-full max-w-sm">
            <h2 className="font-semibold mb-3">Assign to sales</h2>
            <select
              className="border rounded p-2 w-full"
              onChange={async (e) => {
                await assignMarketingLead({
                  campaignId: id,
                  id: assigning.id,
                  assigned_to_id: e.target.value,
                })
                enqueueSnackbar('Lead assigned successfully', {
                  variant: 'success',
                })
                setAssigning(null)
                refetch()
              }}
            >
              <option>Select team member</option>
              {(team?.users || []).map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      {activity && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded p-5 w-full max-w-sm">
            <h2 className="font-semibold">Add tracking activity</h2>
            <select
              className="border rounded p-2 w-full my-2"
              value={activity.type || 'contacted'}
              onChange={(e) =>
                setActivity({ ...activity, type: e.target.value })
              }
            >
              {['contacted', 'qualified', 'note', 'converted', 'lost'].map(
                (x) => (
                  <option key={x}>{x}</option>
                )
              )}
            </select>
            <textarea
              className="border rounded p-2 w-full"
              placeholder="Notes"
              value={activity.notes || ''}
              onChange={(e) =>
                setActivity({ ...activity, notes: e.target.value })
              }
            />
            <div className="flex justify-end gap-2 mt-3">
              <Button
                label="Cancel"
                outlined
                primary={false}
                onClick={() => setActivity(null)}
              />
              <Button
                label="Save activity"
                onClick={async () => {
                  await createLeadActivity({
                    campaignId: id,
                    id: activity.id,
                    data: {
                      activity_type: activity.type,
                      notes: activity.notes,
                    },
                  })
                  enqueueSnackbar('Activity added', { variant: 'success' })
                  setActivity(null)
                  refetch()
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
