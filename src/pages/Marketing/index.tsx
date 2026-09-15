import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Forms from './Forms'
import Campaigns from './Campaigns'
export default function Marketing() {
  const location = useLocation()
  const navigate = useNavigate()
  const [tab, setTab] = useState(
    location.pathname.includes('/campaigns') ? 'campaigns' : 'forms'
  )
  useEffect(
    () =>
      setTab(location.pathname.includes('/campaigns') ? 'campaigns' : 'forms'),
    [location.pathname]
  )
  return (
    <div className="p-4">
      <div className="flex gap-2 border-b mb-4">
        <button
          className={
            'px-4 py-2 ' +
            (tab === 'forms'
              ? 'border-b-2 border-primaryGreen font-semibold'
              : '')
          }
          onClick={() => {
            setTab('forms')
            navigate('/marketing/forms')
          }}
        >
          Forms
        </button>
        <button
          className={
            'px-4 py-2 ' +
            (tab === 'campaigns'
              ? 'border-b-2 border-primaryGreen font-semibold'
              : '')
          }
          onClick={() => {
            setTab('campaigns')
            navigate('/marketing/campaigns')
          }}
        >
          Campaigns
        </button>
      </div>
      {tab === 'forms' ? <Forms /> : <Campaigns />}
    </div>
  )
}
