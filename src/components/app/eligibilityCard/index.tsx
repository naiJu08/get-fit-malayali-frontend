import moment from 'moment'

import ToggleSwitch from '../../common/inputs/ToggleSwitch'

type props = {
  appId: boolean
  renewId: boolean
  title: string
  lastAppStatus: string
  lastAccrStatus: string
  lastcertify: string
  setOpenViewModel: any
  isLoading: boolean
  accType: string
  setAccType: (accType: string) => void
  accEligibility: boolean
  setAccEligibility: (accEligibility: boolean) => void
  // type: string
  setType: (type: string) => void
}

const EligibilityCard = ({
  appId,
  renewId,
  title,
  lastAppStatus,
  lastAccrStatus,
  lastcertify,
  setOpenViewModel,
  isLoading,
  setAccEligibility,
  setType,
  setAccType,
}: props) => {
  const handleAppChange = (checked: boolean) => {
    checked = !appId
    setOpenViewModel(true)
    setType('App')
    setAccType(title.toLowerCase())
    setAccEligibility(checked)
  }

  const handleRenChange = (checked: boolean) => {
    setAccEligibility(checked)
    setType('Ren')
    setAccType(title.toLowerCase())
    setOpenViewModel(true)
  }

  return (
    <>
      {isLoading ? (
        <div className="w-full bg-white rounded-md px-4 py-5 flex items-center shadow-card">
          <div className="font-semibold text-m text-blackAlt min-w-[110px]">
            <div className="h-2.5 bg-gray-200 rounded-md dark:bg-gray-700 w-[110px]"></div>
          </div>
          <div className="flex gap-10 items-center px-5 border-x mx-5">
            <div className="min-w-[170px] flex flex-col gap-2 justify-center py-2">
              <div className="h-2 bg-gray-200 rounded-md mb-1 dark:bg-gray-700 w-[110px]"></div>
              <div className="h-2 bg-gray-200 rounded-md mb-1 dark:bg-gray-700 w-[110px]"></div>
            </div>
            <div className="min-w-[145px] flex flex-col gap-2 justify-center py-2">
              <div className="h-2 bg-gray-200 rounded-md mb-1 dark:bg-gray-700 w-[110px]"></div>
              <div className="h-2 bg-gray-200 rounded-md mb-1 dark:bg-gray-700 w-[110px]"></div>
            </div>
            <div className="min-w-[100px] flex flex-col gap-2 justify-center py-2">
              <div className="h-2 bg-gray-200 rounded-md mb-1 dark:bg-gray-700 w-[100px]"></div>
              <div className="h-2 bg-gray-200 rounded-md mb-1 dark:bg-gray-700 w-[100px]"></div>
            </div>
          </div>
          <div className="min-w-[130px] flex flex-col gap-3">
            <div className="h-2 bg-gray-200 rounded-md dark:bg-gray-700 w-[110px]"></div>
            <div className="h-2 bg-gray-200 rounded-md dark:bg-gray-700 w-[110px]"></div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-[32px]"></div>
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-[32px]"></div>
          </div>
        </div>
      ) : (
        <div className="w-full bg-white rounded-md px-4 py-5 flex items-center shadow-card">
          <div className="font-semibold text-m text-blackAlt min-w-[110px]">
            {title}
          </div>
          <div className="flex gap-10 items-center px-5 border-x mx-5">
            <div className="min-w-[170px]">
              <span className="text-xs font-medium text-grey-medium mb-1">
                Last Application Status
              </span>
              <p className="text-common font-medium text-blackAlt">
                {lastAppStatus ?? '--'}
              </p>
            </div>
            <div className="min-w-[145px]">
              <span className="text-xs font-medium text-grey-medium mb-1">
                Last Accreditation Status
              </span>
              <p className="text-common font-medium text-blackAlt">
                {lastAccrStatus ?? '--'}
              </p>
            </div>
            <div className="min-w-[100px]">
              <span className="text-xs font-medium text-grey-medium mb-1">
                Last Certified On
              </span>
              <p className="text-common font-medium text-blackAlt">
                {lastcertify ? moment(lastcertify).format('DD-MM-YYYY') : '--'}
              </p>
            </div>
          </div>
          <div className="min-w-[130px]">
            <div className="flex gap-3">
              <span className="text-xs font-medium text-grey-medium mb-1 block min-w-[130px]">
                Application Eligibility
              </span>
              <ToggleSwitch
                id={`${title}-application`}
                checked={appId}
                onChange={handleAppChange}
              />
            </div>
            <div className="flex gap-3">
              <span className="text-xs font-medium text-grey-medium block min-w-[130px] mb-0">
                Renewal Eligibility
              </span>
              <ToggleSwitch
                id={`${title}-renewal`}
                checked={renewId}
                onChange={handleRenChange}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default EligibilityCard
