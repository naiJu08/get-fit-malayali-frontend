const noLeadingSpaces = (value: string | null) => {
  if (value === null) return true // allow null values
  return value === value.trimStart()
}
export default noLeadingSpaces
