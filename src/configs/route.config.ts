// import { domainTypes } from './scopes.config'
import { domainTypes } from '../store/domainManageStore'

export const handleViewPermission = (key: string) => {
  return [`view_${key}`, `view_all_${key}`, `view_team_${key}`]
}

export interface RouterMenuProps {
  id: number
  path?: string
  parent_id: null | number
  icon?: string
  label: string
  key: string
  slug?: string
  permission_slugs: string | string[]
  slugOptions?: string[]
  breadcrumb?: string[]
  isDetails?: boolean
  isExpanded?: boolean
  isSidebarMenu?: boolean
  hasChild?: boolean
  hasDivider?: boolean
  pathOverride?: string
  publicPermission?: boolean
}

// dashboard

const LOGIN: RouterMenuProps = {
  id: 0,
  path: '/login',
  parent_id: null,
  permission_slugs: [],
  label: 'Login',
  key: 'login',
}

const FORGET_PASSWORD: RouterMenuProps = {
  id: 0,
  path: '/forget-password',
  parent_id: null,
  permission_slugs: [],
  label: 'Forget Password',
  key: 'forget_password',
}
const RESET_PASSWORD: RouterMenuProps = {
  id: 0,
  path: '/reset-password/:token',
  parent_id: null,
  permission_slugs: [],
  label: 'Reset Password',
  key: 'reset_password',
}
const CHANGE_PASSWORD: RouterMenuProps = {
  id: 0,
  path: '/change-password',
  parent_id: null,
  permission_slugs: [],
  label: 'Change Password',
  key: 'change_password',
}
// dashboard

const DASHBOARD: RouterMenuProps = {
  id: 1,
  path: '/dashboard',
  parent_id: null,
  icon: 'dashboard-icon',
  label: 'Dashboard',
  key: 'dashboard',
  permission_slugs: ['superadmin', 'nutritionist'],
  // permission_slugs: [
  //   domainTypes['EMPLOYEE'],
  //   domainTypes['ORGANISATION'],
  //   domainTypes['ASSESSOR'],
  // ],
  // breadcrumb: ["DASHBOARD"],
  // isSidebarMenu: true,
}

const USER_PROFILE: RouterMenuProps = {
  id: 8118,
  path: '/profile',
  parent_id: null,
  icon: 'cart-icon',
  label: 'reciept',
  key: 'user-profile',
  permission_slugs: [domainTypes['EMPLOYEE']],
}

//Contacts

const ADMIN_USER: RouterMenuProps = {
  id: 2,
  path: '/users',
  icon: 'customer-icon',
  parent_id: null,
  label: 'Users',
  key: 'admin-user',
  permission_slugs: ['superadmin', 'nutritionist'],
  breadcrumb: ['ADMIN_USER', 'ADMIN_USER_DETAILS'],
  isSidebarMenu: true,
}
const PLANS: RouterMenuProps = {
  id: 21,
  path: '/plans',
  parent_id: null,
  label: 'Plans',
  key: 'plans',
  icon: 'plan',
  breadcrumb: ['PLANS', 'PLAN_DETAILS'],
  permission_slugs: ['superadmin', 'nutritionist'],
  slugOptions: ['PLANS', 'PLAN_DETAILS', 'DIET_DETAILS'],
  isSidebarMenu: true,
}
const CATEGORIES: RouterMenuProps = {
  id: 20,
  path: '/categories',
  parent_id: null,
  label: 'Categories',
  key: 'categories',
  icon: 'category-icon',
  breadcrumb: ['CATEGORIES'],
  permission_slugs: ['superadmin', 'nutritionist'],
  slugOptions: ['CATEGORIES'],
  isSidebarMenu: true,
}
const CATEGORIES_DETAILS: RouterMenuProps = {
  id: 15,
  path: '/categories/:id',
  parent_id: 20,
  isDetails: true,
  icon: 'user',
  label: 'Category Details',
  key: 'category-details',
  permission_slugs: [],
  // breadcrumb: ['ORGANISATION', 'ORGANISATION_DETAILS'],
}
const WORKOUT: RouterMenuProps = {
  id: 25,
  path: '/workout',
  parent_id: null,
  label: 'Workout',
  key: 'workout',
  icon: 'workout',
  permission_slugs: ['superadmin', 'nutritionist'],
  isSidebarMenu: true,
}
const YOGA: RouterMenuProps = {
  id: 46,
  path: '/yoga',
  parent_id: null,
  label: 'Yoga',
  key: 'yoga',
  icon: 'yoga-icon',
  permission_slugs: ['superadmin', 'nutritionist'],
  isSidebarMenu: true,
}
const MEDITATION: RouterMenuProps = {
  id: 47,
  path: '/meditation',
  parent_id: null,
  label: 'Meditation',
  key: 'meditation',
  icon: 'meditation-icon',
  permission_slugs: ['superadmin', 'nutritionist'],
  isSidebarMenu: true,
}

