import Icons from '../components/common/icons'
import { BreadCrumList } from './breadcrumbList'

const Footer = () => {
  return (
    <footer className="fixed bottom-0 px-8 py-1 bg-bgWhite text-xs w-full border-t border-formBorder">
      <ul className="flex gap-3">
        {BreadCrumList.map(
          (item, index) =>
            index > 0 && (
              <li key={index} className="flex gap-3 items-center">
                <span>{item.name}</span>
                <div className="h-4 w-4">
                  <Icons name="breadcrumbs-arrow" />
                </div>
              </li>
            )
        )}
      </ul>

      {/* <CustomBreadCrumbs/> */}
    </footer>
  )
}

export default Footer
