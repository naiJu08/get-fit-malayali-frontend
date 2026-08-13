const LOGIN_URL = 'auth/login'
const ASSESSOR_LIST_URL = 'assessors'
const ADMIN_USER = '/users'
const NOTIFICATIONS = '/notifications'
const NOTIFICATION_DETAIL = '/notifications'
const NOTIFICATIONS_SENT = '/notifications?scope=sent&aggregate=true'
const USER_BATCHES = '/user_batches'
const NUTRITIONIST_USER = '/users/my_clients'
const PLANS = 'plans'
const RECIPES = 'recipes'
const MEALS = 'meals'
const WORKOUT_PLAN = 'workout_plans'
const WORKOUT_TEMPLATES = 'workout_templates'
const WORKOUT_TEMPLATE_DAYS = 'workout_template_days'
const YOGA_TEMPLATES = 'yoga_templates'
const YOGA_TEMPLATE_DAYS = 'yoga_template_days'
const DIET_PLAN = 'diet_plans'
const YOGA_PLAN = 'yoga_plans'
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
const USER_REMINDERS = '/user_reminders'
const SUBSCRIPTION_HISTORY = '/subscriptions/user_history'
const USER_MEAL_TIMINGS = '/user_meal_timings'
const MEAL_TIMINGS = '/meal_timings'

const ADMIN_DASHBOARD = 'admin/dashboard'
const YOGA = '/yogas'
const MEDITATION = '/meditations'
const MEAL_CATEGORIES = 'meal_categories'
const SERVING_UNITS = 'references/serving_units'
const CATEGORIES = '/categories'
const DIET_TEMPLATE = 'diet_plan_templates'
const INACTIVE_USERS = '/admin/inactive_users'
const MEALS_STATUS_CHANGE = '/meals/bulk_status_change'
const AUTH_ME = '/auth/me'
const USERS_DELETE = '/users/delete'
const DUPLICATE_DIET_TEMPLATE = '/diet_plan_templates/duplicate'
const TEMPLATE_CATEGORIES = '/diet_template_categories'
const NUTRITIONIST_DASHBOARD = '/nutritionist/dashboard'
const ASSESSSMENT_CATEGORY = '/admin/assessment_categories'
const apiUrl: { [key: string]: string } = {
  LOGIN_URL,
  ASSESSOR_LIST_URL,
  ADMIN_USER,
  NUTRITIONIST_USER,
  SUBSCRIPTIONS,
  NOTIFICATIONS,
  NOTIFICATION_DETAIL,
  NOTIFICATIONS_SENT,
  USER_BATCHES,
  PLANS,
  RECIPES,
  MEALS,
  WORKOUT_PLAN,
  WORKOUT_TEMPLATES,
  WORKOUT_TEMPLATE_DAYS,
  YOGA_TEMPLATES,
  YOGA_TEMPLATE_DAYS,
  DIET_PLAN,
  YOGA_PLAN,
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
  USER_REMINDERS,
  SUBSCRIPTION_HISTORY,
  USER_MEAL_TIMINGS,
  MEAL_TIMINGS,
  ADMIN_DASHBOARD,
  YOGA,
  MEDITATION,
  MEAL_CATEGORIES,
  SERVING_UNITS,
  CATEGORIES,
  DIET_TEMPLATE,
  INACTIVE_USERS,
  MEALS_STATUS_CHANGE,
  AUTH_ME,
  USERS_DELETE,
  DUPLICATE_DIET_TEMPLATE,
  TEMPLATE_CATEGORIES,
  NUTRITIONIST_DASHBOARD,
  ASSESSSMENT_CATEGORY,
}

export default apiUrl