const SUBSCRIPTIONS: RouterMenuProps = {
  id: 29,
  path: '/subscriptions',
  parent_id: null,
  label: 'Subscriptions',
  key: 'subscriptions',
  icon: 'subscription',
  permission_slugs: ['superadmin', 'nutritionist'],
  isSidebarMenu: true,
}
const NOTIFICATIONS: RouterMenuProps = {
  id: 30,
  path: '/notifications',
  parent_id: null,
  label: 'Broadcast',
  key: 'notifications',
  icon: 'notification',
  permission_slugs: ['superadmin'],
  isSidebarMenu: true,
}

const WORKOUT_DETAILS: RouterMenuProps = {
  id: 28,
  path: '/workout/:id',
  parent_id: 25,
  isDetails: true,
  icon: 'user',
  label: 'Workout Details',
  key: 'workout-details',
  permission_slugs: [],
  // breadcrumb: ['ORGANISATION', 'ORGANISATION_DETAILS'],
}
const YOGA_DETAILS: RouterMenuProps = {
  id: 30,
  path: '/yoga/:id',
  parent_id: 46,
  isDetails: true,
  icon: 'user',
  label: 'Yoga Details',
  key: 'yoga-details',
  permission_slugs: [],
  // breadcrumb: ['ORGANISATION', 'ORGANISATION_DETAILS'],
}
const MEDITATION_DETAILS: RouterMenuProps = {
  id: 31,
  path: '/meditation/:id',
  parent_id: 46,
  isDetails: true,
  icon: 'user',
  label: 'Meditation Details',
  key: 'meditation-details',
  permission_slugs: [],
  // breadcrumb: ['ORGANISATION', 'ORGANISATION_DETAILS'],
}
const SUBSCRIPTIONS_DETAILS: RouterMenuProps = {
  id: 291,
  path: '/subscriptions/:id',
  parent_id: 29,
  isDetails: true,
  icon: 'user',
  label: 'Subscription Details',
  key: 'subscriptions-details',
  permission_slugs: [],
}

// Plan Details base route
const PLAN_DETAILS: RouterMenuProps = {
  id: 22,
  path: '/plans/:id',
  parent_id: 21,
  isDetails: true,
  icon: 'user',
  label: 'Plan Details',
  key: 'Plan-details',
  permission_slugs: [],
}

// Explicit alias (kept for consistency with existing slugs usage)
const PLAN_DETAILS_DETAILS: RouterMenuProps = {
  id: 221,
  path: '/plans/:id/details',
  parent_id: 21,
  isDetails: true,
  icon: 'user',
  label: 'Plan Details',
  key: 'plan-details-details',
  permission_slugs: [],
}

const PLAN_DETAILS_WORKOUT: RouterMenuProps = {
  id: 222,
  path: '/plans/:id/workout-plan',
  parent_id: 21,
  isDetails: true,
  icon: 'user',
  label: 'Plan Details - Workout',
  key: 'plan-details-workout',
  permission_slugs: [],
}

const PLAN_DETAILS_DIET: RouterMenuProps = {
  id: 223,
  path: '/plans/:id/dietplan',
  parent_id: 21,
  isDetails: true,
  icon: 'user',
  label: 'Plan Details - Diet',
  key: 'plan-details-diet',
  permission_slugs: [],
}
const RECIPE: RouterMenuProps = {
  id: 24,
  path: '/recipe',
  parent_id: 21,
  label: 'Recipe',
  key: 'recipe',
  icon: 'recipe',
  permission_slugs: ['superadmin'],
  isSidebarMenu: true,
}

const RECIPE_DETAILS: RouterMenuProps = {
  id: 29,
  path: '/recipe/:id',
  parent_id: 21,
  label: 'Recipe Details',
  key: 'recipe',
  permission_slugs: [],
  isSidebarMenu: true,
}
const MEALS: RouterMenuProps = {
  id: 48,
  path: '/meals',
  parent_id: null,
  label: 'Meals',
  key: 'meals',
  icon: 'meal-icon',
  permission_slugs: ['superadmin', 'nutritionist'],
  isSidebarMenu: true,
}
const MEALS_DETAILS: RouterMenuProps = {
  id: 30,
  path: '/meals/:id',
  parent_id: 21,
  label: 'Meals Details',
  key: 'meals-details',
  permission_slugs: [],
  isSidebarMenu: true,
}

