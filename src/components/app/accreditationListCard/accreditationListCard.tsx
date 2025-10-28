import moment from 'moment'
// import Icons from '../../common/icons'
import { useNavigate } from 'react-router-dom'

import { Button } from '../../common'

type props = {
  id: string
  title: string
  status: 'Renewal' | 'Application'
  applied: string
  statusDate?: string
  certifiedDate: string
  certifiedstatus: string
  certifiedexp: string
  is_renewal: boolean
  handleDetails?: () => void
}

const AccreditationListCard = ({
  id,
  title,
  status,
  applied,
  certifiedDate,
  certifiedstatus,
  certifiedexp,
  is_renewal,
}: props) => {
  const navigate = useNavigate()

  const handleDetails = () => {
    return navigate(`/accreditation/${id}`)
  }
  return (
    <div className="bg-white py-4 w-[1000px] max-w-full rounded-md px-5 shadow-[0px_5px_28px_#5F5A5A12]">
      <div className="flex gap-8 items-center justify-between py-2">
        <div className="min-w-[140px]">
          <h4 className="mb-2 font-bold">{title}</h4>
          {is_renewal ? (
            <span className="text-success bg-success-light py-1 px-2 rounded-sm text-xxs font-medium">
              Renewal
            </span>
          ) : (
            <span className="text-primary bg-primaryAlt py-1 px-2 rounded-sm text-xxs font-medium">
              Application
            </span>
          )}
        </div>
        <div className="min-w-[70px]">
          <p className="font-medium text-grey-mediumAlt text-xxs mb-1">
            Submitted On
          </p>
          <span className="text-common font-medium">
            {applied
              ? moment(applied, 'YYYY-MM-DD').format('DD-MM-YYYY')
              : '- -'}
          </span>
        </div>
        <div className="min-w-[180px]">
          <p className="font-medium text-grey-mediumAlt text-xxs mb-1">
            Application Status
          </p>
          <span className="text-common font-medium">{status}</span>
        </div>

        <div className="min-w-[90px]">
          <p className="font-medium text-grey-mediumAlt text-xxs mb-1">
            Accredited On
          </p>
          <span className="text-common font-medium">
            {certifiedDate
              ? moment(certifiedDate, 'YYYY-MM-DD').format('DD-MM-YYYY')
              : '- -'}
          </span>
        </div>
        <div className="min-w-[60px]">
          <p className="font-medium text-grey-mediumAlt text-xxs mb-1">
            Status
          </p>
          <span className="text-common font-medium">{certifiedstatus}</span>
        </div>
        <div className="min-w-[80px]">
          <p className="font-medium text-grey-mediumAlt text-xxs mb-1">
            Expiry Date
          </p>
          <span className="text-common font-medium">
            {certifiedexp
              ? moment(certifiedexp, 'YYYY-MM-DD').format('DD-MM-YYYY')
              : '- -'}
          </span>
        </div>
        <div>
          <Button
            label="View More"
            primary
            icon="arrow-right"
            iconAlignment="right"
            onClick={() => handleDetails?.()}
          />
        </div>
      </div>
    </div>
  )
}

export default AccreditationListCard
