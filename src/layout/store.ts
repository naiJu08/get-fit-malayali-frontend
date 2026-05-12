import { router_config, RouterMenuProps } from '../configs/route.config'
import { useDomainManageStore } from '../store/domainManageStore'

export type SidebarItem = {
  id: number
  icon: string
  name: string
  value?: number | string
  divider?: boolean
  path?: string
  dropdown?: {
    id: number
    name: string
    value?: number
    path?: string
  }[]
}

export const sidebarList: SidebarItem[] = [
  {
    id: 1,
    icon: 'dashboard-icon',
    name: 'Dashboard',
    path: '/dashboard',
  },
  {
    id: 2,
    icon: 'settings',
    name: 'Master Settings ',
    value: ' drop-arrow',
    path: '/settings',

    dropdown: [
      { id: 0, name: 'Admins', path: '/admin' },
      { id: 1, name: 'Global Roles', path: '/global' },
      { id: 2, name: 'Data Management', path: '/data-management' },
      // { name: 'Data Management', value: 22 },
    ],
  },
  {
    id: 3,
    icon: 'customer-icon',
    name: 'Users',
    path: '/users',
  },
  {
    id: 4,
    icon: 'subscription-icon',
    name: 'Plans',
    path: '/plans',
  },

  {
    id: 7,
    icon: 'subscription-icon',
    name: 'Subscriptions',
    path: '/subscriptions',
  },
  {
    id: 11,
    icon: 'subscription-icon',
    name: 'Notifications',
    path: '/notifications',
  },
  {
    id: 10,
    icon: 'subscription-icon',
    name: 'Recipes',
    path: '/recipe',
  },

  {
    id: 5,
    icon: 'subscription-icon',
    name: 'Workout',
    path: '/workout',
  },
  {
    id: 15,
    icon: 'discount-icon',
    name: 'Discounts Coupons',
    value: 3,
    path: '/discount',
  },
  {
    id: 6,
    icon: 'payment-icon',
    name: 'Payments',
    value: 12,
    path: '/payment',
  },
  {
    id: 8,
    icon: 'export-icon',
    name: 'Exports',
    value: 32,
    divider: true,
    path: '/export',
  },
  {
    id: 9,
    icon: 'support-icon',
    name: 'Support & Requests',
    value: 12,
    path: '/support',
  },
]

export const themes = [
  { name: 'Default', theme: 'default' },
  { name: 'Theme 1', theme: 'theme_1' },
]

export const generateArray = (): RouterMenuProps[] => {
  return Object.keys(router_config).map((k) => {
    const obj = router_config[k]
    return { ...obj, slug: k }
  })
}

// type Pages =

type Action =
  | 'view'
  | 'edit'
  | 'create'
  | 'delete'
  | 'send-invitaion'
  | 'reset-password'
  | 'de-activate'
  | 'activate'

type PagePermissions = {
  Employee: Action[]
  Assessor: Action[]
  Organisation: Action[]
  Tabularform?: Action[]
  Dashboard?: Action[]
  UserList?: Action[]
  DEIStrategy?: Action[]
  fileRepo?: Action[]
  Charter?: Action[]
  DataTables?: Action[]
  MEAL_TIMING?: Action[]
}

type Permissions = {
  Employee: PagePermissions
  Assessor: PagePermissions
  Organisation: PagePermissions
}

const permissions: Permissions = {
  Employee: {
    Employee: [
      'view',
      'edit',
      'create',
      'de-activate',
      'send-invitaion',
      'reset-password',
      'delete',
    ],
    Assessor: [
      'view',
      'edit',
      'create',
      'de-activate',
      'send-invitaion',
      'reset-password',
      'activate',
    ],

    UserList: [
      'view',
      'edit',
      'create',
      'de-activate',
      'activate',
      'send-invitaion',
      'reset-password',
    ],
    Organisation: ['view', 'create', 'de-activate', 'edit', 'activate'],
    Charter: ['view'],
    DEIStrategy: ['view'],
    Tabularform: ['view', 'edit', 'create'],
    fileRepo: ['view'],
    DataTables: ['view'],
    MEAL_TIMING: ['view', 'create', 'edit', 'delete'],
  },
  Assessor: {
    Employee: [],
    Assessor: ['view'],
    Organisation: ['view'],
    Charter: ['view'],
    UserList: ['view'],
    DEIStrategy: ['view'],
    fileRepo: ['view'],
    DataTables: ['view'],
    MEAL_TIMING: ['view'],
  },
  Organisation: {
    Employee: [],
    Assessor: [],
    Organisation: ['view', 'edit'],
    Charter: ['view', 'edit'],
    UserList: ['view'],
    DEIStrategy: ['view', 'edit'],
    fileRepo: ['view', 'create', 'delete'],
    DataTables: ['view', 'edit'],
    MEAL_TIMING: ['view', 'create', 'edit', 'delete'],
  },
}

export const checkPermissions = (
  page: keyof PagePermissions,
  action: Action
): boolean => {
  const current = useDomainManageStore.getState()
    .domainType as keyof Permissions
  const safeDomain: keyof Permissions = [
    'Employee',
    'Assessor',
    'Organisation',
  ].includes((current as unknown as string) || '')
    ? current
    : 'Employee'
  const pagePermissions = permissions[safeDomain]?.[page] || []
  return pagePermissions.includes(action)
}

export const checkPath = () => {
  const current = useDomainManageStore.getState()
    .domainType as keyof Permissions
  const safeDomain: keyof Permissions = [
    'Employee',
    'Assessor',
    'Organisation',
  ].includes((current as unknown as string) || '')
    ? current
    : 'Employee'
  if (safeDomain == 'Organisation') {
    return ''
  } else {
    return '/organisation'
  }
}
