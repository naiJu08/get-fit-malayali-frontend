import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import InfoBox from '../../components/app/alertBox/infoBox'
import Icons from '../../components/common/icons'
import SmartTable from '../../components/common/table/SmartTable'
import { TableColumns } from '../../common/types'
import { getAssessmentCategoryDetails } from './api'
import CreateAssessmentCategory from './create'

const safeValue = (value: any) => {
  if (value === 0 || value === '0') return value
  if (value === null || value === undefined) return '-'
  if (typeof value === 'string' && value.trim() === '') return '-'
  return value
}

const isActiveValue = (value: any) =>
  value === true ||
  value === 1 ||
  value === '1' ||
  String(value ?? '').toLowerCase() === 'active' ||
  String(value ?? '').toLowerCase() === 'true'

export default function AssessmentCategoryDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditOpen, setEditOpen] = useState(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const loadDetails = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      const res = await getAssessmentCategoryDetails(String(id))
      if (!isMountedRef.current) return
      setData(res)
      setError('')
    } catch (e: any) {
      if (!isMountedRef.current) return
      setError(
        e?.response?.data?.message || 'Failed to load assessment category'
      )
    } finally {
      if (!isMountedRef.current) return
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadDetails()
  }, [loadDetails])

  const assessmentCategory = data?.assessment_category || data || {}
  const questions = Array.isArray(assessmentCategory?.assessment_questions)
    ? assessmentCategory.assessment_questions
    : []

  const questionColumns: TableColumns[] = [
    {
      title: 'Question',
      field: 'question_text',
      customCell: true,
      sortable: false,
      resizable: true,
      isVisible: true,
      renderCell: (row: any) => ({
        cell: <span>{safeValue(row?.question_text)}</span>,
        toolTip: row?.question_text,
      }),
    },
    // {
    //   title: 'Status',
    //   field: 'active',
    //   customCell: true,
    //   sortable: false,
    //   resizable: true,
    //   isVisible: true,
    //   renderCell: (row: any) => {
    //     const isActive = isActiveValue(row?.active)
    //     const label = isActive ? 'Active' : 'Inactive'
    //     return {
    //       cell: (
    //         <span
    //           className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
    //             isActive
    //               ? 'bg-green-100 text-green-700'
    //               : 'bg-red-100 text-red-700'
    //           }`}
    //         >
    //           {label}
    //         </span>
    //       ),
    //       toolTip: label,
    //     }
    //   },
    // },
  ]

  return (
    <>
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/assessment-category')}
              aria-label="Back"
            >
              <Icons name="left-arrow-icon" />
            </button>
            <h1 className="text-xl font-semibold">
              Assessment Category Details
            </h1>
          </div>
          {!loading && !error && (
            <button
              type="button"
              className="inline-flex items-center rounded-lg bg-primaryGreen px-4 py-2 text-sm font-medium text-white hover:bg-primaryGreen/90 focus:outline-none focus:ring-2 focus:ring-primaryGreen/50"
              onClick={() => setEditOpen(true)}
            >
              <Icons name="edit" />
              Edit Assessment Category
            </button>
          )}
        </div>

        {loading && (
          <div className="p-6">
            <InfoBox content="Loading assessment category details..." />
          </div>
        )}

        {error && !loading && (
          <div className="p-6">
            <InfoBox content={error} />
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DetailItem
                label="Category Name"
                value={assessmentCategory?.name}
              />
              <StatusDetailItem
                label="Status"
                value={assessmentCategory?.active}
              />
              <DetailItem
                label="Description"
                value={assessmentCategory?.description}
              />
            </div>

            <div>
              <h2 className="mb-3 text-base font-semibold text-gray-900">
                Assessment Questions
              </h2>
              <SmartTable
                data={questions}
                dataRowKey="id"
                toolbar={false}
                search={false}
                height={questions.length === 0 ? 360 : 650}
                emptyTitle="No questions to display"
                emptySubTitle=""
                columns={questionColumns}
                pagination={false}
              />
            </div>
          </div>
        )}
      </div>

      <CreateAssessmentCategory
        isDrawerOpen={isEditOpen}
        handleClose={() => {
          setEditOpen(false)
          loadDetails()
        }}
        edit
        rowData={assessmentCategory}
      />
    </>
  )
}

function DetailItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="mb-1 text-xs text-gray-500">{label}</div>
      <div className="text-sm">{safeValue(value)}</div>
    </div>
  )
}

function StatusDetailItem({ label, value }: { label: string; value: any }) {
  const isActive = isActiveValue(value)
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="mb-1 text-xs text-gray-500">{label}</div>
      <div className="text-sm">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  )
}
