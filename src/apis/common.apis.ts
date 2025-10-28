// import { getData, updateFromData } from '../utilities/parsers'
import { getData, updateFromData } from './api.helpers'
import apiUrl from './api.url'

// const buildUrlWithParams = (baseUrl: string, params: any) => {
//   return `${baseUrl}${parseQueryParams(params)}`
// }
export const getImpersonate = (id: string) => {
  return getData(`${apiUrl.EMPLOYEE_LIST_URL}permissions/${id}/`)
}

export const getCountries = () => getData(apiUrl.COUNTRIES)

export const updateAdminPassword = (employee: string, data: string) => {
  return updateFromData(
    `${apiUrl.ADMIN_USER}/${employee}/change_password`,
    data
  )
}

export const updateAssessorPassword = (id: string, data: string) => {
  return updateFromData(
    `${apiUrl.ASSESSOR_LIST_URL}/${id}/change_password`,
    data
  )
}
