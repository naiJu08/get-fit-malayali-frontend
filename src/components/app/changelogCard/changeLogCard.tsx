import { useEffect, useRef, useState } from 'react'
import moment from 'moment'

type Props = {
  status: string
  updateddate: string
  updatedby: string
  lists: any
  setOpenViewModel: any
  setItem: (item: any) => void
  item: any
  heading: string
}

const ChangeLogCard = ({
  updateddate,
  status,
  updatedby,
  lists,
  setOpenViewModel,
  setItem,
  heading,
  item,
}: Props) => {
  const listWrapRef = useRef<HTMLUListElement>(null)
  const [ulHeight, setUlHeight] = useState<number | null>(null)

  useEffect(() => {
    if (listWrapRef.current) {
      setUlHeight(listWrapRef.current.clientHeight)
    }
  }, [])

  const handleClick = (item: any) => {
    setItem(item)
    setOpenViewModel(true)
  }

  const numberOfLiTags = lists.split('</li>').length - 1
  const firstThreeItems =
    lists.split('</li>').slice(0, 3).join('</li>') + '</li>'

  // const displayHtml = `<ul>${firstThreeItems}</pre></ul>`
  return (
    <div className="bg-white shadow-card py-4 px-5 flex items-center rounded-md max-w-[950px] w-full mb-4 duration-300 hover:translate-x-1">
      <div className="w-[270px] shrink-0">
        <h4 className="font-medium text-grey-medium text-common mb-1">
          {status} Updated On{' '}
          {moment(updateddate).format('Do MMM YYYY hh:mm A')}
        </h4>

        <span className="font-medium text-xxs p-1 px-2 rounded-sm bg-primaryAlt text-primary">
          {updatedby}
        </span>
      </div>
      <div className="w-full text-common text-grey-medium">
        <h4 className="font-medium text-grey-medium text-common mb-1">
          {heading}
        </h4>{' '}
        <ul
          ref={listWrapRef}
          className="text-common list-disc break-all list-wrap"
          dangerouslySetInnerHTML={{ __html: firstThreeItems }}
        ></ul>
        {(numberOfLiTags > 3 || (ulHeight !== null && ulHeight > 63)) && (
          <span
            onClick={() => handleClick(item)}
            className="text-primary text-common cursor-pointer duration-100 hover:border-b hover:border-b-primary"
          >
            View More
          </span>
        )}
      </div>
    </div>
  )
}

export default ChangeLogCard
