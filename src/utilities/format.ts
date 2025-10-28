import moment from 'moment'

export const shortDate = (date: any) => {
  return moment(date).format('DD-MM-YYYY')
}
export const dateTimeWithFormat = (format: string, date?: string) => {
  if (date && format) {
    return moment(date, format).format('DD-MM-YYYY hh:mm A')
  }
  return '--'
}

export const convertDateFormat = (input: string, type?: string): string => {
  // Splitting the string by space to separate date and time
  if (input && input !== null) {
    const parts = input.split(' ')
    const datePart = parts[0]
    const timePart = parts.length > 1 ? ` ${parts[1]}` : ''

    // Splitting the date into [month, day, year]
    const separator = datePart.includes('-') ? '-' : '/'

    const dateComponents = datePart.split(separator)

    if (dateComponents.length !== 3) {
      // Invalid date format
      return input
    }
    let day, month, year
    if (dateComponents.length === 3) {
      if (dateComponents[0].length === 4) {
        // Format: yyyy/mm/dd
        ;[year, month, day] = dateComponents
      } else {
        // Format: mm/dd/yyyy
        ;[month, day, year] = dateComponents
      }
    } else {
      return input // Invalid date format
    }

    // Rearranging to day/month/year format
    return type === 'dateTime'
      ? `${day}-${month}-${year} ${timePart}`
      : `${day}-${month}-${year}`
  } else {
    return ''
  }
}

export const parseDateString = (dateString: any) => {
  const [datePart, timePart, meridian] = dateString.split(' ')
  const [day, month, year] = datePart
    .split('-')
    .map((num: any) => parseInt(num, 10))
  const [hour, minutes] = timePart.split(':')

  let hours = parseInt(hour)
  if (meridian === 'PM' && hours < 12) {
    hours += 12
  } else if (meridian === 'AM' && hours === 12) {
    hours = 0
  }
  const date = new Date(year, month - 1, day, hours, minutes, 0)
  return date
}
export const timeSince = (date: any) => {
  const now: any = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const datePassed = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes()
  )
  const seconds = Math.floor((now - date) / 1000)

  if (datePassed.getTime() === today.getTime()) {
    return 'Today'
  }
  let interval = seconds / 31536000

  if (interval > 1) {
    return (
      Math.floor(interval) +
      ' year' +
      (Math.floor(interval) > 1 ? 's' : '') +
      ' ago'
    )
  }
  interval = seconds / 2592000
  if (interval > 1) {
    return (
      Math.floor(interval) +
      ' month' +
      (Math.floor(interval) > 1 ? 's' : '') +
      ' ago'
    )
  }
  interval = seconds / 604800
  if (interval > 1) {
    return (
      Math.floor(interval) +
      ' week' +
      (Math.floor(interval) > 1 ? 's' : '') +
      ' ago'
    )
  }
  interval = seconds / 86400
  if (interval > 1) {
    return (
      Math.floor(interval) +
      ' day' +
      (Math.floor(interval) > 1 ? 's' : '') +
      ' ago'
    )
  }
  interval = seconds / 3600
  if (interval > 1) {
    return (
      Math.floor(interval) +
      ' hour' +
      (Math.floor(interval) > 1 ? 's' : '') +
      ' ago'
    )
  }
  interval = seconds / 60
  if (interval > 1) {
    return (
      Math.floor(interval) +
      ' minute' +
      (Math.floor(interval) > 1 ? 's' : '') +
      ' ago'
    )
  }
  return 'Today'
}
export const convertUTCtoBrowserTimeZone = (dateString?: any) => {
  // Manually parse the date string
  if (dateString) {
    const parts = dateString?.match(
      /(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}) (AM|PM)/
    )
    if (!parts) return 'Invalid date' // Added basic validation

    const months = parseInt(parts[1], 10) - 1 // JS months are 0-indexed
    const days = parseInt(parts[2], 10)
    const years = parseInt(parts[3], 10)
    const hours =
      parseInt(parts[4], 10) +
      (parts[6] === 'PM' && parts[4] !== '12' ? 12 : 0) -
      (parts[6] === 'AM' && parts[4] === '12' ? 12 : 0)
    const minutes = parseInt(parts[5], 10)

    const dateUTC = new Date(Date.UTC(years, months, days, hours, minutes))

    const options = {
      hour12: true,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }
    let timeInBrowserTimeZone = dateUTC.toLocaleString('en-US', options as any)
    timeInBrowserTimeZone = timeInBrowserTimeZone.replace(/, /g, ' ')

    return dateTimeWithFormat('MM/DD/YYYY hh:mm:ss A', timeInBrowserTimeZone)
  }
  return '--'
}

export const calculateDaysAgo = (inputDate: string | Date): string => {
  const now = new Date() // Current date and time
  const date = new Date(inputDate) // Convert inputDate to a Date object

  // Set both dates to the start of the day for a fair comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const comparisonDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  )

  // Calculate the difference in milliseconds and then convert to days
  const difference = today.getTime() - comparisonDate.getTime()
  const daysAgo = Math.floor(difference / (1000 * 60 * 60 * 24))

  if (daysAgo === 0) {
    return 'Today'
  } else if (daysAgo === 1) {
    return 'Yesterday'
  } else {
    return `${daysAgo} days ago`
  }
}
export const humanizeDatetime = (dateTime: string | Date) => {
  if (!dateTime) {
    return 'Never Logged In'
  }
  const date = new Date(dateTime)
  return calculateDaysAgo(date)
}
