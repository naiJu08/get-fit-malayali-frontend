import React from 'react'
import { Link } from 'react-router-dom'

import { router_config } from '../../../configs/route.config'

type DataProps = {
  label: string
  value?: string
  id?: string
  slug: string
}

type Props = {
  data: DataProps[]
}
const FormLinkView: React.FC<Props> = ({ data }) => {
  const generateLink = (id: string, slug: string) => {
    switch (slug) {
      case 'lead':
        return `${router_config.LEADS.path}/${id}/summary`
      case 'deal':
        return `${router_config.DEALS.path}/${id}/summary`
      case 'prospect':
        return `${router_config.PROSPECTS.path}/${id}/summary`
      case 'quote':
        return `${router_config.QUOTES.path}/${id}/summary`
      case 'account':
        return `${router_config.ACCOUNTS.path}/${id}/summary`
      case 'contact':
        return `${router_config.CONTACTS.path}/${id}/summary`
      case 'order':
        return `${router_config.SERVICE_AND_ORDERS_BY_ORDERS.path}/${id}/summary`
      default:
        return '#'
    }
  }
  return (
    <div className="grid grid-cols-2 gap-4">
      {data.map((item: any, i: number) => (
        <div key={`${i}`} className={`w-full`}>
          {item?.id && item.id !== '' && (
            <div className={'w-full'}>
              <div className=" ">
                <label className={`labels label-text`}>{item.label}</label>
              </div>
              {/* )} */}
              <div className={`relative flex items-center`}>
                <Link
                  className=" font-medium text-sm text-link cursor-pointer break-all"
                  to={generateLink(item.id, item.slug)}
                >
                  {item.value}
                </Link>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default FormLinkView
