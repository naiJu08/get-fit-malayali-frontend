const LOGIN_URL = 'auth/login'

const NOTIFICATION_LIST = 'notifications/web'
const NOTIFICATION_CLEAR = 'notifications/web/clear_all'
const ASSESSOR_LIST_URL = 'assessors'
const ADMIN_USER = '/users'
const PLANS = 'plans'
const GROUP_LIST = 'groups'
const ORGANISATION_LIST_URL = 'organisations'
const ORGANISATION_URL = 'organisation'
const MY_PROFILE = 'profile'
const MY_PROFILE_IMAGE = 'profile-image'

const COUNTRIES = 'countries'
const ORGANISATION_DATATABLES = 'datatable'

const ACCREDITATION_LIST_URL = 'accreditations'
const RENEW_APPLICATION = 'renew-accreditations'

const apiUrl: { [key: string]: string } = {
  LOGIN_URL,
  NOTIFICATION_LIST,
  NOTIFICATION_CLEAR,
  ASSESSOR_LIST_URL,
  ADMIN_USER,
  PLANS,
  GROUP_LIST,
  ORGANISATION_LIST_URL,
  MY_PROFILE,
  MY_PROFILE_IMAGE,
  COUNTRIES,
  ORGANISATION_URL,
  ORGANISATION_DATATABLES,
  ACCREDITATION_LIST_URL,
  RENEW_APPLICATION,
}

export default apiUrl
