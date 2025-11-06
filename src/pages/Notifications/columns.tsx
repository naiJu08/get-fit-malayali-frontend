import moment from 'moment'

import { getNestedProperty } from '../../utilities/parsers'

const defaultColumnProps = {
  sortable: false,
  resizable: true,
  isVisible: true,
}

export const getColumns = () => {
  const createRenderCell =
    (key: string, formatter?: (v: any) => any) => (row: any) => {
      const val = getNestedProperty(row, key)
      const cell = formatter ? formatter(val) : val
      return { cell, toolTip: typeof cell === 'string' ? cell : '' }
    }

  const formatDateTime = (d: any) =>
    d ? moment(d).format('YYYY-MM-DD HH:mm') : ''
  const capitalize = (s: any) =>
    typeof s === 'string'
      ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
      : s

  const column = [
    {
      title: 'Title',
      field: 'title',
      renderCell: createRenderCell('title'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Message',
      field: 'message',
      renderCell: createRenderCell('message'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Type',
      field: 'notification_type',
      renderCell: createRenderCell('notification_type', capitalize),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Scheduled At',
      field: 'scheduled_at',
      renderCell: createRenderCell('scheduled_at', formatDateTime),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Sent By',
      field: 'sent_by',
      renderCell: createRenderCell('sent_by'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Delivered',
      field: 'delivered_count',
      renderCell: createRenderCell('delivered_count', (v) => v ?? 0),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Recipients',
      field: 'recipient_ids',
      renderCell: createRenderCell('recipient_ids', (v) =>
        Array.isArray(v) ? v.length : (v ?? 0)
      ),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'First Sent',
      field: 'first_sent_at',
      renderCell: createRenderCell('first_sent_at', formatDateTime),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Last Sent',
      field: 'last_sent_at',
      renderCell: createRenderCell('last_sent_at', formatDateTime),
      customCell: true,
      ...defaultColumnProps,
    },
  ]

  return column
}

export default getColumns
