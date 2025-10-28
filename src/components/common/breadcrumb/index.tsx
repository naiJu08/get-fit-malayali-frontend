import { Link } from 'react-router-dom'

import { router_config } from '../../../configs/route.config'
import { useAppStore } from '../../../store/appStore'

export default function CustomBreadCrumbs() {
  const { activeRouteSlug } = useAppStore()

  if (!activeRouteSlug) {
    return null
  }
  const data = router_config[activeRouteSlug]['breadcrumb']
  return (
    <div className={'dark:text-white text-black px-4 '}>
      <div className=" gap-2" key={activeRouteSlug}>
        <ul className="breadcrumb-navigation" aria-label="breadcrumb">
          {data &&
            data.length &&
            data.map((item, i) => {
              return (
                <>
                  {data.length !== i + 1 &&
                  !router_config[item]?.isDetails &&
                  router_config[item]?.path ? (
                    <li key={i}>
                      <>
                        <Link
                          key={i}
                          className={
                            'dark:text-white  text-xxs text-secondary font-semibold '
                          }
                          to={
                            router_config[item].pathOverride ??
                            (router_config[item].path as string)
                          }
                        >
                          {router_config[item]?.label}
                        </Link>
                      </>
                    </li>
                  ) : (
                    <li
                      key={i}
                      className={
                        'dark:text-white  text-xxs text-secondary font-semibold'
                      }
                    >
                      {router_config[item]?.label}
                    </li>
                  )}
                </>
              )
            })}
        </ul>
      </div>
    </div>
  )
}
