// import { domainTypes } from './scopes.config'
import { domainTypes } from '../store/domainManageStore'

export const handleViewPermission = (key: string) => {
  return [`view_${key}`, `view_all_${key}`, `view_team_${key}`]
}

export type RouteModule =
  | 'users'
  | 'workout'
  | 'yoga'
  | 'meditation'
  | 'diet'
  | 'finance'
  | 'sales'
  | 'core'

// Central module access map. Keep page permissions here so role changes stay consistent.
export const MODULE_ACCESS: Record<RouteModule, string[]> = {
  users: ['superadmin', 'nutritionist', 'physiotherapist', 'yogist'],
  workout: ['superadmin', 'nutritionist', 'physiotherapist'],
  yoga: ['superadmin', 'nutritionist', 'yogist'],
  meditation: ['superadmin', 'nutritionist'],
  diet: ['superadmin', 'nutritionist'],
  finance: ['superadmin'],
  sales: ['sales'],
  core: [
    'superadmin',
    'admin',
    'nutritionist',
    'user',
    'physiotherapist',
    'yogist',
    'sales',
    'marketing',
  ],
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
  module?: RouteModule
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
  module: 'core',
  permission_slugs: MODULE_ACCESS.core,
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

// Master Options for Sub-menus

const FITNESS: RouterMenuProps = {
  id: 200,
  parent_id: null,
  label: 'Workout Module',
  key: 'workout-module',
  icon: 'workout',
  module: 'workout',
  permission_slugs: MODULE_ACCESS.workout,
  isSidebarMenu: true,
}

const YOGA_MODULE: RouterMenuProps = {
  id: 201,
  parent_id: null,
  label: 'Yoga Module',
  key: 'yoga-module',
  icon: 'yoga-icon',
  module: 'yoga',
  permission_slugs: MODULE_ACCESS.yoga,
  isSidebarMenu: true,
}

const DIET_NUTRITION: RouterMenuProps = {
  id: 300,
  parent_id: null,
  label: 'Diet & Nutrition',
  key: 'diet-nutrition',
  icon: 'meal-icon',
  permission_slugs: ['superadmin', 'nutritionist'],
  isSidebarMenu: true,
}

const FINANCE: RouterMenuProps = {
  id: 400,
  parent_id: null,
  label: 'Finance',
  key: 'finance',
  icon: 'paymentapproval-icon',
  permission_slugs: ['superadmin', 'sales'],
  isSidebarMenu: true,
}

//Contacts

const ADMIN_USER: RouterMenuProps = {
  id: 2,
  path: '/users',
  icon: 'customer-icon',
  parent_id: null,
  label: 'Users',
  key: 'admin-user',
  module: 'users',
  permission_slugs: MODULE_ACCESS.users,
  breadcrumb: ['ADMIN_USER', 'ADMIN_USER_DETAILS'],
  isSidebarMenu: true,
}
const USER_ROLE_MENUS: RouterMenuProps[] = [
  {
    id: 3,
    path: '/users',
    parent_id: 2,
    label: 'Clients',
    key: 'client-users',
    permission_slugs: MODULE_ACCESS.users,
    isSidebarMenu: true,
  },
  {
    id: 4,
    path: '/users/nutritionist',
    parent_id: 2,
    label: 'Nutritionists',
    key: 'nutritionist-users',
    permission_slugs: ['superadmin'],
    isSidebarMenu: true,
  },
  {
    id: 5,
    path: '/users/physiotherapist',
    parent_id: 2,
    label: 'Physiotherapists',
    key: 'physiotherapist-users',
    permission_slugs: ['superadmin'],
    isSidebarMenu: true,
  },
  {
    id: 6,
    path: '/users/yogist',
    parent_id: 2,
    label: 'Yogists',
    key: 'yogist-users',
    permission_slugs: ['superadmin'],
    isSidebarMenu: true,
  },
  {
    id: 7,
    path: '/users/sales',
    parent_id: 2,
    label: 'Sales',
    key: 'sales-users',
    permission_slugs: ['superadmin'],
    isSidebarMenu: true,
  },
  {
    id: 8,
    path: '/users/marketing',
    parent_id: 2,
    label: 'Marketing',
    key: 'marketing-users',
    permission_slugs: ['superadmin'],
    isSidebarMenu: true,
  },
]

const PLANS: RouterMenuProps = {
  id: 21,
  path: '/plans',
  parent_id: null,
  label: 'Package Plans',
  key: 'plans',
  icon: 'plan',
  breadcrumb: ['PLANS', 'PLAN_DETAILS'],
  permission_slugs: ['superadmin', 'nutritionist', 'sales'],
  slugOptions: ['PLANS', 'PLAN_DETAILS', 'DIET_DETAILS'],
  isSidebarMenu: true,
}
const CATEGORIES: RouterMenuProps = {
  id: 20,
  path: '/categories',
  parent_id: 200,
  label: 'Exercise categories',
  key: 'categories',
  icon: 'category-icon',
  breadcrumb: ['CATEGORIES'],
  module: 'workout',
  permission_slugs: MODULE_ACCESS.workout,
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
const WORKOUT_TEMPLATE: RouterMenuProps = {
  id: 221,
  path: '/workout-templates',
  parent_id: 200,
  label: 'Workout Templates',
  key: 'workout-templates',
  icon: 'workout',
  breadcrumb: ['WORKOUT_TEMPLATE'],
  module: 'workout',
  permission_slugs: MODULE_ACCESS.workout,
  slugOptions: [
    'WORKOUT_TEMPLATE',
    'WORKOUT_TEMPLATE_DETAILS',
    'WORKOUT_TEMPLATE_DAY',
  ],
  isSidebarMenu: true,
}
const WORKOUT_TEMPLATE_DETAILS: RouterMenuProps = {
  id: 222,
  path: '/workout-templates/:id',
  parent_id: 221,
  isDetails: true,
  label: 'Workout Template Details',
  key: 'workout-template-details',
  permission_slugs: [],
}
const WORKOUT_TEMPLATE_DAY: RouterMenuProps = {
  id: 223,
  path: '/workout-templates/:templateId/day/:dayId',
  parent_id: 221,
  isDetails: true,
  label: 'Workout Template Day',
  key: 'workout-template-day',
  permission_slugs: [],
}
const YOGA_TEMPLATE: RouterMenuProps = {
  id: 224,
  path: '/yoga-templates',
  parent_id: 201,
  label: 'Yoga Templates',
  key: 'yoga-templates',
  icon: 'yoga',
  breadcrumb: ['YOGA_TEMPLATE'],
  module: 'yoga',
  permission_slugs: MODULE_ACCESS.yoga,
  slugOptions: ['YOGA_TEMPLATE', 'YOGA_TEMPLATE_DETAILS', 'YOGA_TEMPLATE_DAY'],
  isSidebarMenu: true,
}
const YOGA_TEMPLATE_DETAILS: RouterMenuProps = {
  id: 225,
  path: '/yoga-templates/:id',
  parent_id: 224,
  isDetails: true,
  label: 'Yoga Template Details',
  key: 'yoga-template-details',
  permission_slugs: [],
}
const YOGA_TEMPLATE_DAY: RouterMenuProps = {
  id: 226,
  path: '/yoga-templates/:templateId/day/:dayId',
  parent_id: 224,
  isDetails: true,
  label: 'Yoga Template Day',
  key: 'yoga-template-day',
  permission_slugs: [],
}
const DIET_TEMPLATE: RouterMenuProps = {
  id: 220,
  path: '/diet-template',
  parent_id: 300,
  label: 'Diet Template',
  key: 'diet-template',
  icon: 'template-icon-white',
  breadcrumb: ['DIET_TEMPLATE'],
  permission_slugs: ['superadmin', 'nutritionist'],
  slugOptions: [
    'DIET_TEMPLATE',
    'DIET_TEMPLATE_DETAILS',
    'DIET_TEMPLATE_DIET_PLAN',
  ],
  isSidebarMenu: true,
}
const DIET_TEMPLATE_DETAILS: RouterMenuProps = {
  id: 16,
  path: '/diet-template/:id',
  parent_id: 220,
  isDetails: true,
  icon: 'user',
  label: 'Diet Template Details',
  key: 'diet-template-details',
  permission_slugs: [],
}
const DIET_TEMPLATE_DIET_PLAN: RouterMenuProps = {
  id: 17,
  path: '/diet-template/:id/diet-plan',
  parent_id: 220,
  isDetails: true,
  icon: 'user',
  label: 'Diet Template Diet Plan',
  key: 'diet-template-diet-plan',
  permission_slugs: [],
}
const DIET_TEMPLATE_CATEGORIES: RouterMenuProps = {
  id: 49,
  path: '/diet-plan-categories',
  parent_id: 300,
  label: 'Diet Plan Categories',
  key: 'diet-plan-categories',
  icon: 'category-icon',
  breadcrumb: ['DIET_TEMPLATE_CATEGORIES'],
  permission_slugs: ['superadmin', 'nutritionist'],
  slugOptions: ['DIET_TEMPLATE_CATEGORIES'],
  isSidebarMenu: true,
}
const WORKOUT: RouterMenuProps = {
  id: 25,
  path: '/workout',
  parent_id: 200,
  label: 'Exercises',
  key: 'workout',
  icon: 'workout',
  module: 'workout',
  permission_slugs: MODULE_ACCESS.workout,
  isSidebarMenu: true,
}
const YOGA: RouterMenuProps = {
  id: 46,
  path: '/yoga',
  parent_id: 201,
  label: 'Yoga',
  key: 'yoga',
  icon: 'yoga-icon',
  module: 'yoga',
  permission_slugs: MODULE_ACCESS.yoga,
  isSidebarMenu: true,
}
const MEDITATION: RouterMenuProps = {
  id: 47,
  path: '/meditation',
  parent_id: null,
  label: 'Meditation',
  key: 'meditation',
  icon: 'meditation-icon',
  module: 'meditation',
  permission_slugs: MODULE_ACCESS.meditation,
  isSidebarMenu: true,
}

const SUBSCRIPTIONS: RouterMenuProps = {
  id: 29,
  path: '/subscriptions',
  parent_id: 400,
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
const MEAL_TIMING: RouterMenuProps = {
  id: 32,
  path: '/mealtiming',
  parent_id: 300,
  label: 'Meal Timing',
  key: 'mealtiming',
  icon: 'notification',
  permission_slugs: ['superadmin'],
  isSidebarMenu: true,
}

const MEAL_TIMING_DETAILS: RouterMenuProps = {
  id: 33,
  path: '/mealtiming/:id',
  parent_id: 32,
  isDetails: true,
  icon: 'user',
  label: 'Meal Timing Details',
  key: 'mealtiming-details',
  permission_slugs: [],
}

const ASSESSMENT_CATEGORY: RouterMenuProps = {
  id: 34,
  path: '/assessment-category',
  parent_id: null,
  label: 'Assessment Category',
  key: 'assessment-category',
  icon: 'category-icon',
  breadcrumb: ['ASSESSMENT_CATEGORY'],
  permission_slugs: ['superadmin'],
  slugOptions: ['ASSESSMENT_CATEGORY'],
  isSidebarMenu: true,
}

const ASSESSMENT_CATEGORY_DETAILS: RouterMenuProps = {
  id: 35,
  path: '/assessment-category/:id',
  parent_id: 34,
  isDetails: true,
  icon: 'user',
  label: 'Assessment Category Details',
  key: 'assessment-category-details',
  permission_slugs: [],
}

const WORKOUT_DETAILS: RouterMenuProps = {
  id: 28,
  path: '/workout/:id',
  parent_id: 25,
  isDetails: true,
  icon: 'user',
  label: 'Exercise Details',
  key: 'workout-details',
  permission_slugs: [],
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
}
const MEDITATION_DETAILS: RouterMenuProps = {
  id: 31,
  path: '/meditation/:id',
  parent_id: 47,
  isDetails: true,
  icon: 'user',
  label: 'Meditation Details',
  key: 'meditation-details',
  permission_slugs: [],
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
const REMINDER_SETTINGS: RouterMenuProps = {
  id: 292,
  path: '/users/:id/reminders',
  parent_id: 2,
  isDetails: true,
  icon: 'user',
  label: 'Reminder Settings',
  key: 'reminders-details',
  permission_slugs: [],
}

const USER_ADDITIONAL_INFO: RouterMenuProps = {
  id: 293,
  path: '/users/:id/additional-info',
  parent_id: 2,
  isDetails: true,
  icon: 'user',
  label: 'User Additional Info',
  key: 'user-additional-info',
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
  parent_id: 300,
  label: 'Recipe',
  key: 'recipe',
  icon: 'recipe',
  permission_slugs: ['superadmin'],
  isSidebarMenu: true,
}

const RECIPE_DETAILS: RouterMenuProps = {
  id: 29,
  path: '/recipe/:id',
  parent_id: 24,
  label: 'Recipe Details',
  key: 'recipe',
  permission_slugs: [],
  isSidebarMenu: true,
}
const MEALS: RouterMenuProps = {
  id: 48,
  path: '/meals',
  parent_id: 300,
  label: 'Food',
  key: 'meals',
  icon: 'meal-icon',
  permission_slugs: ['superadmin', 'nutritionist'],
  isSidebarMenu: true,
}
const MEALS_DETAILS: RouterMenuProps = {
  id: 30,
  path: '/meals/:id',
  parent_id: 48,
  label: 'Food Details',
  key: 'meals-details',
  permission_slugs: [],
  isSidebarMenu: true,
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
  parent_id: 400,
  label: 'Payment History',
  icon: 'paymentapproval-icon',
  key: 'payment-history',
  permission_slugs: ['superadmin', 'sales'],
  isSidebarMenu: true,
}

const MARKETING: RouterMenuProps = {
  path: '/marketing',
  id: 700,
  parent_id: null,
  label: 'Marketing Module',
  key: 'marketing',
  icon: 'customer-icon',
  permission_slugs: ['marketing'],
  isSidebarMenu: true,
}
const MARKETING_FORMS: RouterMenuProps = {
  id: 701,
  path: '/marketing/forms',
  parent_id: 700,
  label: 'Forms',
  key: 'marketing-forms',
  permission_slugs: ['marketing'],
  isSidebarMenu: true,
}
const MARKETING_CAMPAIGNS: RouterMenuProps = {
  id: 702,
  path: '/marketing/campaigns',
  parent_id: 700,
  label: 'Campaigns',
  key: 'marketing-campaigns',
  permission_slugs: ['marketing'],
  isSidebarMenu: true,
}
const MARKETING_CAMPAIGN_DETAILS: RouterMenuProps = {
  id: 703,
  path: '/marketing/campaigns/:id',
  parent_id: null,
  label: 'Campaign details',
  key: 'marketing-campaign-details',
  permission_slugs: ['marketing'],
}

const MARKETING_FORM_EDITOR: RouterMenuProps = {
  id: 704,
  path: '/marketing/forms/:id/edit',
  parent_id: null,
  label: 'Form editor',
  key: 'marketing-form-editor',
  permission_slugs: ['marketing'],
}

const SALES: RouterMenuProps = {
  // path: '/sales',
  id: 800,
  parent_id: null,
  label: 'Sales Module',
  key: 'sales-module',
  icon: 'sales-icon',
  permission_slugs: MODULE_ACCESS.sales,
  isSidebarMenu: true,
}
const SALES_LEADS: RouterMenuProps = {
  id: 802,
  path: '/sales/leads',
  parent_id: 800,
  label: 'Leads',
  key: 'sales-leads',
  permission_slugs: MODULE_ACCESS.sales,
  isSidebarMenu: true,
}
const SALES_CLIENTS: RouterMenuProps = {
  id: 803,
  path: '/sales/clients',
  parent_id: 800,
  label: 'Clients',
  key: 'sales-clients',
  permission_slugs: MODULE_ACCESS.sales,
  isSidebarMenu: true,
}

export const router_config: { [key: string]: RouterMenuProps } = {
  DASHBOARD,
  ADMIN_USER,
  ...Object.fromEntries(USER_ROLE_MENUS.map((item) => [item.key, item])),
  PLANS,
  FITNESS,
  YOGA_MODULE,
  DIET_NUTRITION,
  FINANCE,
  MARKETING,
  MARKETING_FORMS,
  MARKETING_CAMPAIGNS,
  MARKETING_CAMPAIGN_DETAILS,
  MARKETING_FORM_EDITOR,
  SALES,
  SALES_LEADS,
  SALES_CLIENTS,
  ASSESSMENT_CATEGORY,
  ASSESSMENT_CATEGORY_DETAILS,
  NOTIFICATIONS,

  // Children under FITNESS
  CATEGORIES,
  CATEGORIES_DETAILS,
  WORKOUT,
  WORKOUT_DETAILS,
  YOGA,
  YOGA_DETAILS,
  MEDITATION,
  MEDITATION_DETAILS,

  // Children under DIET_NUTRITION
  DIET_TEMPLATE,
  WORKOUT_TEMPLATE,
  YOGA_TEMPLATE,
  YOGA_TEMPLATE_DETAILS,
  YOGA_TEMPLATE_DAY,
  WORKOUT_TEMPLATE_DETAILS,
  WORKOUT_TEMPLATE_DAY,
  DIET_TEMPLATE_DETAILS,
  DIET_TEMPLATE_DIET_PLAN,
  DIET_TEMPLATE_CATEGORIES,
  MEALS,
  MEALS_DETAILS,
  RECIPE,
  RECIPE_DETAILS,
  MEAL_TIMING,
  MEAL_TIMING_DETAILS,

  // Children under FINANCE
  SUBSCRIPTIONS,
  SUBSCRIPTIONS_DETAILS,
  PAYMENT_HISTORY,

  // Other details / routes
  PLAN_DETAILS,
  PLAN_DETAILS_DETAILS,
  PLAN_DETAILS_DIET,
  REMINDER_SETTINGS,
  USER_ADDITIONAL_INFO,
  DIET_DETAILS,
  LOGIN,
  FORGET_PASSWORD,
  RESET_PASSWORD,
  CHANGE_PASSWORD,
  USER_PROFILE,
  ORGANISATION_FILE_REPOSTITORY,
  ORGANISATION_USERLIST,
  MEDITATIONPLAN,
}
