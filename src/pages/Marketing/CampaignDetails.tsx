import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSnackbarManager } from '../../components/common/snackbar'
import { useParams, useNavigate } from 'react-router-dom'
import Button from '../../components/common/buttons/Button'
import ListingHeader from '../../components/common/ListingTiles'
import SmartTable from '../../components/common/table/SmartTable'
import Tab from '../../components/common/tab/Tab'
import { TabContainer } from '../../components/common'
import Icons from '../../components/common/icons'
import InfoBox from '../../components/app/alertBox/infoBox'
import { calcWindowHeight } from '../../utilities/calcHeight'
import {
  useMarketingCampaign,
  useCampaignLeads,
  createMarketingLead,
  updateMarketingLead,
  getSalesTeam,
  assignMarketingLead,
  createLeadActivity,
} from './api'

function DetailItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm">{value || '--'}</div>
    </div>
  )
}

function formatDate(d: any) {
  if (!d) return '--'
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return String(d)
  }
}

function displayStatus(value: any) {
  return String(value || 'draft')
    .replace(/_/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase())
}

function statusColor(value: any) {
  const s = String(value || '').toLowerCase()
  if (s === 'active') return 'bg-green-50 text-green-700'
  if (s === 'draft') return 'bg-yellow-50 text-yellow-700'
  if (s === 'inactive') return 'bg-gray-100 text-gray-600'
  return 'bg-gray-100 text-gray-600'
}

export default function CampaignDetails() {
  const { id } = useParams()
  const nav = useNavigate()
  const { enqueueSnackbar } = useSnackbarManager()

  const { data: campaignData, isLoading: campaignLoading } =
    useMarketingCampaign(id)
  const campaign = campaignData?.marketing_campaign

  const [activeTab, setActiveTab] = useState<'details' | 'leads'>('details')

  const [leadsParams, setLeadsParams] = useState({
    page: 1,
    per_page: 100,
    search: '',
  })
  const {
    data: leadsData,
    isFetching: leadsFetching,
    refetch: refetchLeads,
  } = useCampaignLeads(id, leadsParams)
  const [editing, setEditing] = useState<any>(null)
  const [activity, setActivity] = useState<any>(null)
  const [assigning, setAssigning] = useState<any>(null)
  const { data: team } = useQuery(['sales_team'], getSalesTeam)

  const rows = leadsData?.leads || []
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

  const handleTabClick = (item: { id: string | number; label: string }) => {
    setActiveTab(String(item.id) as 'details' | 'leads')
  }

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
      refetchLeads()
    } catch (e: any) {
      enqueueSnackbar(
        e?.response?.data?.errors?.join(', ') || 'Unable to save lead',
        { variant: 'error' }
      )
    }
  }

  const copyLink = async () => {
    if (!campaign) return
    try {
      const publicUrl = new URL(
        `/public/campaigns/${campaign.public_token}`,
        window.location.origin
      ).toString()
      await navigator.clipboard.writeText(publicUrl)
      enqueueSnackbar('Public link copied', { variant: 'success' })
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Unable to copy link', {
        variant: 'error',
      })
    }
  }

  return (
    <div className="p-4">
      {/* Header card */}
      <div className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div>
          <div className="flex items-center">
            <button
              onClick={() => nav('/marketing/campaigns')}
              className="rounded-lg hover:bg-gray-100 transition"
              aria-label="Back"
            >
              <Icons name="left-arrow-icon" />
            </button>

            <h1 className="text-xl font-semibold text-gray-900">
              {campaignLoading ? 'Loading...' : campaign?.name || 'Campaign'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm ml-3">
            {campaign?.status && (
              <div
                className={`flex items-center gap-1 px-3 py-1 rounded-lg ${statusColor(campaign.status)}`}
              >
                <span className="font-medium">Status:</span>
                <span className="capitalize">
                  {displayStatus(campaign.status)}
                </span>
              </div>
            )}

            {campaign?.marketing_form?.name && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 text-blue-700">
                <span className="font-medium">Form:</span>
                <span>{campaign.marketing_form.name}</span>
              </div>
            )}

            {campaign?.leads_count !== undefined && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-50 text-purple-700">
                <span className="font-medium">Leads:</span>
                <span>{campaign.leads_count}</span>
              </div>
            )}

            {campaign?.starts_on && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-50 text-gray-700">
                <span className="font-medium">Period:</span>
                <span>
                  {campaign.starts_on}
                  {campaign.ends_on ? ` – ${campaign.ends_on}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {campaignLoading && (
        <div className="p-6">
          <InfoBox content="Loading campaign details..." />
        </div>
      )}

      {!campaignLoading && !campaign && (
        <div className="p-6">
          <InfoBox content="Campaign not found." />
        </div>
      )}

      {!campaignLoading && campaign && (
        <TabContainer
          data={[
            { id: 'details', label: 'Details' },
            { id: 'leads', label: 'Leads' },
          ]}
          activeTab={activeTab}
          onClick={handleTabClick}
        >
          <Tab id="details">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailItem label="Name" value={campaign.name} />
                <DetailItem label="Description" value={campaign.description} />
                <DetailItem
                  label="Status"
                  value={
                    <span className="capitalize">
                      {displayStatus(campaign.status)}
                    </span>
                  }
                />
                <DetailItem
                  label="Form"
                  value={campaign.marketing_form?.name || '--'}
                />
                <DetailItem
                  label="Total Leads"
                  value={campaign.leads_count || 0}
                />
                <DetailItem
                  label="Start Date"
                  value={formatDate(campaign.starts_on)}
                />
                <DetailItem
                  label="End Date"
                  value={formatDate(campaign.ends_on)}
                />
                <DetailItem
                  label="Created At"
                  value={formatDate(campaign.created_at)}
                />
              </div>
              {campaign.public_url && (
                <div className="border rounded-lg p-3 bg-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500">Public Link</span>
                    <button
                      onClick={copyLink}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      <Icons name="external-link" />
                      Copy link
                    </button>
                  </div>
                  <div className="text-sm text-gray-700 break-all">
                    {campaign.public_url}
                  </div>
                </div>
              )}
            </div>
          </Tab>
          <Tab id="leads">
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
              searchValue={leadsParams.search}
              onSearchChange={(value: string) =>
                setLeadsParams({ ...leadsParams, search: value, page: 1 })
              }
              isLoading={leadsFetching}
              height={calcWindowHeight(rows.length ? 200 : 218)}
              emptyTitle="No leads to display"
              pagination
              paginationProps={{
                onPagination: (page: number) =>
                  setLeadsParams({ ...leadsParams, page }),
                total: leadsData?.meta?.total_count || rows.length,
                currentPage: leadsData?.meta?.current_page || 1,
                rowsPerPage: leadsParams.per_page,
                onRowsPerPage: (per_page: string | number) =>
                  setLeadsParams({
                    ...leadsParams,
                    per_page: Number(per_page),
                    page: 1,
                  }),
                totalPages: leadsData?.meta?.total_pages || 1,
                dropOptions: [10, 20, 50, 100],
              }}
              actionProps={[
                {
                  title: 'Edit',
                  icon: <span>✎</span>,
                  action: (row: any) => setEditing(row),
                },
                {
                  title: 'Assign',
                  icon: <span>↗</span>,
                  action: (row: any) => setAssigning(row),
                },
                {
                  title: 'Track',
                  icon: <span>•</span>,
                  action: (row: any) => setActivity(row),
                },
              ]}
            />
          </Tab>
        </TabContainer>
      )}

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
                refetchLeads()
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
                  refetchLeads()
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
