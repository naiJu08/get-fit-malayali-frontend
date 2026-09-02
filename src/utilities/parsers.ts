import { useMemo } from 'react'

export const parseQueryParams = (params: Record<string, any> = {}) => {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== '' && v !== undefined && v !== null
  )
  if (!entries.length) return ''
  const qs = entries
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
    )
    .join('&')
  return `?${qs}`
}

export const parseExpQueryParams = (params = {}) => {
  if (!Object.entries(params).length) return ''
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc + `${key}=${value}&`,
    ''
  )
}

export const formatFormErrors = (params = {}) => {
  if (!Object.entries(params).length) return ''
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc + `${key}=${value},`,
    ''
  )
}
export const getErrorMessage = (error: any): string => {
  if (!error) {
    return 'An unexpected error occurred'
  }
  if (typeof error === 'string') {
    return error
  }

  // Some APIs return an array of validation errors
  if (Array.isArray(error) && error.length > 0) {
    const first = error[0]
    if (typeof first === 'string') {
      return error.join(', ')
    }
    if (first?.ctx?.error) {
      if (Array.isArray(first.ctx.error)) {
        return first.ctx.error.join(', ')
      }
      return String(first.ctx.error)
    }
    if (first?.msg) {
      if (Array.isArray(first.msg)) {
        return first.msg.join(', ')
      }
      return String(first.msg)
    }
    // Fall back to stringifying the array elements
    return error
      .map((e: any) => (typeof e === 'string' ? e : String(e)))
      .join(', ')
  }

  if (error && typeof error === 'object') {
    if (error.errors) {
      return getErrorMessage(error.errors)
    }
    if (error.message) {
      if (Array.isArray(error.message)) {
        return error.message.join(', ')
      }
      return String(error.message)
    }
    if (error.error && typeof error.error === 'string') {
      return error.error
    }
  }

  return 'An unexpected error occurred'
}

export const getNestedProperty = (
  obj: any,
  key: string
): string | undefined => {
  const parts = key?.split('.')
  const endKey = parts[parts.length - 1]
  if (parts.length > 1) {
    const parentObj = parts
      .slice(0, parts.length - 1)
      .reduce((o, x) => (o === undefined || o === null ? o : o[x]), obj)

    if (!parentObj) {
      return undefined
    }
    if (Array.isArray(parentObj)) {
      return parentObj
        .map((item: any) => item[endKey])
        .filter(Boolean)
        .join(', ')
    } else if (typeof parentObj === 'object' && parentObj[endKey]) {
      return parentObj[endKey] ?? ''
    } else {
      return undefined
    }
  }

  return parts.reduce((o, x) => (o === undefined ? o : o[x]), obj)
}

export const EMAIL_REGEX =
  '^(([^<>()[]\\.,;:s@"]+(.[^<>()[]\\.,;:s@"]+)*)|(".+"))@(([[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}])|(([a-zA-Z-0-9]+.)+[a-zA-Z]{2,}))$'

type SortOrder = 'asc' | 'desc' | undefined

export const getSortedColumnName = (
  sortColumn: string,
  sortOrder: SortOrder
): string => {
  if (sortOrder === 'asc') {
    return sortColumn
  } else if (sortOrder === 'desc') {
    return `-${sortColumn}`
  } else {
    return ''
  }
}
export const useCurrencyFormat = (
  amount: number,
  locale = 'en-US',
  currency = 'INR'
) => {
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
      }),
    [locale, currency]
  )

  return formatter.format(amount)
}

export const numberFormat = (number: any) => {
  if (number) {
    return Number(number).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  } else {
    return '0.00'
  }
}
export const getServiceTotal = (
  chrg = 0,
  gvt = 0,
  gst = 0,
  disc = 0,
  vf = 0
) => {
  // Convert the inputs to strings and then parse them as floats
  const charge = parseFloat(chrg?.toString()) || 0
  const govtFee = parseFloat(gvt?.toString()) || 0
  const gstPercent = parseFloat(gst?.toString()) || 0
  const discountPercent = parseFloat(disc?.toString()) || 0
  const vendorFee = parseFloat(vf?.toString()) || 0

  // Apply discount if applicable
  const discountedCharge = charge * (1 - discountPercent / 100)
  const discountedVendorFee = vendorFee * (1 - discountPercent / 100)

  // Calculate GST on the sum of charge and vendor fee after discount
  const gstAmount =
    ((discountedCharge + discountedVendorFee) * gstPercent) / 100

  // Calculate the total amount
  const total = govtFee + discountedCharge + discountedVendorFee + gstAmount
  // const rounded_total: any = parseFloat(value).toFixed(0)

  return total.toFixed(2)
}

// Format the time in 12-hour format with AM/PM
export const formatTime = (dateString: string | Date) => {
  const date = new Date(dateString)
  let hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours %= 12
  hours = hours || 12 // the hour '0' should be '12'
  const strHours = hours < 10 ? `0${hours}` : hours?.toString()
  const strMinutes = minutes < 10 ? `0${minutes}` : minutes?.toString()

  return `${strHours}:${strMinutes} ${ampm}`
}

export const formatTime24Hour = (dateString: string | Date) => {
  const date = new Date(dateString)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()

  const strHours = hours < 10 ? `0${hours}` : hours?.toString()
  const strMinutes = minutes < 10 ? `0${minutes}` : minutes?.toString()
  const strSeconds = seconds < 10 ? `0${seconds}` : seconds?.toString()

  return `${strHours}:${strMinutes}:${strSeconds}`
}

export const createTimeDateFromString = (timeString: string) => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)

  const [hours, minutes, seconds] = timeString?.split(':')

  date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds))

  return date
}
