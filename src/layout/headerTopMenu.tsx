export type HeaderMenuItem = {
  id: number
  name: string
  active?: boolean
}

export const HeaderMenuList: HeaderMenuItem[] = [
  {
    id: 1,
    name: 'Home',
    active: true,
  },
  {
    id: 2,
    name: 'Accounts',
    active: false,
  },
  {
    id: 3,
    name: 'Leads',
    active: false,
  },
  {
    id: 4,
    name: 'Tab 4',
    active: false,
  },
  {
    id: 5,
    name: 'Tab 5',
    active: false,
  },
  {
    id: 6,
    name: 'Tab 6',
    active: false,
  },
]
