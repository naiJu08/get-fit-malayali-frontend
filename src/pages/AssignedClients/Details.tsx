import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import InfoBox from '../../components/app/alertBox/infoBox'
import { useAssignedClientDetail } from './api'

export default function AssignedClientDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isFetching } = useAssignedClientDetail(id)
  const clientId = data?.assigned_client?.client?.id

  useEffect(() => {
    if (clientId) {
      navigate('/users/' + clientId + '/details', { replace: true })
    }
  }, [clientId, navigate])

  if (isFetching || !clientId) {
    return (
      <div className="p-6">
        <InfoBox content="Opening client details..." />
      </div>
    )
  }

  return null
}
