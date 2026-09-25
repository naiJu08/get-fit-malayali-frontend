import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'

import FormBuilder from '../../../components/app/formBuilder'
import { DialogModal } from '../../../components/common'
import Icons from '../../../components/common/icons'
import {
  useCreateAssessmentCategory,
  useUpdateAssessmentCategory,
} from '../api'
import {
  AssessmentCategorySchema,
  assessmentCategoryFormSchema,
} from './schema'

type Props = {
  isDrawerOpen: boolean
  handleClose: () => void
  edit?: boolean
  viewMode?: boolean
  rowData?: any
  setEdit?: (edit: boolean) => void
  setViewMode?: (viewMode: boolean) => void
}

const emptyQuestion = {
  question_text: '',
}

const normalizeStatus = (rowData: any) => {
  if (rowData?.active === true) return 'Active'
  if (rowData?.active === false) return 'Inactive'
  return String(rowData?.status ?? 'active').toLowerCase() === 'inactive'
    ? 'Inactive'
    : 'Active'
}

const getQuestionsForForm = (rowData: any) => {
  const questions = Array.isArray(rowData?.assessment_questions)
    ? rowData.assessment_questions
    : []

  if (!questions.length) return [emptyQuestion]

  return questions.map((question: any) => ({
    id: question?.id,
    question_text: question?.question_text ?? '',
  }))
}

export default function CreateAssessmentCategory({
  isDrawerOpen,
  handleClose,
  edit,
  viewMode,
  rowData,
  setEdit,
  setViewMode,
}: Props) {
  const methods = useForm<AssessmentCategorySchema>({
    resolver: zodResolver(assessmentCategoryFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      status: 'Active',
      assessment_questions: [emptyQuestion],
    },
  })
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = methods
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'assessment_questions',
    keyName: 'fieldId',
  })

  const createMutation = useCreateAssessmentCategory()
  const updateMutation = useUpdateAssessmentCategory()

  const handleClearAndClose = () => {
    reset({
      name: '',
      description: '',
      status: 'Active',
      assessment_questions: [emptyQuestion],
    })
    handleClose()
  }

  useEffect(() => {
    if (isDrawerOpen && (edit || viewMode) && rowData) {
      reset({
        name: rowData?.name ?? '',
        description: rowData?.description ?? '',
        status: normalizeStatus(rowData),
        assessment_questions: getQuestionsForForm(rowData),
      })
      return
    }

    if (isDrawerOpen && !edit) {
      reset({
        name: '',
        description: '',
        status: 'Active',
        assessment_questions: [emptyQuestion],
      })
    }
  }, [isDrawerOpen, edit, viewMode, rowData, reset])

  const handleServerNameError = (error: any) => {
    const errors = error?.response?.data?.errors
    const nameError = Array.isArray(errors)
      ? errors.find((err: string) => err.toLowerCase().includes('name'))
      : undefined

    if (nameError) {
      setError('name', {
        type: 'server',
        message: nameError,
      })
    }
  }

  const onSubmit = (values: AssessmentCategorySchema) => {
    const payload = {
      assessment_category: {
        name: values.name.trim(),
        description: values.description?.trim() ?? '',
        active: values.status.toLowerCase() === 'active',
        assessment_questions_attributes: values.assessment_questions.map(
          (question) => ({
            ...(question.id ? { id: question.id } : {}),
            question_text: question.question_text.trim(),
            active: true,
          })
        ),
      },
    }

    if (edit && rowData?.id) {
      updateMutation.mutate(
        { id: rowData.id, payload },
        {
          onSuccess: handleClearAndClose,
          onError: handleServerNameError,
        }
      )
      return
    }

    createMutation.mutate(payload, {
      onSuccess: handleClearAndClose,
      onError: handleServerNameError,
    })
  }

  const formFields = [
    {
      name: 'name',
      label: 'Category Name',
      id: 'name',
      type: 'text',
      placeholder: 'Enter assessment category name',
      required: true,
      maxLength: 80,
      ...(viewMode && { disabled: true }),
    },
    {
      name: 'description',
      label: 'Description',
      id: 'description',
      type: 'textarea',
      placeholder: 'Enter description',
      maxLength: 255,
      ...(viewMode && { disabled: true }),
    },
    {
      name: 'status',
      label: 'Status',
      id: 'status',
      type: 'custom_select',
      placeholder: 'Select status',
      required: true,
      desc: 'name',
      descId: 'id',
      data: [
        { id: 'Active', name: 'Active' },
        { id: 'Inactive', name: 'Inactive' },
      ],
      ...(viewMode && { disabled: true }),
    },
  ]

  const handleChangeToEdit = () => {
    setViewMode?.(false)
    setEdit?.(true)
  }

  return (
    <DialogModal
      isOpen={isDrawerOpen}
      onClose={handleClearAndClose}
      title={
        viewMode
          ? 'Assessment Category Details'
          : edit
            ? 'Edit Assessment Category'
            : 'Create Assessment Category'
      }
      actionLabel={viewMode ? 'Edit' : 'Save'}
      actionLoader={createMutation.isLoading || updateMutation.isLoading}
      onSubmit={viewMode ? handleChangeToEdit : handleSubmit(onSubmit)}
      secondaryAction={handleClearAndClose}
      secondaryActionLabel="Cancel"
      small={false}
      body={
        <FormProvider {...methods}>
          <div className="flex flex-col gap-5">
            <FormBuilder data={formFields} edit />
            <div className="border-t pt-4">
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  Assessment Questions
                </h3>
              </div>

              {errors.assessment_questions?.root?.message ? (
                <div className="text-error text-error-label">
                  {errors.assessment_questions.root.message}
                </div>
              ) : null}

              <div className="flex flex-col gap-3">
                {fields.map((field, index) => (
                  <div key={field.fieldId} className="bg-white text-[11px]">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium">
                        Question {index + 1}
                        <span className="text-error"> *</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            className={`w-full textfield ${
                              errors.assessment_questions?.[index]
                                ?.question_text
                                ? 'textfield-error'
                                : ''
                            }`}
                            placeholder="Enter question"
                            disabled={viewMode}
                            {...register(
                              `assessment_questions.${index}.question_text`
                            )}
                          />
                          {!viewMode && (
                            <button
                              type="button"
                              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm ring-2 ring-blue-100 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                              onClick={() => append(emptyQuestion)}
                              aria-label="Add question"
                              title="Add question"
                            >
                              <span className="text-[18px]">+</span>
                            </button>
                          )}
                          {!viewMode && fields.length > 1 && (
                            <button
                              type="button"
                              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-1"
                              onClick={() => remove(index)}
                              aria-label="Remove question"
                              title="Remove question"
                            >
                              <Icons name="delete" />
                            </button>
                          )}
                        </div>
                        {errors.assessment_questions?.[index]?.question_text
                          ?.message ? (
                          <div className="text-error text-error-label mt-[1px]">
                            {
                              errors.assessment_questions[index]?.question_text
                                ?.message
                            }
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FormProvider>
      }
    />
  )
}
