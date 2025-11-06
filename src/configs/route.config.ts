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
  permission_slugs: [],
  // permission_slugs: [
  //   domainTypes['EMPLOYEE'],
  //   domainTypes['ORGANISATION'],
  //   domainTypes['ASSESSOR'],
  // ],
  // breadcrumb: ["DASHBOARD"],
  // isSidebarMenu: true,
}

const TABULARFORM: RouterMenuProps = {
  id: 1,
  path: '/tabularform',
  parent_id: null,
  icon: 'tabularform-icon',
  label: 'Tabular Form',
  key: 'tabularform',
  permission_slugs: [domainTypes['EMPLOYEE']],
  // breadcrumb: ["DASHBOARD"],
  isSidebarMenu: false,
}

const ACCREDITAITON: RouterMenuProps = {
  id: 5,
  path: '/accreditation',
  parent_id: null,
  icon: 'accreditation-icon',
  label: 'Accreditations',
  key: 'accreditation',
  // permission_slugs: [...handleViewPermission(MODULES.dashboard)],
  permission_slugs: [domainTypes['EMPLOYEE'], domainTypes['ASSESSOR']],
  isSidebarMenu: true,
}
const ACCREDITAITON_CERTIFICATION: RouterMenuProps = {
  id: 1,
  path: '/accreditation-certification/:type',
  parent_id: null,
  icon: 'user-icon',
  label: 'Accreditation Certification',
  key: 'accreditationcertification',
  // permission_slugs: [...handleViewPermission(MODULES.dashboard)],
  permission_slugs: [],
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

const ASSESSOR: RouterMenuProps = {
  id: 4,
  path: '/assessors',
  parent_id: null,
  icon: 'user',
  label: 'Assessors',
  key: 'customer',
  permission_slugs: [domainTypes['EMPLOYEE'], domainTypes['ASSESSOR']],
  isSidebarMenu: true,
  slugOptions: [
    'CONTACT_DETAILS_SUMMARY',
    'CONTACT_DETAILS_ACCOUNTS',
    'CONTACT_MERGE',
    'CONTACT_DETAILS_POSSIBLE_DUPLICATES',
    'CONTACT_DETAILS_EVENT_LOGS',
    'CONTACT_FILES_AND_ATTACHMENTS',
    'CONTACT_TASKS',
    'CONTACT_DETAILS_NOTES',
  ],
  hasChild: false,
  hasDivider: true,
}

const ORGANISATION: RouterMenuProps = {
  id: 4,
  // path:
  //   domain !== domainTypes['ORGANISATION']
  //     ? '/organisation'
  //     : `/organisation/${userId}/`,
  path: '/organisation',
  parent_id: null,
  icon: 'user',
  label: 'Organisations',
  key: 'customer',
  permission_slugs: [domainTypes['EMPLOYEE'], domainTypes['ASSESSOR']],

  isSidebarMenu: true,
  slugOptions: [
    'ORGANISATION_DETAILS',
    'ORGANISATION_DETAILS_PROFILES',
    'ORGANISATION_DETAILS_USERS',
  ],
  hasChild: false,
  hasDivider: true,
}
const MY_ORGANISATION_DETAILS: RouterMenuProps = {
  id: 41,
  path: '/myorganisation/',
  pathOverride: '/myorganisation/profile',
  parent_id: 4,
  isDetails: true,
  icon: 'user',
  label: 'My Organisation',
  permission_slugs: [domainTypes['ORGANISATION']],
  key: 'organisation-details',
  breadcrumb: ['MY_ORGANISATION_DETAILS'],
  isSidebarMenu: true,
}
const HOME: RouterMenuProps = {
  id: 3,
  path: '/accreditation',
  parent_id: null,
  icon: 'myAccreditations',
  label: 'My Accreditations',
  key: 'home',
  permission_slugs: [domainTypes['ORGANISATION']],
  isSidebarMenu: true,
}
const ORGANISATION_DETAILS: RouterMenuProps = {
  id: 41,
  path: '/organisation/:id/',
  parent_id: 4,
  isDetails: true,
  icon: 'user',
  label: 'Organisation Details',
  key: 'organisation-details',
  permission_slugs: [],
  breadcrumb: ['ORGANISATION', 'ORGANISATION_DETAILS'],
}
const ORGANISATION_DETAILS_PROFILES: RouterMenuProps = {
  id: 411,
  path: 'profile',
  parent_id: 4,
  icon: 'user',
  label: 'Profile',
  key: 'organisation-details-profiles',
  permission_slugs: [],
  breadcrumb: [
    'ORGANISATION',
    'ORGANISATION_DETAILS',
    'ORGANISATION_DETAILS_PROFILES',
  ],
}

const ORGANISATION_DETAILS_USERS: RouterMenuProps = {
  id: 412,
  path: 'users',
  parent_id: 41,
  icon: 'user',
  label: 'Organisation Users',
  key: 'organisation-details-users',
  permission_slugs: [],
  // permission_slugs: [],
  breadcrumb: [
    'ORGANISATION',
    'ORGANISATION_DETAILS',
    'ORGANISATION_DETAILS_USERS',
  ],
}

const ORGANISATION_DEI_STRATEGY: RouterMenuProps = {
  id: 413,
  path: 'edi-strategy',
  parent_id: 41,
  icon: 'user',
  label: 'ED&I Strategy',
  key: 'organisation-dei-startegy',
  permission_slugs: [],
  breadcrumb: [
    'ORGANISATION',
    'ORGANISATION_DETAILS',
    'ORGANISATION_DEI_STRATEGY',
  ],
}
const ACCREDITAITON_ELIGIBILITY: RouterMenuProps = {
  id: 413,
  path: 'eligibility',
  parent_id: 41,
  icon: 'user',
  label: 'Accreditation Eligibility',
  key: 'accreditation-eligibility',
  permission_slugs: [domainTypes['EMPLOYEE']],
  breadcrumb: [
    'ORGANISATION',
    'ORGANISATION_DETAILS',
    'ACCREDITAITON_ELIGIBILITY',
  ],
}
const ACCREDITAITON_DETAILS: RouterMenuProps = {
  id: 480,
  path: '/accreditation/:id',
  parent_id: 5,
  icon: 'user',
  label: 'Accreditation Details',
  key: 'accreditation-details',
  permission_slugs: [domainTypes['ORGANISATION']],
  breadcrumb: ['ACCREDITAITON_DETAILS'],
}

const ACCREDITAITON_DETAILS_INFO: RouterMenuProps = {
  id: 481,
  path: 'info',
  parent_id: 480,
  icon: 'user',
  label: 'Details',
  key: 'accreditation-details-info',
  permission_slugs: [],
  breadcrumb: ['ACCREDITAITON_DETAILS'],
}
const ACCREDITAITON_DETAILS_FORM: RouterMenuProps = {
  id: 482,
  path: 'form',
  parent_id: 480,
  icon: 'user',
  label: 'Application Form',
  key: 'accreditation-details-form',
  permission_slugs: [],
  // breadcrumb: ['ACCREDITAITON_DETAILS'],
}
const ORGANISATION_DATATABLES: RouterMenuProps = {
  id: 414,
  path: 'data-tables',
  parent_id: 41,
  icon: 'user',
  label: 'Datatables',
  key: 'organisation-data-tables',
  permission_slugs: [],
  breadcrumb: [
    'ORGANISATION',
    'ORGANISATION_DETAILS',
    'ORGANISATION_DATATABLES',
  ],
}

const ORGANISATION_FILE_REPOSITORY: RouterMenuProps = {
  id: 415,
  path: 'file-repository',
  parent_id: 41,
  icon: 'user',
  label: 'File Repository',
  key: 'organisation-file-repository',
  permission_slugs: [],
  breadcrumb: [
    'ORGANISATION',
    'ORGANISATION_DETAILS',
    'ORGANISATION_FILE_REPOSITORY',
  ],
}

const ORGANISATION_CHANGE_LOG: RouterMenuProps = {
  id: 416,
  path: 'change-logs',
  parent_id: 41,
  icon: 'user',
  label: 'Change Logs',
  key: 'organisation-change-logs',
  permission_slugs: [],
  breadcrumb: [
    'ORGANISATION',
    'ORGANISATION_DETAILS',
    'ORGANISATION_CHANGE_LOG',
  ],
}

const ADMIN_USER: RouterMenuProps = {
  id: 2,
  path: '/users',
  parent_id: null,
  label: 'Administrators',
  key: 'admin-user',
  permission_slugs: [],
  isSidebarMenu: true,
}
const SUBSCRIPTIONS: RouterMenuProps = {
  id: 29,
  path: '/subscriptions',
  parent_id: null,
  label: 'Subscriptions',
  key: 'subscriptions',
  permission_slugs: [],
  isSidebarMenu: true,
}
const PLANS: RouterMenuProps = {
  id: 21,
  path: '/plans',
  parent_id: null,
  label: 'Plans',
  key: 'plans',
  permission_slugs: [],
  isSidebarMenu: true,
}
const WORKOUT: RouterMenuProps = {
  id: 25,
  path: '/workout',
  parent_id: null,
  label: 'Workout',
  key: 'workout',
  permission_slugs: [],
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
  path: '/plans/:id',
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
  parent_id: null,
  label: 'Recipe',
  key: 'recipe',
  permission_slugs: [],
  isSidebarMenu: true,
}

const CLIENTS: RouterMenuProps = {
  id: 30,
  path: '/clients',
  parent_id: null,
  label: 'Clients',
  key: 'clients',
  permission_slugs: [],
  isSidebarMenu: true,
}

const WORKOUT_PLAN_DETAILS: RouterMenuProps = {
  id: 26,
  path: '/workout_details/:id',
  parent_id: 21,
  isDetails: true,
  icon: 'user',
  label: 'Workout Details',
  key: 'workout-details',
  permission_slugs: [],
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

// Note : The arrangements of below "router_config" object will reflect in Sidebar
export const router_config: { [key: string]: RouterMenuProps } = {
  DASHBOARD,
  ADMIN_USER,
  SUBSCRIPTIONS,
  WORKOUT,
  PLANS,
  PLAN_DETAILS,
  PLAN_DETAILS_DETAILS,
  PLAN_DETAILS_WORKOUT,
  PLAN_DETAILS_DIET,
  WORKOUT_PLAN_DETAILS,
  SUBSCRIPTIONS_DETAILS,
  DIET_DETAILS,
  RECIPE,
  CLIENTS,
  ASSESSOR,
  ORGANISATION,
  ORGANISATION_DETAILS,
  ORGANISATION_DETAILS_PROFILES,
  ORGANISATION_DETAILS_USERS,
  ORGANISATION_DEI_STRATEGY,
  ACCREDITAITON_ELIGIBILITY,
  ORGANISATION_DATATABLES,
  ORGANISATION_FILE_REPOSITORY,
  ORGANISATION_CHANGE_LOG,
  LOGIN,
  FORGET_PASSWORD,
  RESET_PASSWORD,
  CHANGE_PASSWORD,
  USER_PROFILE,
  TABULARFORM,
  ORGANISATION_FILE_REPOSTITORY,
  ORGANISATION_USERLIST,
  ACCREDITAITON,
  ACCREDITAITON_CERTIFICATION,
  ACCREDITAITON_DETAILS,
  ACCREDITAITON_DETAILS_INFO,
  ACCREDITAITON_DETAILS_FORM,
  MY_ORGANISATION_DETAILS,
  HOME,
  WORKOUT_DETAILS,
}
