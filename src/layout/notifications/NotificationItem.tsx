import Icons from '../../components/common/icons/index'
import { useAuthStore } from '../../store/authStore'
import {
  convertUTCtoBrowserTimeZone,
  parseDateString,
  timeSince,
} from '../../utilities/format'

export default function NotificationItem({ item, handleOpenEvent }: any) {
  const { impersonating } = useAuthStore()

  return (
    <div
      onClick={(e) =>
        impersonating || item.title.includes('Deleted')
          ? ''
          : handleOpenEvent(e, item)
      }
      className={`flex w-full p-4 items-start gap-2 border-b pb-4  ${
        item.status !== 'unread' || impersonating
          ? 'bg-white'
          : 'hover:bg-slate-100'
      } ${item.status !== 'unread' || impersonating ? '' : 'cursor-pointer'}`}
    >
      <div
        className={`${
          item.status !== 'unread' && 'text-grey-medium'
        } w-full flex flex-col gap-1`}
      >
        <div className=" flex justify-between w-full items-center">
          <p className=" text-[16px] max-w-[400px] font-medium   line-clamp-3">
            {item?.title ?? 'Notification'}
          </p>
          <div className=" flex gap-1 items-center">
            <span
              // onClick={(e) => {
              //   e.stopPropagation(), handleRead(item, e)
              // }}
              className={`${
                item.status === 'unread' ? ' text-[#336cfc]' : 'text-primary'
              } text-xs  cursor-pointer  p-1 rounded-sm `}
            >
              {item.status === 'unread' ? 'Mark as Read' : 'Mark as Unread'}
            </span>
            <span
              className="text-primary cursor-pointer"
              // onClick={(e) => {
              //   e.stopPropagation(), handleDelete(item, e)
              // }}
            >
              <Icons className="iconBlack iconWidthSm " name="delete" />
            </span>
          </div>
        </div>
        {item?.franchisee?.franchisee_display_name && (
          <p className=" text-sm max-w-[400px] ">
            Franchisee : {item?.franchisee?.franchisee_display_name}
          </p>
        )}
        <p className=" text-sm max-w-[400px] ">{item?.content}</p>
        <div className=" flex justify-between w-full items-center text-grey-medium">
          <p className=" text-xs ">
            {timeSince(
              parseDateString(
                convertUTCtoBrowserTimeZone(item.datetime_created)
              )
            )}
          </p>
          <p className=" text-xs ">
            {convertUTCtoBrowserTimeZone(item.datetime_created)}
          </p>
        </div>
      </div>
    </div>
  )
}
