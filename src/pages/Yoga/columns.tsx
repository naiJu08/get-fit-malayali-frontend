import moment from 'moment'

import { AdminListResponse } from '../../common/types'
import { convertUTCtoBrowserTimeZone } from '../../utilities/format'
import { getNestedProperty } from '../../utilities/parsers'

const defaultColumnProps = {
  sortable: false,
  resizable: true,
  isVisible: true,
}

const truncateText = (value?: string, limit = 40) => {
  if (!value) return ''
  const trimmed = value.trim()
  if (trimmed.length <= limit) return trimmed
  return `${trimmed.slice(0, limit).trim()}…`
}

const resolveCategoryInfo = (row: any) => {
  const categoryData = row?.category
  if (typeof categoryData === 'string') {
    return {
      categoryName: categoryData,
      subcategoryName: undefined,
    }
  }

  const mainCategoryName =
    typeof categoryData?.main_category?.name === 'string'
      ? categoryData.main_category.name
      : undefined

  const primaryCategoryName =
    mainCategoryName ??
    (typeof categoryData?.parent?.name === 'string'
      ? categoryData?.parent?.name
      : undefined) ??
    (typeof categoryData?.name === 'string' ? categoryData.name : undefined)

  const explicitSubcategory =
    (typeof getNestedProperty(row, 'subcategory.name') === 'string'
      ? (getNestedProperty(row, 'subcategory.name') as string)
      : undefined) ??
    (typeof getNestedProperty(row, 'subcategory_name') === 'string'
      ? (getNestedProperty(row, 'subcategory_name') as string)
      : undefined) ??
    (typeof getNestedProperty(row, 'subcategory') === 'string'
      ? (getNestedProperty(row, 'subcategory') as string)
      : undefined)

  const derivedSubcategoryName =
    explicitSubcategory ??
    (mainCategoryName && typeof categoryData?.name === 'string'
      ? categoryData.name
      : undefined)

  return {
    categoryName: primaryCategoryName,
    subcategoryName: derivedSubcategoryName,
  }
}

export const getColumns = ({
  onNameClick,
  disableNameLink = false,
}:
  | { onNameClick?: (row: any) => void; disableNameLink?: boolean }
  | AdminListResponse
  | any) => {
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
      } else if (isCustom === 'capitalize') {
        const propertyValue = getNestedProperty(row, key)
        const val = typeof propertyValue === 'string' ? propertyValue : ''
        const cap = val
          ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()
          : ''
        return {
          cell: cap,
          toolTip: cap,
        }
      } else if (isCustom === 'link') {
        const propertyValue = getNestedProperty(row, key)
        const url = typeof propertyValue === 'string' ? propertyValue : ''
        return {
          cell: url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#2563eb' }}
            >
              {url}
            </a>
          ) : (
            ''
          ),
          toolTip: url,
        }
      } else if (isCustom === 'role-capitalize') {
        const propertyValue = getNestedProperty(row, key)
        const raw = typeof propertyValue === 'string' ? propertyValue : ''
        const lower = raw.toLowerCase()
        const display =
          lower === 'superadmin'
            ? 'Super Admin'
            : raw
              ? raw.replace(
                  /\w\S*/g,
                  (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
                )
              : ''
        return {
          cell: display,
          toolTip: display,
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
    // {
    //   title: 'Name',
    //   field: 'name',
    //   ...defaultColumnProps,
    //   fixed: true,
    //   renderCell: createRenderCell('user.first_name', 'fullname'),
    //   customCell: true,
    //   sortKey: 'user__first_name',
    //   link: true,
    //   rowClick: (row: any) => onViewAction(row),
    // },
    // {
    //   title: 'Role',
    //   field: 'job_role',
    //   renderCell: createRenderCell('user.group.name'),
    //   customCell: true,
    //   ...defaultColumnProps,
    // },
    {
      title: 'Name',
      field: 'name',
      renderCell: (row: any) => {
        const value = getNestedProperty(row, 'name')
        const raw = typeof value === 'string' ? value : ''
        const formatted = raw
          ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
          : ''
        const display = truncateText(formatted, 50)
        if (!disableNameLink && onNameClick) {
          return {
            cell: (
              <button
                className="text-blue-600 hover:underline"
                onClick={() => onNameClick && onNameClick(row)}
                type="button"
              >
                {display}
              </button>
            ),
            toolTip: formatted,
          }
        }
        return {
          cell: <span>{display}</span>,
          toolTip: formatted,
        }
      },
      customCell: true,
      link: true,
      // rowClick: (row: any) => onNameClick && onNameClick(row),
      // ...defaultColumnProps,
      rowClick:
        !disableNameLink && onNameClick
          ? (row: any) => onNameClick && onNameClick(row)
          : undefined,
      ...defaultColumnProps,
    },
    {
      title: 'Description',
      field: 'description',
      renderCell: (row: any) => {
        const description = getNestedProperty(row, 'description')
        const raw = typeof description === 'string' ? description : ''
        const display = truncateText(raw, 80)
        return {
          cell: <span>{display}</span>,
          toolTip: raw,
        }
      },
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Intensity Level',
      renderCell: createRenderCell('intensity_level'),
      field: 'intensity_level',
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Category',
      field: 'category',
      renderCell: (row: any) => {
        const { categoryName } = resolveCategoryInfo(row)
        const display = categoryName || row?.legacy_category || '-'
        const formatted =
          typeof display === 'string'
            ? display.charAt(0).toUpperCase() + display.slice(1)
            : display
        return {
          cell: <span>{formatted}</span>,
          toolTip: formatted,
        }
      },
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Subcategory',
      field: 'subcategory',
      renderCell: (row: any) => {
        const { subcategoryName } = resolveCategoryInfo(row)
        const display = subcategoryName || '-'
        return {
          cell: <span>{display}</span>,
          toolTip: display,
        }
      },
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Duration(in minutes)',
      field: 'duration_minutes',
      renderCell: createRenderCell('duration_minutes'),
      customCell: true,
      ...defaultColumnProps,
    },

    // {
    //   title: 'Average Rating',
    //   field: 'average_rating',
    //   renderCell: createRenderCell('average_rating'),
    //   customCell: true,
    //   ...defaultColumnProps,
    // },
    // {
    //   title: 'Video URL',
    //   field: 'video_url',
    //   renderCell: createRenderCell('video_url', 'link'),
    //   customCell: true,
    //   ...defaultColumnProps,
    // },
  ]

  return column
}
