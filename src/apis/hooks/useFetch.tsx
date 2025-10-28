import { useEffect, useState } from 'react'
import { parseQueryParams } from '../../utilities/parsers'
import { getData } from '../api.helpers'
const useFetch = (initialUrl: any, initialParams = {}, skip = false) => {
  const [url, updateUrl] = useState(initialUrl)
  const [params, updateParams] = useState<any>(initialParams)
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [refetchIndex, setRefetchIndex] = useState(0)
  const queryString = parseQueryParams(params)
  const refetch = () =>
    setRefetchIndex((prevRefetchIndex) => prevRefetchIndex + 1)
  useEffect(() => {
    const fetchData = async () => {
      if (skip) return
      setIsLoading(true)
      try {
        const response = await getData(`${url}${queryString}`)
        const result = await response
        setData(result)
      } catch (err: any) {
        setHasError(true)
        setErrorMessage(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [url, params, refetchIndex, queryString, skip])

  return {
    data,
    isLoading,
    hasError,
    errorMessage,
    updateUrl,
    updateParams,
    refetch,
  }
}
export default useFetch
