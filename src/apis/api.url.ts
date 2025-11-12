const LOGIN_URL = 'auth/login'
const ASSESSOR_LIST_URL = 'assessors'
const ADMIN_USER = '/users'
const NOTIFICATIONS = '/notifications'
const NOTIFICATIONS_SENT = '/notifications?scope=sent&aggregate=true'
const NUTRITIONIST_USER = '/users/my_clients'
const PLANS = 'plans'
const RECIPES = 'recipes'
const WORKOUT_PLAN = 'workout_plans'
const DIET_PLAN = 'diet_plans'
const GROUP_LIST = 'groups'
const ORGANISATION_LIST_URL = 'organisations'
const ORGANISATION_URL = 'organisation'
const MY_PROFILE = 'profile'
const MY_PROFILE_IMAGE = 'profile-image'
const SUBSCRIPTIONS = 'subscriptions'
const COUNTRIES = 'countries'
const ORGANISATION_DATATABLES = 'datatable'

const ACCREDITATION_LIST_URL = 'accreditations'
const RENEW_APPLICATION = 'renew-accreditations'
const WORKOUTS = 'workouts'
const ASSIGNED_CLIENTS = 'assigned_clients'
const BODY_MEASUREMENTS = 'body_measurements'
const BODY_COMPOSITION = 'body_compositions'
const VITALS = 'vitals'
const CLIENT_REPORTS = 'monthly_reports'
const SUBSCRIPTION_CALENDAR = '/admin/users'

const apiUrl: { [key: string]: string } = {
  LOGIN_URL,
  ASSESSOR_LIST_URL,
  ADMIN_USER,
  NUTRITIONIST_USER,
  SUBSCRIPTIONS,
  NOTIFICATIONS,
  NOTIFICATIONS_SENT,
  PLANS,
  RECIPES,
  WORKOUT_PLAN,
  DIET_PLAN,
  GROUP_LIST,
  ORGANISATION_LIST_URL,
  MY_PROFILE,
  MY_PROFILE_IMAGE,
  COUNTRIES,
  ORGANISATION_URL,
  ORGANISATION_DATATABLES,
  ACCREDITATION_LIST_URL,
  RENEW_APPLICATION,
  WORKOUTS,
  ASSIGNED_CLIENTS,
  BODY_MEASUREMENTS,
  BODY_COMPOSITION,
  VITALS,
  CLIENT_REPORTS,
  SUBSCRIPTION_CALENDAR,
}

export default apiUrl
