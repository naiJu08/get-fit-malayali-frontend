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
    name: 'Customer',
    path: '/customer',
  },
  {
    id: 4,
    icon: 'subscription-icon',
    name: 'Subscription Plans',
    value: 77,
    path: '/subscription',
  },
  {
    id: 5,
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
  },
}

const domain = useDomainManageStore.getState().domainType as keyof Permissions
export const checkPermissions = (
  page: keyof PagePermissions,
  action: Action
): boolean => {
  const pagePermissions = permissions[domain][page]

  return pagePermissions?.includes(action) ?? false
}

export const checkPath = () => {
  if (domain == 'Organisation') {
    return ''
  } else {
    return '/organisation'
  }
}
