import React from 'react'
import moment from 'moment'
import Icons from '../../components/common/icons/index'
import { NotificationRecord } from '../../apis/notifications.api'
import { useAuthStore } from '../../store/authStore'
import { resolveNotificationUrl } from '../../utilities/notificationNavigation'

interface NotificationItemProps {
  item: NotificationRecord
  onMarkAsRead?: (id: number | string) => void
  onNavigate?: (url: string, id: number | string) => void
  onDelete?: (id: number | string) => void
  hideStatusBadge?: boolean
}

const getTypeBadge = (type?: string) => {
  const normalized = (type || 'general').toLowerCase()
  switch (normalized) {
    case 'assignment':
      return {
        label: 'Assignment',
        bgColor: 'bg-purple-100 dark:bg-purple-950/60',
        textColor: 'text-purple-700 dark:text-purple-300',
        borderColor: 'border-purple-200 dark:border-purple-800',
      }
    case 'reassignment':
      return {
        label: 'Reassignment',
        bgColor: 'bg-violet-100 dark:bg-violet-950/60',
        textColor: 'text-violet-700 dark:text-violet-300',
        borderColor: 'border-violet-200 dark:border-violet-800',
      }
    case 'proposal':
    case 'lead_acceptance':
      return {
        label: 'Proposal',
        bgColor: 'bg-amber-100 dark:bg-amber-950/60',
        textColor: 'text-amber-700 dark:text-amber-300',
        borderColor: 'border-amber-200 dark:border-amber-800',
      }
    case 'reminder':
    case 'reminder_settings':
    case 'user_reminder':
      return {
        label: 'Reminder',
        bgColor: 'bg-sky-100 dark:bg-sky-950/60',
        textColor: 'text-sky-700 dark:text-sky-300',
        borderColor: 'border-sky-200 dark:border-sky-800',
      }
    case 'body_measurement':
    case 'body_measurements':
      return {
        label: 'Measurement',
        bgColor: 'bg-violet-100 dark:bg-violet-950/60',
        textColor: 'text-violet-700 dark:text-violet-300',
        borderColor: 'border-violet-200 dark:border-violet-800',
      }
    case 'vitals':
    case 'daily_vitals':
      return {
        label: 'Vitals',
        bgColor: 'bg-cyan-100 dark:bg-cyan-950/60',
        textColor: 'text-cyan-700 dark:text-cyan-300',
        borderColor: 'border-cyan-200 dark:border-cyan-800',
      }
    case 'refund_request':
      return {
        label: 'Refund',
        bgColor: 'bg-rose-100 dark:bg-rose-950/60',
        textColor: 'text-rose-700 dark:text-rose-300',
        borderColor: 'border-rose-200 dark:border-rose-800',
      }
    case 'renewal_request':
      return {
        label: 'Renewal',
        bgColor: 'bg-emerald-100 dark:bg-emerald-950/60',
        textColor: 'text-emerald-700 dark:text-emerald-300',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
      }
    case 'profile_completion':
    case 'profile_update':
      return {
        label: 'Profile',
        bgColor: 'bg-indigo-100 dark:bg-indigo-950/60',
        textColor: 'text-indigo-700 dark:text-indigo-300',
        borderColor: 'border-indigo-200 dark:border-indigo-800',
      }
    case 'motivational':
      return {
        label: 'Motivation',
        bgColor: 'bg-teal-100 dark:bg-teal-950/60',
        textColor: 'text-teal-700 dark:text-teal-300',
        borderColor: 'border-teal-200 dark:border-teal-800',
      }
    case 'lead':
      return {
        label: 'Lead',
        bgColor: 'bg-blue-100 dark:bg-blue-950/60',
        textColor: 'text-blue-700 dark:text-blue-300',
        borderColor: 'border-blue-200 dark:border-blue-800',
      }
    case 'campaign':
    case 'campaign_expiring':
      return {
        label: 'Campaign',
        bgColor: 'bg-orange-100 dark:bg-orange-950/60',
        textColor: 'text-orange-700 dark:text-orange-300',
        borderColor: 'border-orange-200 dark:border-orange-800',
      }
    default:
      return {
        label: normalized.replace(/_/g, ' '),
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-700 dark:text-gray-300',
        borderColor: 'border-gray-200 dark:border-gray-700',
      }
  }
}

