import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import InfoBox from '../../components/app/alertBox/infoBox'
import { useAssignedClientDetail } from './api'

export default function AssignedClientDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { data, isFetching } = useAssignedClientDetail(id)
  const clientId = data?.assigned_client?.client?.id

  useEffect(() => {
    if (clientId) {
      navigate('/users/' + clientId + '/details', {
        replace: true,
        state: location.state,
      })
    }
  }, [clientId, navigate, location.state])

  if (isFetching || !clientId) {
    return (
      <div className="p-6">
        <InfoBox content="Opening client details..." />
      </div>
    )
  }

  return null
}
