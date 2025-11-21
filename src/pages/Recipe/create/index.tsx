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
    // Build multipart form data to support image file upload
    const fd = new FormData()
    fd.append('recipe[name]', (values as any)?.name ?? '')
    fd.append('recipe[description]', (values as any)?.description ?? '')
    fd.append('recipe[category]', (values as any)?.category ?? '')
    fd.append('recipe[calories]', String((values as any)?.calories ?? ''))
    fd.append('recipe[portion_size]', (values as any)?.portion_size ?? '')

    const imageVal: any = (values as any)?.image
    if (imageVal && typeof imageVal !== 'string') {
      // Only append when a new File is provided
      fd.append('image', imageVal)
    }

    if (edit && rowData?.id) {
      updateRecipeMutate(
        { id: rowData.id, payload: fd },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recipes_list'] })
            handleRefresh?.()
            handleClose()
          },
        }
      )
    } else {
      createRecipeMutate(fd, {
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
        image: rowData?.image_url ?? '',
      })
    } else if (isDrawerOpen && !edit) {
      reset({
        name: '',
        description: '',
        category: '',
        calories: '' as unknown as number,
        portion_size: '',
        image: '',
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
      name: 'category',
      label: 'Category',
      type: 'custom_select',
      placeholder: 'Select category',
      required: true,
      id: 'category_value',
      desc: 'name',
      descId: 'id',
      data: [
        { id: 'Breakfast', name: 'Breakfast' },
        { id: 'Lunch', name: 'Lunch' },
        { id: 'Dinner', name: 'Dinner' },
        { id: 'Snack', name: 'Snack' },
        { id: 'Dessert', name: 'Dessert' },
        { id: 'Beverage', name: 'Beverage' },
      ],
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
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter description',
      required: true,
    },

    {
      name: 'image',
      label: 'Image',
      id: 'image',
      type: 'file_upload',
      placeholder: 'Upload recipe image',
      required: false,
      accept: 'image/*',
      supportedExtensions: [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
      ],
      acceptedFiles: 'PNG, JPG, JPEG, WEBP (Max 5 MB)',
      fileSize: 5,
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
      small={false}
      body={
        <div className="flex flex-col gap-4">
          <FormProvider {...methods}>
            <FormBuilder data={formFields} edit={true} spacing />
          </FormProvider>
        </div>
      }
    />
  )
}
