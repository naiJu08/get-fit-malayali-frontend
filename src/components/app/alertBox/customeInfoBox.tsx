import Icons from '../../common/icons'

const CustomeInfoBox = ({ content }: any) => {
  return (
    <div className="p-4 bg-white rounded-lg flex items-start gap-2">
      <div className="w-5 min-w-[20px]">
        <Icons name="exclamation-circle" />
      </div>
      <div className="flex flex-col gap-2">
        {content ??
          ` <p className=" text-blackAlt text-xxs leading-4 font-normal">
             Merging contacts is a way to eliminate duplicate contacts in the
          system. After merging, only one contact, known as the Primary Contact,
          will be kept, and all other duplicate contacts will be deleted. The
          Primary Contact will contain all the information from the duplicate
          contacts, including linked orders, and more.
        </p>
           `}
      </div>
    </div>
  )
}

export default CustomeInfoBox