const WORKOUT_PLAN_DETAILS: RouterMenuProps = {
  id: 26,
  path: '/plans/:plan_id/workout_details/:id',
  parent_id: 21,
  isDetails: true,
  icon: 'user',
  label: 'Workout plan Details',
  key: 'workout-details',
  permission_slugs: [],
  breadcrumb: ['PLANS', 'PLAN_DETAILS'],
  // breadcrumb: ['ORGANISATION', 'ORGANISATION_DETAILS'],
}
const YOGAPLAN_DETAILS: RouterMenuProps = {
  id: 26,
  path: '/plans/:plan_id/yoga_details/:id',
  parent_id: 21,
  isDetails: true,
  icon: 'user',
  label: 'Yogaplan Details',
  key: 'yogaplan-details',
  permission_slugs: [],
  breadcrumb: ['PLANS', 'PLAN_DETAILS'],
  // breadcrumb: ['ORGANISATION', 'ORGANISATION_DETAILS'],
}

const DIET_DETAILS: RouterMenuProps = {
  id: 27,
  path: '/diet_details/:id',
  parent_id: 21,
  isDetails: true,
  icon: 'user',
  label: 'Diet Details',
  key: 'diet-details',
  permission_slugs: [],
  breadcrumb: ['PLANS', 'PLAN_DETAILS'],
}
const YOGAPLAN: RouterMenuProps = {
  id: 224,
  path: '/plans/:id/yogaplan',
  parent_id: 21,
  isDetails: true,
  icon: 'user',
  label: 'Yogaplan',
  key: 'yogaplan',
  permission_slugs: [],
}
const MEDITATIONPLAN: RouterMenuProps = {
  id: 225,
  path: '/plans/:id/meditationplan',
  parent_id: 21,
  isDetails: true,
  icon: 'user',
  label: 'Meditationplan',
  key: 'meditationplan',
  permission_slugs: [],
}

const ORGANISATION_FILE_REPOSTITORY: RouterMenuProps = {
  id: 41,
  path: '/file-repository',
  parent_id: null,
  label: 'File Repository',
  key: 'org-file-repo',
  permission_slugs: [],
  isSidebarMenu: true,
}
const ORGANISATION_USERLIST: RouterMenuProps = {
  id: 41,
  path: '/orgaization-users',
  parent_id: null,
  label: 'Organization Users',
  key: 'org-users',
  permission_slugs: [],
  isSidebarMenu: true,
}
const PAYMENT_HISTORY: RouterMenuProps = {
  id: 45,
  path: '/payment-history',
  parent_id: null,
  label: 'Payment History',
  icon: 'paymentapproval-icon',
  key: 'payment-history',
  permission_slugs: ['superadmin'],
  isSidebarMenu: true,
}

export const router_config: { [key: string]: RouterMenuProps } = {
  DASHBOARD,
  ADMIN_USER,
  PLANS,
  CATEGORIES,
  CATEGORIES_DETAILS,
  WORKOUT,
  YOGA,
  MEDITATION,
  MEALS,
  SUBSCRIPTIONS,
  NOTIFICATIONS,
  RECIPE,
  PAYMENT_HISTORY,

  // Remaining routes (details and others)
  PLAN_DETAILS,
  PLAN_DETAILS_DETAILS,
  PLAN_DETAILS_WORKOUT,
  PLAN_DETAILS_DIET,
  YOGAPLAN,
  YOGAPLAN_DETAILS,
  WORKOUT_PLAN_DETAILS,
  SUBSCRIPTIONS_DETAILS,
  DIET_DETAILS,
  RECIPE_DETAILS,
  MEALS_DETAILS,
  LOGIN,
  FORGET_PASSWORD,
  RESET_PASSWORD,
  CHANGE_PASSWORD,
  USER_PROFILE,
  // TABULARFORM,
  ORGANISATION_FILE_REPOSTITORY,
  ORGANISATION_USERLIST,
  WORKOUT_DETAILS,
  YOGA_DETAILS,
  MEDITATION_DETAILS,
  MEDITATIONPLAN,
}
