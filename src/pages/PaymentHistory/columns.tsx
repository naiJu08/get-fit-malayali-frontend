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

  const formatDate = (d: any) => (d ? moment(d).format('YYYY-MM-DD') : '')
  const column = [
    {
      title: 'Client',
      field: 'user_name',
      renderCell: createRenderCell('user_name'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Plan',
      field: 'plan_name',
      renderCell: createRenderCell('plan_name'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Start Date',
      field: 'start_date',
      renderCell: createRenderCell('start_date', formatDate),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'End Date',
      field: 'end_date',
      renderCell: createRenderCell('end_date', formatDate),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Fees',
      field: 'plan_fees',
      renderCell: createRenderCell('plan_fees'),
      customCell: true,
      ...defaultColumnProps,
    },

    // {
    //   title: 'Days Remaining',
    //   field: 'days_remaining',
    //   renderCell: createRenderCell('days_remaining'),
    //   customCell: true,
    //   ...defaultColumnProps,
    // },
    // {
    //   title: 'Status',
    //   field: 'status',
    //   renderCell: createRenderCell('status', capitalize),
    //   customCell: true,
    //   ...defaultColumnProps,
    // },
  ]

  return column
}

export default getColumns
