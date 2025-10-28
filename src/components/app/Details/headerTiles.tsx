import { Button } from '../../../components/common'
import HeaderTileInfo from './headerTileInfo'

const HeaderTiles = ({
  data,
  tileInfo,
  DropdownItems,
  // setPublishAssesmentFlag,
  domainType,
  previousApplication,
  submitFlag,
  handleSubmitAction,
  buttonLoader,
  handlePublishAssesmentFlag,
  updateKey,
}: any) => {
  const handleOpen = () => {
    if (domainType === 'Organisation') {
      window.open('/myorganisation/profile')
    } else {
      window.open(`/organisation/${data?.organisation_id}/profile`)
    }
  }
  return (
    <div className="w-full bg-primaryThin sticky top-0 z-20">
      <div className="flex  px-5 items-center w-full justify-between border-b border-formBorder">
        <div className="py-3 shrink-0">
          <div className="flex gap-2 items-center">
            <h4 className="text-m font-bold">{data.title}</h4>
            <span
              className={`rounded-md text-danger text-xxs font-medium bg-dangerLight block py-1 px-1.5 border border-dangerBorder ${data.badge ? '' : 'hidden'}`}
            >
              {data.badge}
            </span>
          </div>
          <p
            onClick={() => handleOpen()}
            className="text-primary text-common cursor-pointer"
          >
            {data.cName}
          </p>
        </div>
        <div className="hidden ms-auto 2xl:block">
          <HeaderTileInfo
            ItemInfo={tileInfo}
            DropdownItems={DropdownItems}
            key={updateKey}
          />
        </div>
        <div className="shrink-0 flex items-center ps-3  gap-2">
          {data?.isRenewal && (
            <Button
              label={'Previous Application'}
              size="common"
              className={'bg-transparent'}
              outlined
              onClick={() => previousApplication()}
              hidden={!data?.parent}
            />
          )}

          {domainType == 'Employee' && (
            <Button
              label={'Publish Assessment'}
              size="common"
              primary
              onClick={() => handlePublishAssesmentFlag()}
              disabled={!data?.canPublish}
              isLoading={buttonLoader}
            />
          )}
          {domainType == 'Organisation' && (
            <Button
              label={'Submit Application'}
              size="common"
              onClick={() => handleSubmitAction(!submitFlag)}
              disabled={!data?.canSubmit}
              isLoading={buttonLoader}
            />
          )}
        </div>
      </div>
      <div className="2xl:hidden border-b boreder-grey-border">
        <HeaderTileInfo
          ItemInfo={tileInfo}
          DropdownItems={DropdownItems}
          key={updateKey}
        />
      </div>
    </div>
  )
}

export default HeaderTiles
