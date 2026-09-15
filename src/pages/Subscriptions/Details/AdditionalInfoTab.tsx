import AdditionalInfo from '../../AdminUser/Details/AdditionalInfo'

type AdditionalInfoTabProps = {
  subscription?: Record<string, any>
}

export default function AdditionalInfoTab({
  subscription,
}: AdditionalInfoTabProps) {
  const userId = subscription?.user_id ?? subscription?.user?.id

  if (!userId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-yellow-800">
            User information is unavailable to view nutritional assessment.
          </div>
        </div>
      </div>
    )
  }

  // Create a user object with the id to match AdditionalInfo component expectations
  const user = { id: userId }

  // Render the exact same AdditionalInfo component as /users/347/additional-info
  return <AdditionalInfo user={user} subscriptionId={subscription?.id} />
}
