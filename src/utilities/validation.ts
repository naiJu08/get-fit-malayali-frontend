export const validation = (
  required?: { key: string; title: string }[],
  data?: any
) => {
  const errors: any = {}
  required?.forEach((req) => {
    if (!data[req.key]) {
      errors[req.key] = `${req.title} is required`
    }
  })
  return errors
}

export const handleReturnEmptyMsg = (query: string) => {
  if (query && query !== '') {
    return 'Please adjust your search criteria and try again'
  } else {
    return 'Get started by adding new ones'
  }
}
