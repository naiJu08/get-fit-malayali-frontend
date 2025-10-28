import { router_config } from '../configs/route.config'

const moduleSwitch = (row: any) => {
  switch (row.entity_name) {
    case 'order':
      return `${router_config.SERVICE_AND_ORDERS_BY_ORDERS.path}/${row.entity_id}`
    case 'lead':
      return `${router_config.LEADS.path}/${row.entity_id}`
    case 'deal':
      return `${router_config.DEALS.path}/${row.entity_id}`
    case 'quote':
      return `${router_config.QUOTES.path}/${row.entity_id}`
    case 'prospect':
      return `${router_config.PROSPECTS.path}/${row.entity_id}`
    case 'account':
      return `${router_config.ACCOUNTS.path}/${row.entity_id}`
    case 'contact':
      return `${router_config.CONTACTS.path}/${row.entity_id}`
    case 'service':
      return `${router_config.SERVICE_AND_ORDERS_BY_SERVICE.path}/${row.entity_id}`
    case 'activity':
      return `${router_config.ACTIVITIES.path}/${row.entity_id}`
    case 'employee':
      return `${router_config.SYSTEM_SETTINGS_ORGANIZATION_EMPLOYEES.path}/${row.entity_id}`
    // case 'my_task':
    //   return `${router_config.MY_TASKS.path}/${row.entity_id}`
    case 'my_approvals':
      return `${router_config.ACTIVITIES.path}/${row.entity_id}`
    case 'payment_approval_request':
      return `${router_config.ACTIVITIES.path}/${row.entity_id}`
    case 'my_payment_approvals':
      return `${router_config.ACTIVITIES.path}/${row.entity_id}`

    default:
      return null
    // return `${router_config.SERVICE_AND_ORDERS_BY_ORDERS.path}/${row.entity_id}/summary`
  }
}
export const switchPath = (row: any) => {
  switch (row?.entity_name) {
    case 'order':
    case 'lead':
    case 'deal':
    case 'quote':
    case 'prospect':
    case 'account':
    case 'contact':
    case 'service':
    case 'activity':
      return `${moduleSwitch(row)}/summary`
    case 'employee':
      return `${moduleSwitch(row)}/basic-info`
    case 'my_task':
      return `${router_config.MY_TASKS.path}/${row.entity_id}`
    case 'my_approvals':
    case 'my_payment_approvals':
    case 'payment_approval_request':
      return `${moduleSwitch(row.entity_path)}/requests?entitty=${
        row.entity_id
      }`
    case 'invoice':
      return `${router_config.INVOICES.path}/${row.entity_id}/invoices-details`
    case 'task':
      return `${moduleSwitch(row.entity_path)}/tasks?entity=${row.entity_id}`
    case 'event_log':
      return `${moduleSwitch(row.entity_path)}/event-logs?entity=${
        row.entity_id
      }`
    case 'file_uploads':
      return `${moduleSwitch(row.entity_path)}/attachments?entity=${
        row.entity_id
      }`
    default:
      return null
    // return `${router_config.SERVICE_AND_ORDERS_BY_ORDERS.path}/${row.entity_id}/summary`
  }
}