export default function NotificationItem({
  item,
  onMarkAsRead,
  onNavigate,
  onDelete,
  hideStatusBadge,
}: NotificationItemProps) {
  const isUnread = !item.is_read
  const isPriority = Boolean(
    item.is_priority ||
      item.priority === 'high' ||
      item.notification_type === 'reassignment' ||
      item.title?.toLowerCase().includes('reassignment advised') ||
      item.title?.toLowerCase().includes('unaccepted')
  )
  const typeBadge = getTypeBadge(item.notification_type)
  const relativeTime = item.created_at ? moment(item.created_at).fromNow() : ''
  const loginRole = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())

  const effectiveUrl = resolveNotificationUrl(item.action_url, loginRole, item)
  const canNavigate = Boolean(
    onNavigate &&
      (item.action_url || (effectiveUrl && effectiveUrl !== '/dashboard'))
  )

  const cardStyle = isPriority
    ? isUnread
      ? 'bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent dark:from-amber-950/40 dark:via-rose-950/30 dark:to-gray-800/80 border-amber-300 dark:border-amber-600/70 shadow-md border-l-[5px] border-l-rose-500 ring-1 ring-amber-400/30'
      : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 border-l-[5px] border-l-amber-500 hover:border-amber-300 dark:hover:border-amber-700'
    : isUnread
      ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 shadow-sm border-l-4 border-l-blue-600'
      : 'bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'

  return (
    <div
      className={`group relative flex flex-col p-4 rounded-xl border transition-all duration-200 ${cardStyle}`}
    >
      {/* Urgent Top Ribbon for Priority Leads */}
      {isPriority && (
        <div className="flex items-center justify-between gap-2 px-2.5 py-1 mb-2.5 rounded-lg bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-transparent border border-amber-300/60 dark:border-amber-600/40 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
            </span>
            <span>⚡ Urgent Lead Action Required</span>
            <span className="hidden sm:inline-block text-[11px] font-normal text-amber-700 dark:text-amber-300">
              • Unaccepted lead (&gt; 2 days)
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-rose-500 text-white shadow-xs">
            Priority
          </span>
        </div>
      )}

      {/* Top Header: Badge, Unread Dot, Timestamp */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {isUnread && (
            <span
              className={`h-2.5 w-2.5 rounded-full flex-shrink-0 animate-pulse ${
                isPriority ? 'bg-rose-500' : 'bg-blue-600'
              }`}
              title="New notification"
            />
          )}
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border uppercase tracking-wider capitalize ${
              isPriority
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                : `${typeBadge.bgColor} ${typeBadge.textColor} ${typeBadge.borderColor}`
            }`}
          >
            {isPriority ? 'Lead Reassignment' : typeBadge.label}
          </span>
          {!hideStatusBadge &&
            (isUnread ? (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  isPriority
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}
              >
                New
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                Read
              </span>
            ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-400 whitespace-nowrap">
            {relativeTime}
          </span>
          {onDelete && (
            <button
              onClick={() => onDelete(item.id)}
              className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
              title="Delete notification"
              type="button"
            >
              <Icons className="h-4 w-4" name="delete" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Title & Message */}
      <div className="mb-3">
        <h4
          className={`text-[15px] leading-snug mb-1 ${
            isPriority
              ? isUnread
                ? 'font-bold text-gray-900 dark:text-white flex items-center gap-1.5'
                : 'font-semibold text-gray-800 dark:text-gray-100'
              : isUnread
                ? 'font-bold text-gray-900 dark:text-white'
                : 'font-semibold text-gray-700 dark:text-gray-200'
          }`}
        >
          {isPriority && (
            <svg
              className="w-4 h-4 text-rose-500 inline-block flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <span>{item.title}</span>
        </h4>
        <p className="text-[13px] leading-relaxed text-gray-600 dark:text-gray-300 break-words">
          {item.message}
        </p>
      </div>

      {/* Footer Info & Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/60 mt-auto">
        <div className="text-xs text-gray-400 dark:text-gray-400 truncate max-w-[200px]">
          {item.sent_by ? `By ${item.sent_by}` : ''}
        </div>

        <div className="flex items-center gap-2">
          {/* Mark as read button */}
          {isUnread && onMarkAsRead && (
            <button
              type="button"
              onClick={() => onMarkAsRead(item.id)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-700 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title="Mark as read"
            >
              <svg
                className="w-3.5 h-3.5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Mark as read</span>
            </button>
          )}

          {/* Go to page button with icon */}
          {canNavigate && (
            <button
              type="button"
              onClick={() =>
                onNavigate!(
                  (item.action_url as string) || effectiveUrl,
                  item.id
                )
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white rounded-lg shadow-sm transition-all hover:shadow active:scale-95 cursor-pointer ${
                isPriority
                  ? 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700'
                  : 'bg-[#0066CC] hover:bg-[#0052a3] dark:bg-blue-600 dark:hover:bg-blue-700'
              }`}
              title={`Go to detail page`}
            >
              <span>{isPriority ? 'View & Reassign' : 'Go to page'}</span>
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
