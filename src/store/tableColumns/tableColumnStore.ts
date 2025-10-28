import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useTableStore = create<TableStore>()(
  persist(
    (set) => ({
      columnData: {
        account_table: [],
        contact_table: [],
        order_table: [],
        service_table: [],
        payment_table: [],
        my_approval_table: [],
        activity_table: [],
        my_task_table: [],
        my_payment_table: [],
        lead_table: [],
        deal_table: [],
        quote_table: [],
      },
      setColumnData: (data) => set(() => ({ columnData: data })),
    }),
    { name: 'table__columns' }
  )
)

type TableStore = {
  columnData: {
    [key: string]: Columns[]
  }
  setColumnData: (id: any) => void
}

export interface Columns {
  field: string
  isVisible: boolean
  resizable?: boolean
  sortKey?: string
  sortable?: boolean
  colWidth?: number
  title: string
  sortOrder?: number
}
