type InvoiceTableData = {
  id: number
  contact_id: number
  created_date: string
  account_name: string
  account_cre: string
  active_orders: { value1: number; value2: number }
  amount_due: { value1: number; value2: number }
}

export const invoiceTableData: InvoiceTableData[] = [
  {
    id: 1,
    contact_id: 2134563,
    created_date: '24 Mar 2023',
    account_name: 'Apple',
    account_cre: 'Annette Black',
    active_orders: { value1: 536, value2: 34567 },
    amount_due: { value1: 536.5, value2: 34567 },
  },
  {
    id: 2,
    contact_id: 2134563,
    created_date: '24 Mar 2023',
    account_name: 'Apple',
    account_cre: 'Annette Black',
    active_orders: { value1: 536, value2: 34567 },
    amount_due: { value1: 536.5, value2: 34567 },
  },
  {
    id: 3,
    contact_id: 2134563,
    created_date: '24 Mar 2023',
    account_name: 'Apple',
    account_cre: 'Annette Black',
    active_orders: { value1: 536, value2: 34567 },
    amount_due: { value1: 536.5, value2: 34567 },
  },
  {
    id: 4,
    contact_id: 2134563,
    created_date: '24 Mar 2023',
    account_name: 'Apple',
    account_cre: 'Annette Black',
    active_orders: { value1: 536, value2: 34567 },
    amount_due: { value1: 536.5, value2: 34567 },
  },
  {
    id: 5,
    contact_id: 2134563,
    created_date: '24 Mar 2023',
    account_name: 'Apple',
    account_cre: 'Annette Black',
    active_orders: { value1: 536, value2: 34567 },
    amount_due: { value1: 536.5, value2: 34567 },
  },
]
