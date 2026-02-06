import InfoBox from '../../../components/app/alertBox/infoBox'

const fields = [
  { label: 'Subscription Notes', path: 'notes' },
  { label: 'Special Instructions', path: 'special_instructions' },
  { label: 'Payment Status', path: 'payment_status' },
  { label: 'Payment Mode', path: 'payment_mode' },
  { label: 'Invoice Number', path: 'invoice_number' },
  { label: 'Assigned By', path: 'assigned_by_name' },
  { label: 'Assigned On', path: 'assigned_on' },
  { label: 'Billing Address', path: 'billing_address' },
  { label: 'Additional Metadata', path: 'metadata' },
]

const getValue = (source: any, path: string) =>
  path.split('.').reduce((acc: any, key: string) => acc?.[key], source)

const formatValue = (value: any) => {
  if (value === null || value === undefined || value === '') return '--'
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

type AdditionalInfoTabProps = {
  subscription?: Record<string, any>
}

export default function AdditionalInfoTab({
  subscription,
}: AdditionalInfoTabProps) {
  const hasData = fields.some((field) => {
    const value = getValue(subscription, field.path)
    return value !== null && value !== undefined && value !== ''
  })

  if (!hasData) {
    return (
      <div className="p-6">
        <InfoBox content="No additional information has been recorded for this subscription." />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map((field) => (
        <div key={field.path} className="border rounded-lg p-4 bg-white">
          <div className="text-xs text-gray-500 mb-1">{field.label}</div>
          <div className="text-sm text-gray-900">
            {formatValue(getValue(subscription, field.path))}
          </div>
        </div>
      ))}
    </div>
  )
}
