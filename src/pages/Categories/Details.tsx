import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import Icons from '../../components/common/icons'
import InfoBox from '../../components/app/alertBox/infoBox'
import SmartTable from '../../components/common/table/SmartTable'
import { DialogModal } from '../../components/common'
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal'
import { TableColumns } from '../../common/types'
import { useSnackbarManager } from '../../components/common/snackbar'
import {
  deleteCategories,
  getCategoriesDetails,
  getSubCategories,
  useCreateCategories,
  useUpdateCategories,
} from './api'
import { CategorySchema, formSchema } from './create/schema'
import { calcWindowHeight } from '../../utilities/calcHeight'
import FormBuilder from '../../components/app/formBuilder'

const SUBCATEGORY_ROWS = 10

export default function CategoryDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbarManager()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [subMeta, setSubMeta] = useState<any>({})
  const [subLoading, setSubLoading] = useState(false)
  const [subError, setSubError] = useState('')
  const [subPage, setSubPage] = useState(1)
  const [subRowsPerPage, setSubRowsPerPage] = useState(SUBCATEGORY_ROWS)
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false)
  const [selectedSubcategory, setSelectedSubcategory] = useState<any>(null)
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<any>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeletingSubcategory, setIsDeletingSubcategory] = useState(false)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        setLoading(true)
        const res = await getCategoriesDetails(String(id))
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

  const fetchSubCategories = useCallback(
    async (page = subPage, perPage = subRowsPerPage) => {
      if (!id) return
      setSubLoading(true)
      setSubError('')
      try {
        const res = await getSubCategories(String(id), {
          page,
          per_page: perPage,
        })

        const derivedSubcategories = (() => {
          if (Array.isArray(res?.categories)) {
            const parentCategory = res.categories.find(
              (cat: any) => Number(cat?.id) === Number(id)
            )
            if (Array.isArray(parentCategory?.subcategories)) {
              return parentCategory.subcategories
            }
          }
          if (Array.isArray(res?.category?.subcategories)) {
            return res.category.subcategories
          }
          if (Array.isArray(res?.subcategories)) {
            return res.subcategories
          }
          return []
        })()

        setSubcategories(derivedSubcategories)
        setSubMeta({
          total_count: derivedSubcategories.length,
          current_page: 1,
          total_pages: 1,
        })
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.detail ||
          'Failed to load subcategories'
        setSubError(msg)
        enqueueSnackbar(msg, { variant: 'error' })
      } finally {
        setSubLoading(false)
      }
    },
    [enqueueSnackbar, id, subPage, subRowsPerPage]
  )

  useEffect(() => {
    if (!id) return
    setSubPage(1)
    setSubRowsPerPage(SUBCATEGORY_ROWS)
  }, [id])

  useEffect(() => {
    if (id) {
      fetchSubCategories(subPage, subRowsPerPage)
    }
  }, [fetchSubCategories, id, subPage, subRowsPerPage])

  const category = data?.category || data || {}

  const subcategoryColumns: TableColumns[] = useMemo(
    () => [
      {
        title: 'Name',
        field: 'name',
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <span className="font-medium">{capitalizeFirst(row?.name)}</span>
          ),
        }),
        sortable: false,
      },
      {
        title: 'Description',
        field: 'description',
        sortable: false,
        renderCell: (row: any) => ({
          cell: <span>{safeStr(row?.description)}</span>,
        }),
      },
    ],
    []
  )

  const methods = useForm<CategorySchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })
  const { handleSubmit, reset } = methods

  const closeSubcategoryModal = () => {
    setIsSubcategoryModalOpen(false)
    setSelectedSubcategory(null)
    reset()
  }

  const onSubcategorySuccess = () => {
    closeSubcategoryModal()
    fetchSubCategories(1, subRowsPerPage)
  }

  const { mutate: createSubcategory, isLoading: isCreatingSubcategory } =
    useCreateCategories(
      onSubcategorySuccess,
      'Subcategory created successfully'
    )
  const { mutate: updateSubcategory, isLoading: isUpdatingSubcategory } =
    useUpdateCategories(
      onSubcategorySuccess,
      'Subcategory updated successfully'
    )

  const isEditingSubcategory = Boolean(selectedSubcategory?.id)

  const handleSubcategorySubmit = handleSubmit((values) => {
    if (!id) {
      enqueueSnackbar('Invalid category', { variant: 'error' })
      return
    }

    const payload = {
      category: {
        name: values.name,
        description: values.description,
        parent_id: Number(id),
      },
    }

    if (isEditingSubcategory && selectedSubcategory?.id) {
      updateSubcategory({ id: selectedSubcategory.id, data: payload })
    } else {
      createSubcategory(payload)
    }
  })

  const handleCreateSubcategoryClick = () => {
    setSelectedSubcategory(null)
    reset({
      name: '',
      description: '',
    })
    setIsSubcategoryModalOpen(true)
  }

  const handleEditSubcategory = (row: any) => {
    setSelectedSubcategory(row)
    reset({
      name: row?.name ?? '',
      description: row?.description ?? '',
    })
    setIsSubcategoryModalOpen(true)
  }

  const openDeleteModal = (row: any) => {
    setSubcategoryToDelete(row)
    setIsDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    if (isDeletingSubcategory) return
    setIsDeleteModalOpen(false)
    setSubcategoryToDelete(null)
  }

  const handleDeleteSubcategory = async () => {
    if (!subcategoryToDelete?.id) return
    try {
      setIsDeletingSubcategory(true)
      await deleteCategories(String(subcategoryToDelete.id))
      enqueueSnackbar('Subcategory deleted successfully', {
        variant: 'success',
      })
      closeDeleteModal()
      fetchSubCategories(1, subRowsPerPage)
    } catch (err: any) {
      enqueueSnackbar(
        err?.response?.data?.message || 'Failed to delete subcategory',
        { variant: 'error' }
      )
    } finally {
      setIsDeletingSubcategory(false)
    }
  }

  const handleSubPageChange = (pageNumber: number) => {
    setSubPage(pageNumber)
  }

  const handleSubRowsPerPage = (count: number | string) => {
    const next = Number(count) || SUBCATEGORY_ROWS
    setSubRowsPerPage(next)
    setSubPage(1)
  }

  return (
    <>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/categories')} aria-label="Back">
              <Icons name="left-arrow-icon" />
            </button>
            <h1 className="text-xl font-semibold">Category Details</h1>
          </div>
        </div>

        {loading && (
          <div className="p-6">
            <InfoBox content="Loading user details..." />
          </div>
        )}
        {error && !loading && (
          <div className="p-6">
            <InfoBox content={error} />
          </div>
        )}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem
                label="Name"
                value={capitalizeFirst(category?.name)}
              />
              <DetailItem label="Description" value={category?.description} />
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Subcategories</h2>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg bg-primaryGreen text-white px-4 py-2 text-sm font-medium transition-colors"
                  onClick={handleCreateSubcategoryClick}
                  disabled={!id}
                >
                  <Icons name="plus" />
                  <span className="ml-2">Create Subcategory</span>
                </button>
              </div>

              {subError && <InfoBox content={subError} />}

              <SmartTable
                data={subcategories}
                columns={subcategoryColumns}
                dataRowKey="id"
                isLoading={subLoading}
                toolbar={false}
                search={false}
                columnToggle={false}
                emptyTitle="No subcategories yet"
                emptySubTitle="Create your first subcategory to organize workouts better."
                pagination
                height={
                  (subcategories?.length ?? 0) === 0
                    ? calcWindowHeight(218)
                    : calcWindowHeight(300)
                }
                paginationProps={{
                  onPagination: handleSubPageChange,
                  total: subMeta?.total_count ?? subcategories.length,
                  currentPage:
                    typeof subMeta?.current_page === 'number'
                      ? subMeta.current_page
                      : subPage,
                  rowsPerPage: subRowsPerPage,
                  onRowsPerPage: handleSubRowsPerPage,
                  totalPages: (() => {
                    const totalCount =
                      subMeta?.total_count ?? subcategories.length ?? 0
                    const fallbackPages = Math.ceil(
                      totalCount / Math.max(subRowsPerPage, 1)
                    )
                    return Math.max(
                      1,
                      (subMeta?.total_pages as number | undefined) ??
                        (Number.isFinite(fallbackPages) && fallbackPages > 0
                          ? fallbackPages
                          : 1)
                    )
                  })(),
                  dropOptions: [5, 10, 20, 30],
                }}
                externalActions
                actionProps={[
                  {
                    icon: <Icons name="edit" />,
                    title: 'Edit',
                    toolTip: 'Edit Subcategory',
                    action: handleEditSubcategory,
                  },
                  {
                    icon: <Icons name="delete" />,
                    title: 'Delete',
                    toolTip: 'Delete Subcategory',
                    action: openDeleteModal,
                  },
                ]}
              />
            </div>
          </>
        )}
      </div>

      <DialogModal
        isOpen={isSubcategoryModalOpen}
        onClose={closeSubcategoryModal}
        title={isEditingSubcategory ? 'Edit Subcategory' : 'Create Subcategory'}
        actionLabel={isEditingSubcategory ? 'Update' : 'Create'}
        actionLoader={
          isEditingSubcategory ? isUpdatingSubcategory : isCreatingSubcategory
        }
        onSubmit={handleSubcategorySubmit}
        secondaryAction={closeSubcategoryModal}
        secondaryActionLabel="Cancel"
        small={false}
        body={
          <FormProvider {...methods}>
            <div className="flex flex-col gap-4">
              <FormBuilder
                data={[
                  {
                    name: 'name',
                    label: 'Name',
                    placeholder: 'Enter subcategory name',
                    type: 'text',
                    required: true,
                  },
                  {
                    name: 'description',
                    label: 'Description',
                    placeholder: 'Describe the subcategory',
                    type: 'textarea',
                    required: true,
                  },
                ]}
                edit
              />
            </div>
          </FormProvider>
        }
      />
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteSubcategory}
        loading={isDeletingSubcategory}
        title="Delete Subcategory?"
        subTitle="Do you really want to delete this subcategory? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </>
  )
}

function DetailItem({ label, value }: { label: string; value: any }) {
  const isUrl = typeof value === 'string' && /^https?:\/\/\S+$/i.test(value)
  const content = React.isValidElement(value) ? (
    value
  ) : isUrl ? (
    <a
      href={value}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: '#2563eb' }}
    >
      {value}
    </a>
  ) : (
    <>{safeStr(value)}</>
  )

  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm">{content}</div>
    </div>
  )
}

function safeStr(v: any) {
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
}

function capitalizeFirst(v: any) {
  const s = safeStr(v)
  if (s === '--') return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}
