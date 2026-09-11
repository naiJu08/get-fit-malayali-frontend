import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import InfoBox from '../../../components/app/alertBox/infoBox'
import { useSnackbarManager } from '../../../components/common/snackbar'
import { getUserBatchDetail } from '../api'

type BatchDetailUser = {
  id: string | number
  value: string
}

type BatchDetail = {
  id?: string | number
  name?: string
  description?: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
  userCount?: number
  users: BatchDetailUser[]
}

const filterNonNull = <T,>(item: T | null | undefined): item is T =>
  item !== null && item !== undefined

const buildUserOption = (user: any, fallbackId?: any) => {
  if (!user && fallbackId === undefined) return null
  const base = user || {}
  const nested = base?.user || {}
  const resolvedId =
    base?.id ??
    base?.user_id ??
    base?.userId ??
    base?.uuid ??
    base?.user_uuid ??
    nested?.id ??
    nested?.user_id ??
    fallbackId
  if (resolvedId === undefined || resolvedId === null) {
    return null
  }
  const firstName = base?.first_name ?? nested?.first_name ?? ''
  const lastName = base?.last_name ?? nested?.last_name ?? ''
  const fullName =
    base?.full_name ??
    nested?.full_name ??
    [firstName, lastName].filter(Boolean).join(' ')
  const label =
    base?.name ??
    fullName ??
    base?.username ??
    nested?.username ??
    base?.email ??
    nested?.email ??
    `User ${resolvedId}`
  return { id: resolvedId, value: label }
}

const resolveBatchUserOptions = (batchData: any) => {
  if (!batchData) return []
  const selectedFromUsers = Array.isArray(batchData?.users)
    ? batchData.users.map((u: any) => buildUserOption(u)).filter(filterNonNull)
    : []
  const selectedFromMembers =
    !selectedFromUsers.length && Array.isArray(batchData?.user_batch_members)
      ? batchData.user_batch_members
          .map((member: any) => buildUserOption(member?.user ?? member))
          .filter(filterNonNull)
      : []
  const selectedFromIds =
    !selectedFromUsers.length &&
    !selectedFromMembers.length &&
    Array.isArray(batchData?.user_ids)
      ? batchData.user_ids
          .map((uid: any) => buildUserOption(null, uid))
          .filter(filterNonNull)
      : []
  return selectedFromUsers.length
    ? selectedFromUsers
    : selectedFromMembers.length
      ? selectedFromMembers
      : selectedFromIds
}

const formatDateTime = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

const BatchHistoryDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { enqueueSnackbar } = useSnackbarManager()

  const [detail, setDetail] = useState<BatchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const fetchDetail = async () => {
      if (!id) {
        setError('Batch id is missing')
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const response = await getUserBatchDetail(String(id))
        const batchData = response?.user_batch ?? response ?? {}
        const users = resolveBatchUserOptions(batchData)
        const userCount =
          batchData?.users_count ??
          batchData?.user_count ??
          (Array.isArray(batchData?.user_ids)
            ? batchData.user_ids.length
            : users.length)
        if (isMounted) {
          setDetail({
            id: batchData?.id ?? id,
            name: batchData?.name ?? '-',
            description: batchData?.description ?? '',
            createdBy:
              batchData?.created_by ??
              batchData?.createdBy ??
              response?.created_by ??
              response?.createdBy ??
              '',
            createdAt:
              batchData?.created_at ??
              batchData?.createdAt ??
              response?.created_at ??
              response?.createdAt,
            updatedAt:
              batchData?.updated_at ??
              batchData?.updatedAt ??
              response?.updated_at ??
              response?.updatedAt,
            userCount,
            users,
          })
        }
      } catch (err: any) {
        if (!isMounted) return
        const message =
          err?.response?.data?.error?.message ||
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          'Failed to load batch details'
        setError(message)
        enqueueSnackbar(message, { variant: 'error' })
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchDetail()

    return () => {
      isMounted = false
    }
  }, [enqueueSnackbar, id])

  const users = useMemo(() => detail?.users ?? [], [detail])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              onClick={() => navigate('/notifications/history')}
            >
              &larr; Back to Batch History
            </button>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              Batch Details
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Review the configuration and members of this batch
            </p>
          </div>
          {detail?.id ? (
            <div className="text-right">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Batch ID
              </div>
              <div className="font-mono text-sm text-gray-700">{detail.id}</div>
            </div>
          ) : null}
        </div>

        {loading ? (
          <InfoBox content={'Loading batch details...'} />
        ) : error ? (
          <InfoBox content={error} />
        ) : !detail ? (
          <InfoBox content={'Batch details not available.'} />
        ) : (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="text-xs font-medium text-gray-500 uppercase">
                  Batch Name
                </div>
                <div className="mt-1 text-lg font-semibold text-gray-900">
                  {detail.name || '-'}
                </div>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="text-xs font-medium text-gray-500 uppercase">
                  Created By
                </div>
                <div className="mt-1 text-lg font-semibold text-gray-900">
                  {detail.createdBy || '-'}
                </div>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="text-xs font-medium text-gray-500 uppercase">
                  Created At
                </div>
                <div className="mt-1 text-sm text-gray-700">
                  {formatDateTime(detail.createdAt)}
                </div>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="text-xs font-medium text-gray-500 uppercase">
                  Updated At
                </div>
                <div className="mt-1 text-sm text-gray-700">
                  {formatDateTime(detail.updatedAt)}
                </div>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="text-xs font-medium text-gray-500 uppercase">
                  Total Users
                </div>
                <div className="mt-1 text-xl font-semibold text-gray-900">
                  {detail.userCount ?? users.length}
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                Description
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {detail.description?.trim()
                  ? detail.description
                  : 'No description provided.'}
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-medium text-gray-500 uppercase">
                  Users
                </div>
                <span className="text-xs text-gray-400">
                  Showing {users.length} user{users.length === 1 ? '' : 's'}
                </span>
              </div>
              {users.length ? (
                <div className="flex flex-wrap gap-2">
                  {users.map((user) => (
                    <span
                      key={user.id}
                      className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                    >
                      {user.value}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-gray-200 rounded-lg p-4 text-sm text-gray-500">
                  No users attached to this batch.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BatchHistoryDetail
