import moment from 'moment'

import { AdminListResponse } from '../../common/types'
import { convertUTCtoBrowserTimeZone } from '../../utilities/format'
import { getNestedProperty } from '../../utilities/parsers'

const defaultColumnProps = {
  sortable: false,
  resizable: true,
  isVisible: true,
}

export const getColumns = ({ onViewAction }: AdminListResponse | any) => {
  const createRenderCell =
    (key: string, isCustom?: string) => (row: AdminListResponse) => {
      if (isCustom === 'fullname') {
        return {
          cell: <>{`${row?.user?.first_name} ${row?.user?.last_name}`}</>,
        }
      } else if (isCustom === 'lastlogin') {
        return {
          cell: (
            <>
              {row?.user?.last_login
                ? moment(row?.user?.last_login).format('DD-MM-YYYY')
                : ''}
            </>
          ),
        }
      } else if (isCustom === 'fulldate') {
        const propertyValue = getNestedProperty(row, key)

        return {
          cell: convertUTCtoBrowserTimeZone(propertyValue),
          toolTip: getNestedProperty(row, key) ?? '',
        }
      } else {
        return {
          cell: getNestedProperty(row, key),
          toolTip: getNestedProperty(row, key) ?? '',
        }
      }
    }

  const column = [
    {
      title: 'Name',
      field: 'first_name',
      ...defaultColumnProps,
      fixed: true,
      renderCell: createRenderCell('user.first_name', 'fullname'),
      customCell: true,
      sortKey: 'user__first_name',
      link: true,
      rowClick: (row: any) => onViewAction(row),
    },
    // {
    //   title: 'Role',
    //   field: 'job_role',
    //   renderCell: createRenderCell('user.group.name'),
    //   customCell: true,
    //   ...defaultColumnProps,
    // },
    {
      title: 'Job Title',
      field: 'job_title',
      renderCell: createRenderCell('user.job_title'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Email',
      renderCell: createRenderCell('user.username'),
      field: 'username',
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Status',
      field: 'status',
      renderCell: createRenderCell('user.status'),
      ...defaultColumnProps,
      customCell: true,
    },
    {
      title: 'Last login',
      field: 'last_login_days_ago',
      // type: 'date',
      renderCell: createRenderCell('user.last_login_days_ago'),
      ...defaultColumnProps,
      customCell: true,
    },
  ]

  return column
}
