import Icons from '../icons'
import { invoiceTableData } from './invoicetabledata'

function InvoiceTable() {
  return (
    <div className="w-full border border-t-0 px-5 py-6 rounded-b-lg">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-m font-semibold">Invoice Details</h4>

        <div className="flex gap-x-1 5 items-center ">
          <div className="w-6 h-6 bg-grey-light flex items-center justify-center rounded-full stroke-grey-strong cursor-pointer">
            <Icons name="expand-icon" />
          </div>
          <div className="w-6 h-6 bg-grey-light flex items-center justify-center rounded-full cursor-pointer">
            <Icons name="three_dot_horizontal" />
          </div>
        </div>
      </div>

      <div className="w-full border rounded ">
        <div className="flex justify-between flex-wrap items-center px-3 py-2.5">
          <p className="text-common font-medium">
            Showing <span>12</span> of <span>12113</span>
          </p>

          <div className="flex gap-4 items-center">
            <span className="text-common font-medium">Items per page</span>

            <select
              name=""
              id=""
              className="text-common border rounded-sm p-0.5"
            >
              <option value="10">10</option>
              <option value="10">10</option>
              <option value="10">10</option>
              <option value="10">10</option>
              <option value="10">10</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border-t-primaryAlt border-t border-b">
          <table className="min-w-full table-auto">
            <thead className="text-xs leading-4 font-bold text-sm bg-primaryThin text-left">
              <tr>
                <th className="px-2 py-2.5 min-w-5 whitespace-nowrap">
                  <input
                    className="w-4 h-4 cursor-pointer border-grey-light border outline-none"
                    type="checkbox"
                    name=""
                    id=""
                  />
                </th>
                <th className="px-2 py-2.5 min-w-5 whitespace-nowrap"></th>
                <th className="px-2 py-2.5 ">
                  <div className="flex justify-between whitespace-nowrap min-w-[145px]">
                    <span>Contact ID</span>
                    <Icons name="updown-arrow" />
                  </div>
                </th>
                <th className="px-2 py-2.5 whitespace-nowrap min-w-[145px] ">
                  <div className="flex justify-between">
                    <span>Created Date</span>
                    <Icons name="updown-arrow" />
                  </div>
                </th>
                <th className="px-2 py-2.5 whitespace-nowrap  min-w-[500px]">
                  <div className="flex justify-between">
                    <span>Account Name</span>
                    <Icons name="updown-arrow" />
                  </div>
                </th>
                <th className="px-2 py-2.5 whitespace-nowrap min-w-[145px] ">
                  <div className="flex justify-between">
                    <span>Account CRE</span>
                    <Icons name="updown-arrow" />
                  </div>
                </th>
                <th className="px-2 py-2.5 whitespace-nowrap min-w-[125px]">
                  <div className="flex justify-between">
                    <span>Active Orders</span>
                    <Icons name="updown-arrow" />
                  </div>
                </th>
                <th className="px-2 py-2.5 whitespace-nowrap min-w-[125px]">
                  <div className="flex justify-between">
                    <span>Amount Due</span>
                    <Icons name="updown-arrow" />
                  </div>
                </th>
                <th className="px-2 py-2.5 whitespace-nowrap min-w-[145px]">
                  <div className="flex justify-between">
                    <span>Communication</span>
                    <Icons name="updown-arrow" />
                  </div>
                </th>
                <th className="px-2 py-2.5 stroke-grey-strong">
                  <Icons name="settings" />
                </th>
              </tr>
            </thead>
            <tbody className="bg-white text-xs leading-4 divide-y divide-gray-light text-left font-medium">
              {invoiceTableData.map((item) => (
                <tr key={item.id}>
                  <td className="px-2 py-2.5 min-w-5 whitespace-nowrap">
                    <input
                      className="w-4 h-4 cursor-pointer border-grey-light border outline-none"
                      type="checkbox"
                      name=""
                      id=""
                    />
                  </td>
                  <td className="px-2 py-2.5 min-w-5 whitespace-nowrap">
                    <Icons name="exclamation-danger" />
                  </td>
                  <td className="px-2 py-2.5 text-primary underline decoration-primary whitespace-nowrap ">
                    {item.contact_id}
                  </td>
                  <td className="px-2 py-2.5 whitespace-nowrap">
                    {item.created_date}
                  </td>
                  <td className="px-2 py-2.5 text-primary underline decoration-primary whitespace-nowrap ">
                    {item.account_name}
                  </td>
                  <td className="px-2 py-2.5 whitespace-nowrap">
                    {item.account_cre}
                  </td>
                  <td className="px-2 py-2.5 text-right whitespace-nowrap">
                    <p className="leading-5">{item.active_orders.value1}</p>
                    <p className="leading-4 text-grey-medium">
                      ₹{item.active_orders.value2}
                    </p>
                  </td>
                  <td className="px-2 py-2.5 text-right whitespace-nowrap">
                    <p className="leading-5">$ {item.amount_due.value1}</p>
                    <p className="leading-4 text-grey-medium">
                      ₹ {item.amount_due.value2} INR
                    </p>
                  </td>
                  <td className="px-2 py-2.5 text-right whitespace-nowrap">
                    <div className="flex gap-3 justify-center">
                      <Icons className="cursor-pointer" name="phone" />
                      <Icons className="cursor-pointer" name="email" />
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-right whitespace-nowrap">
                    <Icons name="three_dot" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center flex-wrap px-3 py-2.5">
          <p className="text-common font-medium">
            Showing <span>12</span> of <span>12113</span>
          </p>

          <div className="flex gap-4 items-center">
            <span className="text-common font-medium">Items per page</span>

            <select
              name=""
              id=""
              className="text-common border rounded-sm p-0.5"
            >
              <option value="10">10</option>
              <option value="10">10</option>
              <option value="10">10</option>
              <option value="10">10</option>
              <option value="10">10</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoiceTable
