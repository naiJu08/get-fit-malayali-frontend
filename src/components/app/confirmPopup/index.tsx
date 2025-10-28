import { DialogModal } from '../../../components/common'
import { useAuthStore } from '../../../store/authStore'
import InfoBox from '../alertBox/infoBox'

type Props = {
  openConfirm: boolean
  setOpenConfirm: any
  orgName: string
  handleConfirmPopupOnSubmit: any
  actionLabel?: string
  title?: string
}
const ConfirmPopup = ({
  openConfirm,
  setOpenConfirm,
  orgName,
  handleConfirmPopupOnSubmit,
  actionLabel,
  title,
}: Props) => {
  const data = useAuthStore()
  return (
    <DialogModal
      isOpen={openConfirm}
      onClose={() => setOpenConfirm(false)}
      title={title ?? 'Save Organisation Details'}
      onSubmit={() => handleConfirmPopupOnSubmit()}
      className="z-50"
      secondaryAction={() => setOpenConfirm(false)}
      secondaryActionLabel="Cancel"
      actionLabel={actionLabel ?? 'Acknowledge & Save'}
      body={
        <>
          <InfoBox
            content={`I, ${data?.userData?.first_name} ${data?.userData?.last_name}, as the representative for ${orgName}, declare that the information I have provided accurately represents  ${orgName}`}
          />
        </>
      }
    />
  )
}

export default ConfirmPopup
