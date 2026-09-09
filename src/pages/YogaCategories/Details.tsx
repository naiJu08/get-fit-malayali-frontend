import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import Icons from '../../components/common/icons'
import InfoBox from '../../components/app/alertBox/infoBox'
import SmartTable from '../../components/common/table/SmartTable'
import { DialogModal } from '../../components/common'
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal'
import { TableColumns } from '../../common/types'
import { useSnackbarManager } from '../../components/common/snackbar'
import {
  deleteYogaCategories,
  getYogaCategoriesDetails,
  getYogaSubCategories,
  useCreateYogaCategories,
  useUpdateYogaCategories,
} from './api'
import { CategorySchema, formSchema } from './create/schema'
import { calcWindowHeight } from '../../utilities/calcHeight'
import FormBuilder from '../../components/app/formBuilder'
import CreateYogaCategory from './create'

const SUBCATEGORY_ROWS = 10
const SUBCATEGORY_NAMES = [
  'Warmup',
  'Workout Round 1',
  'Workout Round 2',
  'Cool Down',
]
const bulkSubcategorySchema = formSchema.extend({
  name: z.string().optional(),
  names: z
    .array(z.object({ id: z.string(), name: z.string() }))
    .min(1, 'Select at least one subcategory.'),
})

export default function YogaCategoryDetails() {
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
  const [editCategoryModalOpen, setEditCategoryModalOpen] = useState(false)

  const loadCategoryDetails = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      const res = await getYogaCategoriesDetails(String(id))
      setData(res)
      setError('')
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load yoga category')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadCategoryDetails()
  }, [loadCategoryDetails])

  const fetchSubCategories = useCallback(async () => {
    if (!id) return
    setSubLoading(true)
    setSubError('')
    try {
      const res = await getYogaSubCategories(String(id))

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
  }, [enqueueSnackbar, id])

  useEffect(() => {
    if (!id) return
    setSubPage(1)
    setSubRowsPerPage(SUBCATEGORY_ROWS)
  }, [id])

  useEffect(() => {
    if (id) {
      fetchSubCategories()
    }
  }, [fetchSubCategories, id])

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

  const availableSubcategoryOptions = useMemo(
    () =>
      SUBCATEGORY_NAMES.filter(
        (name) =>
          !subcategories.some(
            (subcategory) =>
              subcategory.name?.toLowerCase() === name.toLowerCase()
          )
      ).map((name) => ({ id: name, name })),
    [subcategories]
  )

  const isEditingSubcategory = Boolean(selectedSubcategory?.id)
  const methods = useForm<
    Omit<CategorySchema, 'name'> & {
      name?: string
      names: { id: string; name: string }[]
    }
  >({
    resolver: zodResolver(
      isEditingSubcategory ? formSchema : bulkSubcategorySchema
    ),
    defaultValues: {
      name: '',
      names: [],
      description: '',
    },
  })
  const { handleSubmit, reset, watch } = methods
  const selectedNames = watch('names') || []

  const closeSubcategoryModal = () => {
    if (isCreatingSubcategory || isUpdatingSubcategory) return
    setIsSubcategoryModalOpen(false)
    setSelectedSubcategory(null)
    reset()
  }

  const onSubcategorySuccess = () => {
    setIsSubcategoryModalOpen(false)
    setSelectedSubcategory(null)
    reset()
    fetchSubCategories()
  }

  const { mutate: createSubcategory, isLoading: isCreatingSubcategory } =
    useCreateYogaCategories(
      onSubcategorySuccess,
      'Subcategories created successfully'
    )
  const { mutate: updateSubcategory, isLoading: isUpdatingSubcategory } =
    useUpdateYogaCategories(
      onSubcategorySuccess,
      'Subcategory updated successfully'
    )

  const handleSubcategorySubmit = handleSubmit((values) => {
    if (isCreatingSubcategory || isUpdatingSubcategory) return
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
      createSubcategory({
        category: {
          names: values.names.map((option) => option.name),
          description: values.description,
          parent_id: Number(id),
        },
      })
    }
  })

  const handleCreateSubcategoryClick = () => {
    setSelectedSubcategory(null)
    reset({
      name: '',
      names: [],
      description: '',
    })
    setIsSubcategoryModalOpen(true)
  }

  const handleEditSubcategory = (row: any) => {
    setSelectedSubcategory(row)
    reset({
      names: [],
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
      await deleteYogaCategories(subcategoryToDelete.id)
      enqueueSnackbar('Subcategory deleted successfully', {
        variant: 'success',
      })
      closeDeleteModal()
      fetchSubCategories()
    } catch (err: any) {
      const msg =
        err?.response?.data?.errors?.[0] ||
        err?.response?.data?.message ||
        'Failed to delete subcategory'
      enqueueSnackbar(msg, { variant: 'error' })
    } finally {
      setIsDeletingSubcategory(false)
    }
  }

  const handleSubPageChange = (newPage: number) => {
    setSubPage(newPage)
  }

  const handleSubRowsPerPage = (newRows: number | string) => {
    const next = Number(newRows)
    setSubRowsPerPage(next)
    setSubPage(1)
  }

  return (
    <>
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/yoga-categories')}
              aria-label="Back"
              className="rounded-lg p-1 hover:bg-gray-100"
            >
              <Icons name="left-arrow-icon" />
            </button>
            <h1 className="text-xl font-semibold">Yoga Category Details</h1>
          </div>
        </div>

        {loading && (
          <div className="p-6">
            <InfoBox content="Loading yoga category details..." />
          </div>
        )}
        {error && !loading && (
          <div className="p-6">
            <InfoBox content={error} />
          </div>
        )}
        {!loading && !error && (
          <>
            {category?.id && (
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  className="inline-flex items-center rounded-lg bg-primaryGreen px-4 py-2 text-sm font-medium text-white hover:bg-primaryGreen/90"
                  onClick={() => setEditCategoryModalOpen(true)}
                >
                  <Icons name="edit" />
                  <span className="ml-2">Edit Category</span>
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DetailItem
                label="Name"
                value={capitalizeFirst(category?.name)}
              />
              <DetailItem label="Description" value={category?.description} />
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                emptySubTitle="Create your first subcategory to organize yoga exercises better."
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
        disabled={isCreatingSubcategory || isUpdatingSubcategory}
        title={isEditingSubcategory ? 'Edit Subcategory' : 'Create Subcategory'}
        actionLabel={
          isEditingSubcategory ? 'Update' : `Create (${selectedNames.length})`
        }
        actionDisabled={
          isCreatingSubcategory ||
          isUpdatingSubcategory ||
          (!isEditingSubcategory &&
            (selectedNames.length === 0 || subLoading || Boolean(subError)))
        }
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
              {!isEditingSubcategory && (
                <div className="flex flex-col gap-2">
                  <FormBuilder
                    data={[
                      {
                        name: 'names',
                        id: 'subcategory_names',
                        label: 'Subcategories',
                        type: 'multi_select',
                        placeholder: 'Select subcategories',
                        desc: 'name',
                        descId: 'id',
                        required: true,
                        getData: () => availableSubcategoryOptions,
                        async: false,
                        initialLoad: true,
                        isMultiple: true,
                        notDataMessage:
                          'All subcategories have already been created',
                      },
                    ]}
                    edit={!isCreatingSubcategory && !subLoading && !subError}
                  />
                  <p className="text-xs text-gray-500">
                    The description applies to all selected subcategories.
                  </p>
                </div>
              )}
              <FormBuilder
                data={[
                  ...(isEditingSubcategory
                    ? [
                        {
                          name: 'name',
                          id: 'subcategory_name',
                          label: 'Name',
                          placeholder: 'Select subcategory type',
                          type: 'custom_select',
                          desc: 'name',
                          descId: 'id',
                          required: true,
                          data: SUBCATEGORY_NAMES.map((name, index) => ({
                            id: index + 1,
                            name,
                          })),
                        },
                      ]
                    : []),
                  {
                    name: 'description',
                    label: 'Description',
                    placeholder: 'Describe the subcategory',
                    type: 'textarea',
                    maxLength: 250,
                    required: false,
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

      <CreateYogaCategory
        isDrawerOpen={editCategoryModalOpen}
        handleClose={() => setEditCategoryModalOpen(false)}
        handleRefresh={() => loadCategoryDetails()}
        edit
        rowData={category}
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

  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}
