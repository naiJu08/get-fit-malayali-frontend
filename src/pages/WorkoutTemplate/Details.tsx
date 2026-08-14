import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import SmartTable from '../../components/common/table/SmartTable'
import Icons from '../../components/common/icons'
import Checkbox from '../../components/common/inputs/Checkbox'
import InfoBox from '../../components/app/alertBox/infoBox'
import Tab from '../../components/common/tab/Tab'
import { TabContainer } from '../../components/common'
import { getWorkoutTemplate } from './api'
import WorkoutTemplateForm from './create'
import WorkoutTemplateDayForm from './DayForm'
import CopyExercisesDialog, { CopyTargetType } from './CopyExercisesDialog'
import { calcWindowHeight } from '../../utilities/calcHeight'

export default function WorkoutTemplateDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [template, setTemplate] = useState<any>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'details' | 'days'>('days')
  const [editTemplateOpen, setEditTemplateOpen] = useState(false)
  const [editDay, setEditDay] = useState<any>(null)
  const [selectedDayIds, setSelectedDayIds] = useState<string[]>([])
  const [copyType, setCopyType] = useState<CopyTargetType | null>(null)
  const [daysPage, setDaysPage] = useState(1)
  const [daysPerPage, setDaysPerPage] = useState(10)
  const [daysMeta, setDaysMeta] = useState<any>(null)
  const loadTemplate = (page = daysPage, perPage = daysPerPage) => {
    if (!id) return
    getWorkoutTemplate(id, { page, per_page: perPage })
      .then((response: any) => {
        setTemplate(response?.workout_template ?? response)
        setDaysMeta(response?.days_meta)
      })
      .catch(() => setError('Failed to load workout template'))
  }
  useEffect(() => {
    setDaysPage(1)
    loadTemplate(1, daysPerPage)
  }, [id])
  if (error)
    return (
      <div className="p-6">
        <InfoBox content={error} />
      </div>
    )
  if (!template)
    return (
      <div className="p-6">
        <InfoBox content="Loading workout template..." />
      </div>
    )
  const days = Array.isArray(template.days) ? template.days : []
  const allDaysSelected =
    days.length > 0 && selectedDayIds.length === days.length
  const toggleAllDays = (checked: boolean) =>
    setSelectedDayIds(checked ? days.map((day: any) => String(day.id)) : [])
  const columns: any[] = [
    {
      title: (
        <Checkbox
          id="select-all-days"
          name="select-all-days"
          checked={allDaysSelected}
          intermediate={selectedDayIds.length > 0 && !allDaysSelected}
          handleChange={(event) => toggleAllDays(event.target.checked)}
        />
      ),
      field: 'select',
      colWidth: 64,
      resizable: false,
      align: 'center',
      customCell: true,
      renderCell: (row: any) => ({
        cell: (
          <Checkbox
            id={`select-day-${row.id}`}
            name={`select-day-${row.id}`}
            checked={selectedDayIds.includes(String(row.id))}
            handleChange={() =>
              setSelectedDayIds((current) =>
                current.includes(String(row.id))
                  ? current.filter((value) => value !== String(row.id))
                  : [...current, String(row.id)]
              )
            }
          />
        ),
      }),
    },
    {
      title: 'Title',
      field: 'title',
      customCell: true,
      renderCell: (row: any) => ({
        cell: (
          <button
            type="button"
            className="text-blue-600 hover:underline"
            onClick={() => navigate(`/workout-templates/${id}/day/${row.id}`)}
          >
            {row.title || `Day ${row.day_number}`}
          </button>
        ),
      }),
    },
    { title: 'Day', field: 'day_number' },
    { title: 'Exercises', field: 'exercises_count' },
    { title: 'Total Duration (mins)', field: 'total_duration' },
    { title: 'Description', field: 'description' },
  ]
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => navigate('/workout-templates')}
          aria-label="Back"
        >
          <Icons name="left-arrow-icon" />
        </button>
        <h1 className="text-xl font-semibold">
          Workout Template Details - {template.name}
        </h1>
      </div>
      <TabContainer
        data={[
          { id: 'details', label: 'Details' },
          { id: 'days', label: 'Workout Template' },
        ]}
        activeTab={activeTab}
        onClick={(item: any) =>
          setActiveTab(item.id === 'details' ? 'details' : 'days')
        }
      >
        <Tab id="details">
          <div className="flex justify-end mb-4">
            <button
              type="button"
              className="px-4 py-2 text-sm rounded btn-primary"
              onClick={() => setEditTemplateOpen(true)}
            >
              Edit Template
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border rounded-lg p-3 bg-white">
              <div className="text-xs text-gray-500 mb-1">Template Name</div>
              <div className="text-sm">{template.name || '--'}</div>
            </div>
            <div className="border rounded-lg p-3 bg-white">
              <div className="text-xs text-gray-500 mb-1">Intensity Level</div>
              <div className="text-sm">{template.intensity_level || '--'}</div>
            </div>
            <div className="border rounded-lg p-3 bg-white">
              <div className="text-xs text-gray-500 mb-1">Days</div>
              <div className="text-sm">{template.duration_days ?? '--'}</div>
            </div>
            <div className="border rounded-lg p-3 bg-white md:col-span-2 lg:col-span-3">
              <div className="text-xs text-gray-500 mb-1">Description</div>
              <div className="text-sm whitespace-pre-wrap">
                {template.description || '--'}
              </div>
            </div>
            <div className="border rounded-lg p-3 bg-white md:col-span-2 lg:col-span-3">
              <div className="text-xs text-gray-500 mb-1">Notes</div>
              <div className="text-sm whitespace-pre-wrap">
                {template.notes || '--'}
              </div>
            </div>
          </div>
        </Tab>
        <Tab id="days">
          <SmartTable
            height={
              days.length === 0 ? calcWindowHeight(218) : calcWindowHeight(200)
            }
            data={days}
            dataRowKey="id"
            toolbar
            title={template.name}
            toolbarExtra={
              selectedDayIds.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 whitespace-nowrap">
                    {selectedDayIds.length} day
                    {selectedDayIds.length === 1 ? '' : 's'} selected
                  </span>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs rounded-lg border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 transition-colors"
                    onClick={() => setCopyType('same_template')}
                  >
                    Copy to Same Template
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs rounded-lg border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 transition-colors"
                    onClick={() => setCopyType('other_template')}
                  >
                    Copy to Other Template
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs rounded-lg border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 transition-colors"
                    onClick={() => setCopyType('client')}
                  >
                    Copy to Client
                  </button>
                </div>
              ) : undefined
            }
            columns={columns}
            externalActions
            actionProps={[
              {
                icon: <Icons name="eye" />,
                title: 'View',
                toolTip: 'View',
                action: (row: any) =>
                  navigate(`/workout-templates/${id}/day/${row.id}`),
              },
              {
                icon: <Icons name="edit" />,
                title: 'Edit',
                toolTip: 'Edit',
                action: (row: any) => setEditDay(row),
              },
            ]}
            columnToggle
            pagination
            paginationProps={{
              currentPage: daysMeta?.current_page ?? daysPage,
              total: daysMeta?.total_count ?? days.length,
              rowsPerPage: daysMeta?.per_page ?? daysPerPage,
              totalPages: daysMeta?.total_pages ?? 1,
              onPagination: (page: number) => {
                setDaysPage(page)
                loadTemplate(page, daysPerPage)
              },
              onRowsPerPage: (rows: string | number) => {
                const next = Number(rows)
                setDaysPerPage(next)
                setDaysPage(1)
                loadTemplate(1, next)
              },
              dropOptions: [10, 20, 30, 50, 100],
            }}
            emptyTitle="No days to display"
          />
        </Tab>
      </TabContainer>
      <WorkoutTemplateForm
        isOpen={editTemplateOpen}
        handleClose={() => setEditTemplateOpen(false)}
        edit
        rowData={template}
        onSuccess={loadTemplate}
      />
      <WorkoutTemplateDayForm
        isOpen={!!editDay}
        handleClose={() => setEditDay(null)}
        rowData={editDay}
        onSuccess={loadTemplate}
      />
      {copyType && (
        <CopyExercisesDialog
          open={!!copyType}
          onClose={() => setCopyType(null)}
          sourceTemplateId={id as string}
          sourceDays={days}
          selectedSourceDayIds={selectedDayIds}
          targetType={copyType}
          onSuccess={() => {
            setSelectedDayIds([])
            loadTemplate()
          }}
        />
      )}
    </div>
  )
}
