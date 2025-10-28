type OverviewItems = {
  id: number
  iconName: string
  name: string
  value?: number
  meta?: string
  bar?: {
    percentage: number
    value: number
  }
}

export const overviewItems: OverviewItems[] = [
  {
    id: 1,
    iconName: 'activities',
    name: 'Name of the Dashlet',
    value: 2345,
    meta: 'Metadata',
  },
  {
    id: 2,
    iconName: 'attachment',
    name: 'Name of the Dashlet',
    value: 243,
    meta: 'Metadata',
  },
  {
    id: 3,
    iconName: 'attachment',
    name: 'Name of the Dashlet',
    value: 112,
    meta: 'Metadata',
  },
  {
    id: 4,
    iconName: 'attachment',
    name: 'Name of the Dashlet',
    value: 432,
    meta: 'Metadata',
  },
  {
    id: 5,
    iconName: 'attachment',
    name: 'Name of the Dashlet',
    value: 22,
    meta: 'Metadata',
  },
  {
    id: 6,
    iconName: 'activities',
    name: 'Name of the Dashlet',
    bar: { percentage: 10, value: 23 },
  },
  {
    id: 7,
    iconName: 'activities',
    name: 'Name of the Dashlet',
    bar: { percentage: 40, value: 23 },
  },
]
