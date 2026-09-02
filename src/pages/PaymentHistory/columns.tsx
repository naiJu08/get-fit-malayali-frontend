import moment from 'moment'
import { getNestedProperty } from '../../utilities/parsers'

const defaultColumnProps = {
  sortable: false,
  resizable: true,
  isVisible: true,
}

export const getColumns = (
  navigate?: (path: string) => void,
  isSuperAdmin?: boolean
) => {
  const createRenderCell =
    (key: string, formatter?: (v: any, row?: any) => any) => (row: any) => {
      const val = getNestedProperty(row, key)
      const cell = formatter ? formatter(val, row) : val
      return { cell, toolTip: typeof cell === 'string' ? cell : '' }
    }

  const formatDate = (d: any) => (d ? moment(d).format('DD-MM-YYYY') : '')
  const column = [
    {
      title: 'Client',
      field: 'user_name',
      renderCell: createRenderCell('user_name', (val, row) => (
        <button
          type="button"
          className="text-blue-600 hover:underline"
          onClick={() =>
            navigate &&
            navigate(
              isSuperAdmin
                ? `/users/${row?.user_id || val}/details`
                : `/sales/clients/${row?.client_id || row?.user_id || val}`
            )
          }
        >
          {val}
        </button>
      )),
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
  ]

  return column
}

export default getColumns
