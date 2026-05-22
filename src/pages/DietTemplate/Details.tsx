import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'

import Icons from '../../components/common/icons'
import { getTemplateDetails } from './api'
import { Tab, TabContainer } from '../../components/common/tab'
import DetailTab from './Details/DetailTab'
import DietPlanTab from './Details/DietPlanTab'
import CreateDietTemplate from './create'

export default function DietTemplateDetails() {
  const params = useParams()
  const id = (params as any)?.id
  const navigate = useNavigate()
  const location = useLocation()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [editModalOpen, setEditModalOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        setLoading(true)
        const res = await getTemplateDetails(String(id))
        if (!mounted) return
        setData(res)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.response?.data?.message || 'Failed to load user')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }
    if (id) run()
    return () => {
      mounted = false
    }
  }, [id])

  const template = data?.diet_plan_template || data || {}

  const tabs = useMemo(
    () => [
      { id: 'details', label: 'Details' },
      { id: 'diet-plan', label: 'Diet Plan' },
    ],
    []
  )

  const allowedTabIds = useMemo(() => tabs.map((tab) => tab.id), [tabs])
  const trimmedPath = (location.pathname || '').replace(/\/+$/, '')
  const segments = trimmedPath.split('/')
  const lastSegment = segments[segments.length - 1]
  const derivedTab = lastSegment === String(id) ? 'details' : lastSegment
  const activeTab = allowedTabIds.includes(derivedTab) ? derivedTab : 'details'

  useEffect(() => {
    if (location.pathname === `/diet-template/${id}/details`) {
      navigate(`/diet-template/${id}`, { replace: true })
    }
  }, [id, location.pathname, navigate])

  return (
    <>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/diet-template')}
              aria-label="Back"
            >
              <Icons name="left-arrow-icon" />
            </button>
            <h1 className="text-xl font-semibold">Diet Template Details</h1>
          </div>
        </div>

        <TabContainer
          data={tabs}
          activeTab={activeTab}
          onClick={(tab) => {
            const basePath = `/diet-template/${id}`
            if (tab.id === 'details') navigate(basePath)
            else navigate(`${basePath}/${tab.id}`)
          }}
        >
          <Tab id="details">
            <DetailTab
              template={template}
              loading={loading}
              error={error}
              onEdit={() => setEditModalOpen(true)}
            />
          </Tab>
          <Tab id="diet-plan">
            <DietPlanTab template={template} loading={loading} error={error} />
          </Tab>
        </TabContainer>
      </div>

      <CreateDietTemplate
        isDrawerOpen={editModalOpen}
        handleClose={() => setEditModalOpen(false)}
        handleRefresh={() => {
          getTemplateDetails(String(id)).then((res) => setData(res))
        }}
        edit
        rowData={template}
      />
    </>
  )
}
