import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { DialogModal } from '../../../components/common'
import FormBuilder from '../../../components/app/formBuilder'
import { recipeFormSchema, RecipeSchema } from './schema'
import { useCreateRecipe, useUpdateRecipe } from '../api'
import { useQueryClient } from '@tanstack/react-query'

type Props = {
  isDrawerOpen: boolean
  handleClose: () => void
  handleRefresh?: () => void
  edit?: boolean
  rowData?: any
}

export default function CreateRecipe({
  isDrawerOpen,
  handleClose,
  handleRefresh,
  edit,
  rowData,
}: Props) {
  const methods = useForm<RecipeSchema>({
    resolver: zodResolver(recipeFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  })
  const { handleSubmit } = methods
  const { mutate: createRecipeMutate } = useCreateRecipe()
  const { mutate: updateRecipeMutate } = useUpdateRecipe()
  const queryClient = useQueryClient()

  const onSubmit = (values: RecipeSchema) => {
    const payload = { recipe: { ...values } }
    if (edit && rowData?.id) {
      updateRecipeMutate(
        { id: rowData.id, payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recipes_list'] })
            handleRefresh?.()
            handleClose()
          },
        }
      )
    } else {
      createRecipeMutate(payload, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['recipes_list'] })
          handleRefresh?.()
          handleClose()
        },
      })
    }
  }

  const { reset } = methods
  useEffect(() => {
    if (isDrawerOpen && edit && rowData) {
      reset({
        name: rowData?.name ?? '',
        description: rowData?.description ?? '',
        category: rowData?.category ?? '',
        calories: rowData?.calories ?? ('' as unknown as number),
        portion_size: rowData?.portion_size ?? '',
        image_url: rowData?.image_url ?? '',
      })
    } else if (isDrawerOpen && !edit) {
      reset({
        name: '',
        description: '',
        category: '',
        calories: '' as unknown as number,
        portion_size: '',
        image_url: '',
      })
    }
  }, [isDrawerOpen, edit, rowData, reset])

  const formFields = [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'Enter recipe name',
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter description',
      required: true,
    },
    {
      name: 'category',
      label: 'Category',
      type: 'text',
      placeholder: 'Enter category',
      required: true,
    },
    {
      name: 'calories',
      label: 'Calories',
      type: 'text',
      placeholder: 'Enter calories',
      required: true,
    },
    {
      name: 'portion_size',
      label: 'Portion Size',
      type: 'text',
      placeholder: 'Enter portion size',
      required: true,
    },
    {
      name: 'image_url',
      label: 'Image URL',
      type: 'text',
      placeholder: 'https://...',
    },
  ]

  return (
    <DialogModal
      isOpen={isDrawerOpen}
      onClose={handleClose}
      title={edit ? 'Edit Recipe' : 'Create Recipe'}
      actionLabel={edit ? 'Update' : 'Create'}
      onSubmit={handleSubmit(onSubmit)}
      secondaryAction={handleClose}
      secondaryActionLabel="Cancel"
      body={
        <div className="flex flex-col gap-4">
          <FormProvider {...methods}>
            <FormBuilder data={formFields} edit={true} />
          </FormProvider>
        </div>
      }
    />
  )
}
