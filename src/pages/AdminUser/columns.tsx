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
  return `${trimmed.slice(0, limit).trim()}...`
}

const capitalizeFirst = (value?: string | null) => {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export const getColumns = ({
  onNameClick,
  activeRole,
}:
  | {
      onNameClick?: (row: any) => void
      activeRole?:
        | 'user'
        | 'nutritionist'
        | 'physiotherapist'
        | 'yogist'
        | 'sales'
        | 'marketing'
    }
  | AdminListResponse
  | any) => {
  const createRenderCell =
    (key: string, isCustom?: string) => (row: AdminListResponse | any) => {
      if (isCustom === 'fullname') {
        const full =
          `${row?.user?.first_name || ''} ${row?.user?.last_name || ''}`.trim()
        const display = truncateText(full, 40)
        return {
          cell: display,
          toolTip: full,
        }
      } else if (isCustom === 'lastlogin') {
        const dateStr = row?.user?.last_login
          ? moment(row?.user?.last_login).format('DD-MM-YYYY')
          : ''
        return {
          cell: dateStr,
          toolTip: dateStr,
        }
      } else if (isCustom === 'capitalize') {
        const propertyValue = getNestedProperty(row, key)
        const val = typeof propertyValue === 'string' ? propertyValue : ''
        const cap = val
          ? val.replace(
              /\w\S*/g,
              (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
            )
          : ''
        const display = truncateText(cap, 40)
        return {
          cell: display,
          toolTip: cap,
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
        const truncated = truncateText(display, 40)
        return {
          cell: truncated,
          toolTip: display,
        }
      } else if (isCustom === 'fulldate') {
        const propertyValue = getNestedProperty(row, key)

        return {
          cell: convertUTCtoBrowserTimeZone(propertyValue),
          toolTip: getNestedProperty(row, key) ?? '',
        }
      } else if (isCustom === 'dob') {
        const dobVal =
          getNestedProperty(row, 'date_of_birth') ||
          getNestedProperty(row, 'dob') ||
          getNestedProperty(row, 'user.date_of_birth')

        const display =
          dobVal && moment(dobVal).isValid()
            ? moment(dobVal).format('DD-MM-YYYY')
            : ''
        return {
          cell: display,
          toolTip: display,
        }
      } else if (isCustom === 'age') {
        const ageVal = getNestedProperty(row, 'age')
        const dobVal =
          getNestedProperty(row, 'date_of_birth') ||
          getNestedProperty(row, 'dob') ||
          getNestedProperty(row, 'user.date_of_birth')

        let display = ''
        if (ageVal !== undefined && ageVal !== null && ageVal !== '') {
          display = String(ageVal)
        } else if (dobVal && moment(dobVal).isValid()) {
          display = String(moment().diff(moment(dobVal), 'years'))
        }
        return {
          cell: display,
          toolTip: display,
        }
      } else if (isCustom === 'assigned-team') {
        const teamVal =
          getNestedProperty(row, 'assigned_team') ||
          getNestedProperty(row, 'assigned_to') ||
          getNestedProperty(row, 'team') ||
          getNestedProperty(row, 'nutritionist.name') ||
          getNestedProperty(row, 'nutritionist')
        const raw = typeof teamVal === 'string' ? teamVal : ''
        const display = raw
          ? raw.replace(
              /\w\S*/g,
              (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
            )
          : ''
        const truncated = truncateText(display, 40)
        return {
          cell: truncated,
          toolTip: display,
        }
      } else if (isCustom === 'country') {
        const countryVal =
          getNestedProperty(row, 'country') ||
          getNestedProperty(row, 'ethnicity')
        const raw = typeof countryVal === 'string' ? countryVal : ''
        const display = raw
          ? raw.replace(
              /\w\S*/g,
              (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
            )
          : ''
        const truncated = truncateText(display, 40)
        return {
          cell: truncated,
          toolTip: display,
        }
      } else if (isCustom === 'food-preference') {
        const prefVal =
          getNestedProperty(row, 'food_preferences') ||
          getNestedProperty(row, 'food_preference') ||
          getNestedProperty(row, 'food_pref')
        const raw = typeof prefVal === 'string' ? prefVal : ''
        const display = raw
          ? raw.replace(
              /\w\S*/g,
              (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
            )
          : ''
        const truncated = truncateText(display, 40)
        const lower = raw.toLowerCase()
        let pillClass = 'bg-gray-200 text-gray-800 border-gray-300'
        if (lower === 'vegetarian') {
          pillClass = 'bg-green-200 text-green-800 border-green-400'
        } else if (
          lower === 'non-vegetarian' ||
          lower === 'non veg' ||
          lower === 'nonveg'
        ) {
          pillClass = 'bg-red-200 text-red-800 border-red-400'
        } else if (lower === 'vegan') {
          pillClass = 'bg-emerald-200 text-emerald-800 border-emerald-400'
        } else if (lower === 'eggetarian') {
          pillClass = 'bg-amber-200 text-amber-800 border-amber-400'
        } else if (lower === 'pescatarian') {
          pillClass = 'bg-blue-200 text-blue-800 border-blue-400'
        }
        return {
          cell: display ? (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${pillClass}`}
            >
              {truncated}
            </span>
          ) : (
            truncated
          ),
          toolTip: display,
        }
      } else if (isCustom === 'allergies') {
        const allergyVal =
          getNestedProperty(row, 'food_allergies') ||
          getNestedProperty(row, 'allergies') ||
          getNestedProperty(row, 'medical_allergies')
        const raw = typeof allergyVal === 'string' ? allergyVal : ''
        const display = raw
          ? raw.replace(
              /\w\S*/g,
              (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
            )
          : ''
        const truncated = truncateText(display, 40)
        return {
          cell: truncated,
          toolTip: display,
        }
      } else if (isCustom === 'active-plan') {
        const planVal =
          getNestedProperty(row, 'subscribed_plan.name') ||
          getNestedProperty(row, 'subscribed_plan.plan_name') ||
          getNestedProperty(row, 'active_plan')
        const display = typeof planVal === 'string' ? planVal : ''
        const truncated = truncateText(display, 40)
        return {
          cell: truncated,
          toolTip: display,
        }
      } else if (isCustom === 'plan-start-date') {
        const startDateVal =
          getNestedProperty(row, 'subscribed_plan.start_date') ||
          getNestedProperty(row, 'start_date')
        const display =
          startDateVal && moment(startDateVal).isValid()
            ? moment(startDateVal).format('DD-MM-YYYY')
            : ''
        return {
          cell: display,
          toolTip: display,
        }
      } else if (isCustom === 'plan-end-date') {
        const endDateVal =
          getNestedProperty(row, 'subscribed_plan.end_date') ||
          getNestedProperty(row, 'end_date')
        const display =
          endDateVal && moment(endDateVal).isValid()
            ? moment(endDateVal).format('DD-MM-YYYY')
            : ''
        return {
          cell: display,
          toolTip: display,
        }
      } else if (isCustom === 'work-schedule') {
        const schedVal =
          getNestedProperty(row, 'work_schedule') ||
          getNestedProperty(row, 'schedule') ||
          getNestedProperty(row, 'work_shift')
        const raw = typeof schedVal === 'string' ? schedVal : ''
        const display = raw
          ? raw.replace(
              /\w\S*/g,
              (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
            )
          : ''
        const truncated = truncateText(display, 40)
        return {
          cell: truncated,
          toolTip: display,
        }
      } else if (isCustom === 'occupation') {
        const occVal =
          getNestedProperty(row, 'occupation') ||
          getNestedProperty(row, 'job_role') ||
          getNestedProperty(row, 'profession')
        const raw = typeof occVal === 'string' ? occVal : ''
        const display = raw
          ? raw.replace(
              /\w\S*/g,
              (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
            )
          : ''
        const truncated = truncateText(display, 40)
        return {
          cell: truncated,
          toolTip: display,
        }
      } else if (isCustom === 'source-enquiry') {
        const srcVal =
          getNestedProperty(row, 'source_enquiry') ||
          getNestedProperty(row, 'source') ||
          getNestedProperty(row, 'enquiry_source')
        const raw = typeof srcVal === 'string' ? srcVal : ''
        const display = raw
          ? raw.replace(
              /\w\S*/g,
              (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
            )
          : ''
        const truncated = truncateText(display, 40)
        return {
          cell: truncated,
          toolTip: display,
        }
      } else if (isCustom === 'status-colored') {
        const propertyValue = getNestedProperty(row, key)
        const raw = typeof propertyValue === 'string' ? propertyValue : ''
        const lower = raw.toLowerCase()
        const display = raw
          ? raw.replace(
              /\w\S*/g,
              (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
            )
          : ''
        const isActive = lower === 'active'
        const pillClass = `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`
        const truncated = truncateText(display, 40)
        return {
          cell: <span className={pillClass}>{truncated}</span>,
          toolTip: display,
        }
      } else {
        const val = getNestedProperty(row, key)
        const strVal =
          typeof val === 'string'
            ? val
            : val !== undefined && val !== null
              ? String(val)
              : ''
        const display = typeof val === 'string' ? truncateText(val, 40) : val
        return {
          cell: display,
          toolTip: strVal,
        }
      }
    }
  const isNutritionist = activeRole === 'nutritionist'
  const isPhysiotherapist = activeRole === 'physiotherapist'
  const isYogist = activeRole === 'yogist'
  const isSales = activeRole === 'sales'
  const isMarketing = activeRole === 'marketing'
  const isFlatRole = isPhysiotherapist || isYogist || isSales || isMarketing
  const isUserRole = activeRole === 'user'

  const column: any[] = [
    {
      title: 'Name',
      field: 'name',
      renderCell: (row: any) => {
        const raw = getNestedProperty(row, 'name') as string | undefined
        const displayValue =
          typeof raw === 'string' && raw.length > 0
            ? raw.charAt(0).toUpperCase() + raw.slice(1)
            : (raw ?? '')
        const truncated = truncateText(displayValue, 40)

        return {
          cell: truncated,
          toolTip: displayValue,
        }
      },
      customCell: true,
      link: true,
      rowClick: (row: any) => onNameClick && onNameClick(row),
      ...defaultColumnProps,
    },
    {
      title: 'Phone Number',
      field: 'phone',
      renderCell: createRenderCell('phone'),
      customCell: true,
      ...defaultColumnProps,
    },
    {
      title: 'Email',
      field: 'email',
      renderCell: createRenderCell('email'),
      customCell: true,
      ...defaultColumnProps,
    },
  ]

  if (isFlatRole || isNutritionist) {
    column.push(
      {
        title: 'DOB',
        field: 'date_of_birth',
        renderCell: createRenderCell('date_of_birth', 'dob'),
        customCell: true,
        ...defaultColumnProps,
      },
      {
        title: 'Age',
        field: 'age',
        renderCell: createRenderCell('age', 'age'),
        customCell: true,
        ...defaultColumnProps,
      },
      {
        title: 'Gender',
        field: 'gender',
        renderCell: createRenderCell('gender', 'capitalize'),
        customCell: true,
        ...defaultColumnProps,
      }
      // {
      //   title: 'Created At',
      //   field: 'created_at',
      //   renderCell: createRenderCell('created_at', 'fulldate'),
      //   customCell: true,
      //   ...defaultColumnProps,
      // }
    )
  } else if (isUserRole) {
    column.push(
      {
        title: 'DOB',
        field: 'date_of_birth',
        renderCell: createRenderCell('date_of_birth', 'dob'),
        customCell: true,
        ...defaultColumnProps,
      },
      {
        title: 'Age',
        field: 'age',
        renderCell: createRenderCell('age', 'age'),
        customCell: true,
        ...defaultColumnProps,
      },
      {
        title: 'Language',
        field: 'language',
        renderCell: createRenderCell('language', 'capitalize'),
        customCell: true,
        ...defaultColumnProps,
      },
      {
        title: 'Gender',
        field: 'gender',
        renderCell: createRenderCell('gender', 'capitalize'),
        customCell: true,
        ...defaultColumnProps,
      },
      {
        title: 'State',
        field: 'state',
        renderCell: createRenderCell('state', 'capitalize'),
        customCell: true,
        ...defaultColumnProps,
      },
      {
        title: 'Country',
        field: 'country',
        renderCell: createRenderCell('country', 'country'),
        customCell: true,
        ...defaultColumnProps,
      },
      {
        title: 'Food Preference',
        field: 'food_preferences',
        renderCell: createRenderCell('food_preferences', 'food-preference'),
        customCell: true,
        ...defaultColumnProps,
      },
      {
        title: 'Allergies',
        field: 'food_allergies',
        renderCell: createRenderCell('food_allergies', 'allergies'),
        customCell: true,
        ...defaultColumnProps,
      },
      {
        title: 'Active Plan',
        field: 'subscribed_plan.name',
        renderCell: createRenderCell('subscribed_plan.name', 'active-plan'),
        customCell: true,
        ...defaultColumnProps,
      },
      {
        title: 'Start Date',
        field: 'subscribed_plan.start_date',
        renderCell: createRenderCell(
          'subscribed_plan.start_date',
          'plan-start-date'
        ),
        customCell: true,
        ...defaultColumnProps,
      },
      {
        title: 'End Date',
        field: 'subscribed_plan.end_date',
        renderCell: createRenderCell(
          'subscribed_plan.end_date',
          'plan-end-date'
        ),
        customCell: true,
        ...defaultColumnProps,
      },
      {
        title: 'Work Schedule',
        field: 'work_schedule',
        renderCell: createRenderCell('work_schedule', 'work-schedule'),
        customCell: true,
        ...defaultColumnProps,
      },
      {
        title: 'Occupation',
        field: 'occupation',
        renderCell: createRenderCell('occupation', 'occupation'),
        customCell: true,
        ...defaultColumnProps,
      }
    )
  }

  column.push({
    title: 'Role',
    field: 'role',
    renderCell: createRenderCell('role', 'role-capitalize'),
    customCell: true,
    ...defaultColumnProps,
  })

  if (isUserRole) {
    column.push(
      {
        title: 'Sales Rep',
        field: 'sales_rep',
        renderCell: (row: any) => {
          const rep = row?.sales_rep
          if (rep?.name) {
            return {
              cell: (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {capitalizeFirst(rep.name)}
                </span>
              ),
              toolTip: `${capitalizeFirst(rep.name)} (${rep.email || ''})`,
            }
          }
          return {
            cell: (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Unassigned
              </span>
            ),
            toolTip: 'No sales representative assigned',
          }
        },
        customCell: true,
        ...defaultColumnProps,
      },
      {
        title: 'BMI',
        field: 'bmi',
        renderCell: createRenderCell('bmi'),
        customCell: true,
        ...defaultColumnProps,
      }
    )
  }

  column.push({
    title: 'Status',
    field: 'status',
    renderCell: createRenderCell('status', 'status-colored'),
    ...defaultColumnProps,
    customCell: true,
  })

  return column
}
