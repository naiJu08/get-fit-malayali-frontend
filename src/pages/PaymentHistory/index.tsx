import SmartTable from '../../components/common/table/SmartTable'
import { useEffect, useRef, useState } from 'react'
import { TableColumns } from '../../common/types'
import InfoBox from '../../components/app/alertBox/infoBox'
import DynamicDropdown from '../../components/common/DynamicDropdown'
import ListingHeader from '../../components/common/ListingTiles'
import { useAdminUserFilterStore } from '../../store/filterSore/adminUserStore'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { getSortedColumnName } from '../../utilities/parsers'
import { handleReturnEmptyMsg } from '../../utilities/validation'
import { getData } from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import { useAdminUser, DISABLE_NONLOGIN_APIS } from './api'
import { getColumns } from './columns'
import { useLocation, useNavigate } from 'react-router-dom'
import Icons from '../../components/common/icons'
import { getAdminDetails } from '../AdminUser/api'
import moment from 'moment'
const generateInvoice = async (row: any) => {
  // Dynamically import jspdf and html2canvas
  const { default: jsPDF } = await import('jspdf')
  const { default: html2canvas } = await import('html2canvas')

  // Fetch complete user details
  let userDetails = {
    name: row?.user_name || 'N/A',
    userId: row?.user_id || 'N/A',
    email: 'N/A',
    phone: 'N/A',
    dateOfBirth: 'N/A',
    gender: 'N/A',
    address: 'N/A',
    state: 'N/A',
    ethnicity: 'N/A',
  }

  try {
    if (row?.user_id) {
      const userResponse = await getAdminDetails(String(row.user_id))
      const user = userResponse?.user || userResponse
      if (user) {
        userDetails = {
          name: user?.name || user?.display_name || row?.user_name || 'N/A',
          userId: user?.id || row?.user_id || 'N/A',
          email: user?.email || user?.username || 'N/A',
          phone: user?.phone || 'N/A',
          dateOfBirth: user?.date_of_birth
            ? moment(user.date_of_birth).format('YYYY-MM-DD')
            : 'N/A',
          gender: user?.gender,
          address: user?.address || 'N/A',
          state: user?.state || 'N/A',
          ethnicity: user?.ethnicity || 'N/A',
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch user details for invoice:', error)
    // Continue with basic user details if API call fails
  }

  const invoiceData = {
    invoiceNumber: `INV-${row?.id || Date.now()}`,
    invoiceDate: moment().format('DD-MM-YYYY'),
    subscriptionDetails: {
      planName: row?.plan_name || 'N/A',
      startDate: row?.start_date
        ? moment(row.start_date).format('DD-MM-YYYY')
        : 'N/A',
      endDate: row?.end_date
        ? moment(row.end_date).format('DD-MM-YYYY')
        : 'N/A',
      fees: row?.plan_fees || '0',
      status: row?.status || 'N/A',
    },
    userDetails,
    company: {
      name: 'Get Fit Malayali',
      logo: window.location.origin + '/logo-hori-removebg-preview.png',
      address: 'Kerala, India',
      email: 'support@getfitmalayali.com',
      phone: '+91 98765 43210',
    },
    totals: {
      subtotal: row?.plan_fees || '0',
      tax: '0',
      total: row?.plan_fees || '0',
    },
  }

  const invoiceHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoiceData.invoiceNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: white;
          padding: 20px;
          color: #333;
        }
        
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border: 1px solid #ddd;
          overflow: hidden;
        }
        
        .invoice-header {
          background: #e0f2fe;
          color: #0f172a;
          padding: 30px;
          position: relative;
        }
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .company-info {
          flex: 1;
        }
        
        .company-logo {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .company-logo img {
          height: 40px;
          vertical-align: middle;
        }
        
        .company-address {
          font-size: 14px;
          color: #475569;
        }
        
        .invoice-info {
          text-align: right;
        }
        
        .invoice-title {
          font-size: 36px;
          font-weight: bold;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .invoice-meta {
          display: flex;
          flex-direction: column;
          gap: 5px;
          font-size: 14px;
        }
        
        .content-section {
          padding: 30px;
        }
        
        .addresses-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 30px;
        }
        
        .address-box {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #38bdf8;
        }
        
        .address-title {
          font-size: 16px;
          font-weight: bold;
          color: #0369a1;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .address-item {
          margin-bottom: 8px;
          font-size: 14px;
        }
        
        .address-label {
          font-weight: 600;
          color: #555;
          display: inline-block;
          min-width: 80px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          background: white;
          border: 1px solid #ddd;
        }
        
        .items-table th {
          background: #bae6fd;
          color: #0f172a;
          padding: 15px;
          text-align: left;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 1px;
        }
        
        .items-table td {
          padding: 15px;
          border-bottom: 1px solid #eee;
          font-size: 14px;
        }
        
        .items-table tr:last-child td {
          border-bottom: none;
        }
        
        .summary-section {
          background: #f0f9ff;
          padding: 25px;
          border-radius: 8px;
          margin-top: 30px;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          font-size: 14px;
        }
        
        .summary-row.total {
          font-size: 18px;
          font-weight: bold;
          color: #0369a1;
          padding-top: 10px;
          border-top: 2px solid #38bdf8;
        }
        
        .footer {
          background: #f8f9fa;
          padding: 20px 30px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #eee;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container" id="invoice-content">
        <div class="invoice-header">
          <div class="header-content">
            <div class="company-info">
              <div class="company-logo">
                <img src="${invoiceData.company.logo}" alt="Get Fit Malayali" onerror="this.style.display='none'"/>
              </div>
              <div class="company-address">
                ${invoiceData.company.address}<br>
                ${invoiceData.company.email}<br>
                ${invoiceData.company.phone}
              </div>
            </div>
            <div class="invoice-info">
              <div class="invoice-title">Invoice</div>
              <div class="invoice-meta">
                <div><strong>Invoice #:</strong> ${invoiceData.invoiceNumber}</div>
                <div><strong>Date:</strong> ${invoiceData.invoiceDate}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="content-section">
          <div class="addresses-section">
            <div class="address-box">
              <div class="address-title">Bill To</div>
              <div class="address-item">
                <span class="address-label">Name:</span> ${invoiceData.userDetails.name}
              </div>
              <div class="address-item">
                <span class="address-label">Email:</span> ${invoiceData.userDetails.email}
              </div>
              <div class="address-item">
                <span class="address-label">Phone:</span> ${invoiceData.userDetails.phone}
              </div>
              <div class="address-item">
                <span class="address-label">State:</span> ${invoiceData.userDetails.state}
              </div>
              <div class="address-item">
                <span class="address-label">Nationality:</span> ${invoiceData.userDetails.ethnicity}
              </div>
            </div>
            
            <div class="address-box">
              <div class="address-title">Subscription Details</div>
              <div class="address-item">
                <span class="address-label">Plan:</span> ${invoiceData.subscriptionDetails.planName}
              </div>
              <div class="address-item">
                <span class="address-label">Start Date:</span> ${invoiceData.subscriptionDetails.startDate}
              </div>
              <div class="address-item">
                <span class="address-label">End Date:</span> ${invoiceData.subscriptionDetails.endDate}
              </div>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Item & Description</th>
                <th>Period</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>${invoiceData.subscriptionDetails.planName}</strong><br>
                  <small>Subscription Plan</small>
                </td>
                <td>${invoiceData.subscriptionDetails.startDate} to ${invoiceData.subscriptionDetails.endDate}</td>
                <td><strong>₹${invoiceData.totals.subtotal}</strong></td>
              </tr>
            </tbody>
          </table>
          
          <div class="summary-section">
            <div class="summary-row">
              <span>Sub Total:</span>
              <span>₹${invoiceData.totals.subtotal}</span>
            </div>
            <div class="summary-row">
              <span>Tax:</span>
              <span>₹${invoiceData.totals.tax}</span>
            </div>
            <div class="summary-row total">
              <span>Total Amount:</span>
              <span>₹${invoiceData.totals.total}</span>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>This is a computer-generated invoice and is valid without signature.</p>
        </div>
      </div>
    </body>
    </html>
  `

  // Create a temporary container to render the HTML
  const tempContainer = document.createElement('div')
  tempContainer.style.position = 'absolute'
  tempContainer.style.left = '-9999px'
  tempContainer.style.top = '0'
  tempContainer.innerHTML = invoiceHtml
  document.body.appendChild(tempContainer)

  try {
    // Wait for images to load
    const images = tempContainer.querySelectorAll('img')
    await Promise.all(
      Array.from(images).map((img) => {
        return new Promise((resolve) => {
          if (img.complete) {
            resolve(null)
          } else {
            img.onload = resolve
            img.onerror = resolve
          }
        })
      })
    )

    // Generate PDF
    const canvas = await html2canvas(
      tempContainer.querySelector('#invoice-content') as HTMLElement,
      {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      }
    )

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')

    const imgWidth = 210
    const pageHeight = 295
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(`invoice-${invoiceData.invoiceNumber}.pdf`)
  } catch (error) {
    console.error('Error generating PDF:', error)
    // Fallback to HTML download if PDF generation fails
    const blob = new Blob([invoiceHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice-${invoiceData.invoiceNumber}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } finally {
    // Clean up temporary container
    document.body.removeChild(tempContainer)
  }
}

export default function Subscriptions() {
  const navigate = useNavigate()
  const [columns, setColumns] = useState<TableColumns[]>([])
  const [planIdFilter, setPlanIdFilter] = useState<string>('')
  const [planLabel, setPlanLabel] = useState<string>('All Plans')
  const [plansCache, setPlansCache] = useState<Record<string, string>>({})
  const location = useLocation()
  const { pageParams, setPageParams } = useAdminUserFilterStore()
  const { page, page_size, search, ordering, filters } = pageParams
  const searchParams = {
    page: page,
    per_page: page_size,
    search: search,
    ordering: ordering,
    ...filters,
  }
  useEffect(() => {
    if (pageParams?.search) {
      setPageParams({ ...pageParams, search: '', page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const didInitRef = useRef(false)
  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true
      setPlanIdFilter('')
      setPlanLabel('All Plans')
      setPageParams({ ...pageParams, search: '', filters: {}, page: 1 })
    }
  }, [])

  useEffect(() => {
    const planFromStore = (filters as any)?.plan_id
    setPlanIdFilter(planFromStore ? String(planFromStore) : '')
    if (planFromStore) {
      const cached = plansCache[String(planFromStore)]
      if (cached) {
        setPlanLabel(cached)
      } else {
        resolvePlanLabel(planFromStore)
      }
    } else {
      setPlanLabel('All Plans')
    }
  }, [filters])
  useEffect(() => {
    setPageParams({
      ...pageParams,
      page: 1,
      search: '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, setPageParams])
  const resolvePlanLabel = async (id?: number | string) => {
    if (!id) {
      setPlanLabel('All Plans')
      return
    }
    try {
      const res: any = await getData(`${apiUrl.PLANS}/${id}`)
      const name =
        res?.name ?? res?.plan_name ?? res?.data?.name ?? res?.data?.plan_name
      if (name) setPlanLabel(String(name))
    } catch {}
  }

  const { data, isFetching } = useAdminUser(searchParams)
  const onChangePage = (row: number) => {
    setPageParams({
      ...pageParams,
      page: row,
    })
  }
  const onChangeRowsPerPage = (count: number | string) => {
    setPageParams({
      ...pageParams,
      page_size: count,
      page: 1,
    })
  }
  useEffect(() => {
    setColumns(getColumns(navigate))
  }, [])

  const handleSeach = (key?: string) => {
    setPageParams({
      ...pageParams,
      search: key as string,
      page: 1,
    })
  }

  const applyPlanFilter = (val?: string) => {
    const value = typeof val === 'string' ? val : planIdFilter
    const nextFilters: any = { ...(pageParams?.filters || {}) }
    if (value?.trim()) {
      nextFilters.plan_id = Number(value)
    } else {
      delete nextFilters.plan_id
    }
    setPageParams({
      ...pageParams,
      filters: nextFilters,
      page: 1,
    })
  }

  // status filter removed

  const getPlansDropdown = async (search: string, pageNum: number) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('per_page', '1000')
    if (pageNum) params.set('page', String(pageNum))
    const url = `${apiUrl.PLANS}?${params.toString()}`
    const res = await getData(url)
    const items: any[] = Array.isArray(res)
      ? (res as any[])
      : (res?.items ?? res?.plans ?? [])
    const mapped = items.map((p: any) => ({
      id: p?.id,
      value: p?.name ?? p?.plan_name ?? 'Plan',
    }))
    const nextCache: Record<string, string> = { ...plansCache }
    for (const it of mapped) {
      if (it?.id != null) nextCache[String(it.id)] = it.value
    }
    setPlansCache(nextCache)
    return [{ id: null, value: 'All Plans' }, ...mapped]
  }

  const basicData = {
    title: 'Payment History',
    icon: 'paymentapproval-icon',
  }

  const handleSort = (orderColumn: any, orderDirection: any) => {
    setPageParams({
      ...pageParams,
      sortColumn: orderColumn,
      sortType: orderDirection,
      ordering: getSortedColumnName(orderColumn, orderDirection),
    })
  }

  // No actions or destructive operations on this page
  return (
    <div>
      {DISABLE_NONLOGIN_APIS ? (
        <div className="p-6">
          <InfoBox content={'This section is disabled for this build.'} />
        </div>
      ) : (
        <>
          <ListingHeader data={basicData} checkPermission={false} />
          <div className=" p-4">
            <SmartTable
              data={data?.items ?? []}
              dataRowKey="id"
              toolbar={true}
              search={true}
              searchPlaceholder="Search client Name"
              searchValue={pageParams?.search || ''}
              onSearchChange={(val) =>
                setPageParams({ ...pageParams, search: val, page: 1 })
              }
              onSearch={(val) => handleSeach(val)}
              toolbarExtra={
                <div className="flex items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-600">Plan</label>
                    <div className="w-64 flex flex-col gap-1 z-20 border p-[12px] rounded-lg bg-white">
                      <DynamicDropdown
                        key={`plan-dd-${planIdFilter || 'all'}-${planLabel}`}
                        tileItem={{ label: 'Plan', value: planLabel }}
                        value={planIdFilter}
                        getData={getPlansDropdown}
                        setUpdateCREId={(id: any) => {
                          const v = id ? String(id) : ''
                          setPlanIdFilter(v)
                          if (v) {
                            const cached = plansCache?.[v]
                            if (cached) setPlanLabel(cached)
                          } else {
                            setPlanLabel('All Plans')
                          }
                          applyPlanFilter(v)
                          if (v && !plansCache?.[v]) resolvePlanLabel(v)
                        }}
                      />
                    </div>
                  </div>
                </div>
              }
              height={
                data?.items?.length === 0
                  ? calcWindowHeight(218)
                  : calcWindowHeight(150)
              }
              isLoading={isFetching}
              sortType={pageParams.sortType as any}
              sortColumn={pageParams.sortColumn as any}
              handleColumnSort={handleSort}
              emptyTitle="No records to display"
              emptySubTitle={handleReturnEmptyMsg(search)}
              columns={columns}
              pagination={true}
              paginationProps={{
                onPagination: onChangePage,
                total: data?.total ?? 0,
                currentPage: pageParams?.page ?? 1,
                rowsPerPage: Number(pageParams?.page_size ?? 10),
                onRowsPerPage: onChangeRowsPerPage,
                dropOptions: [10, 20, 30, 50, 100],
              }}
              actionProps={[
                {
                  icon: <Icons name="download" />,
                  action: (row: any) => generateInvoice(row),
                  title: 'Download Invoice',
                  toolTip: 'Download Invoice',
                },
              ]}
              columnToggle
              externalActions={true}
            />
          </div>

          {/* No modals/actions for Payment History */}
        </>
      )}
    </div>
  )
}
