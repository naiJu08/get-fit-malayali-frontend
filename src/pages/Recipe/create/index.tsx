import { zodResolver } from '@hookform/resolvers/zod'
import {
  FormProvider,
  useForm,
  useFieldArray,
  Controller,
} from 'react-hook-form'
import { useEffect } from 'react'
import { DialogModal, TextField } from '../../../components/common'
import FormBuilder from '../../../components/app/formBuilder'
import { recipeFormSchema, RecipeSchema } from './schema'
import { useCreateRecipe, useUpdateRecipe } from '../api'
import { useQueryClient } from '@tanstack/react-query'
import { useMealCategories, useServingUnits } from '../../Meals/api'

type Props = {
  isDrawerOpen: boolean
  handleClose: () => void
  handleRefresh?: () => void
  edit?: boolean
  rowData?: any
  formKey?: string
}

export default function CreateRecipe({
  isDrawerOpen,
  handleClose,
  handleRefresh,
  edit,
  rowData,
  // formKey,
}: Props) {
  const toTitleCase = (value?: string | null) => {
    if (!value) return ''
    return value
      .split(' ')
      .map((word) =>
        word
          ? `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`
          : word
      )
      .join(' ')
  }

  const getDefaultValues = () => {
    const coerceNumberOrEmpty = (value: unknown) => {
      return value === undefined || value === null || value === '' ? '' : value
    }
    const coerceId = (value: unknown) => {
      if (value === undefined || value === null || value === '')
        return undefined
      const parsed = Number(value)
      return Number.isNaN(parsed) ? undefined : parsed
    }

    if (edit && rowData) {
      return {
        name: toTitleCase(rowData?.name) ?? '',
        description: toTitleCase(rowData?.description) ?? '',
        preparation_notes: toTitleCase(rowData?.preparation_notes) ?? '',
        meal_category: toTitleCase(rowData?.meal_category),
        meal_category_id: coerceId(rowData?.meal_category_id),
        serving_unit: toTitleCase(rowData?.serving_unit) ?? '',
        calories: coerceNumberOrEmpty(
          rowData?.nutrition?.calories ?? rowData?.calories
        ),
        protein: coerceNumberOrEmpty(rowData?.nutrition?.protein),
        carbs: coerceNumberOrEmpty(rowData?.nutrition?.carbs),
        fat: coerceNumberOrEmpty(rowData?.nutrition?.fat),
        fiber: coerceNumberOrEmpty(rowData?.nutrition?.fiber),
        ingredients: Array.isArray(rowData?.ingredients)
          ? rowData.ingredients.map((ing: any) => ({
              name: toTitleCase(ing?.name) ?? '',
              quantity:
                ing?.quantity === undefined || ing?.quantity === null
                  ? ''
                  : String(ing.quantity),
              unit: toTitleCase(ing?.unit) ?? '',
            }))
          : [],
        image: rowData?.image_url ?? '',
      } as any
    }
    // create defaults
    return {
      name: '',
      description: '',
      preparation_notes: '',
      meal_category: '',
      meal_category_id: undefined as any,
      serving_unit: '',
      calories: '' as any,
      protein: '' as any,
      carbs: '' as any,
      fat: '' as any,
      fiber: '' as any,
      ingredients: [
        {
          name: '',
          quantity: '' as any,
          unit: '',
        },
      ],
      image: '',
    } as any
  }

  const methods = useForm<RecipeSchema>({
    resolver: zodResolver(recipeFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: getDefaultValues(),
  })
  useEffect(() => {
    methods.reset(getDefaultValues())
  }, [edit, rowData, methods])

  // Reset form when modal closes
  useEffect(() => {
    if (!isDrawerOpen) {
      methods.reset(getDefaultValues())
    }
  }, [isDrawerOpen, methods, edit, rowData])
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = methods
  const { mutate: createRecipeMutate } = useCreateRecipe()
  const { mutate: updateRecipeMutate } = useUpdateRecipe()
  const queryClient = useQueryClient()

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({
    control,
    name: 'ingredients',
  })

  // Watch macro fields for calories section
  const protein = methods.watch('protein')
  const carbs = methods.watch('carbs')
  const fat = methods.watch('fat')
  const fiber = methods.watch('fiber')

  // Meal categories & serving units (reused from Meals)
  const { data: mealCategoriesData } = useMealCategories()
  const rawMealCategories =
    (mealCategoriesData as any)?.meal_categories ?? (mealCategoriesData as any)
  const mealCategoryList = Array.isArray(rawMealCategories)
    ? rawMealCategories
    : []
  const mealCategoryOptions = mealCategoryList.map((c: any) => ({
    id: c.id,
    name: c.name,
  }))

  useEffect(() => {
    if (!edit) return
    const currentId = methods.getValues('meal_category_id')
    if (currentId != null && currentId !== undefined) return
    const currentName = methods.getValues('meal_category')
    if (!currentName) return
    const matchingOption = mealCategoryOptions.find(
      (option: any) => option?.name?.toLowerCase() === currentName.toLowerCase()
    )
    if (matchingOption?.id != null) {
      methods.setValue('meal_category_id', matchingOption.id, {
        shouldDirty: false,
        shouldValidate: true,
      })
    }
  }, [edit, mealCategoryOptions, methods])

  const selectedMealCategoryId = methods.watch('meal_category_id') as
    | number
    | undefined

  const { data: servingUnitsData } = useServingUnits(selectedMealCategoryId)
  const rawServingUnits =
    (servingUnitsData as any)?.serving_units ?? (servingUnitsData as any)
  const servingUnitList = Array.isArray(rawServingUnits) ? rawServingUnits : []
  const servingUnitOptions = servingUnitList.map((u: any) =>
    typeof u === 'string' ? { id: u, name: u } : { id: u.id, name: u.name }
  )

  useEffect(() => {
    if (!edit) {
      methods.setValue('serving_unit', '' as any, {
        shouldValidate: false,
        shouldDirty: false,
      })
    }
  }, [selectedMealCategoryId, edit, methods])

  console.log(methods.formState.errors)
  const onSubmit = (values: RecipeSchema) => {
    console.log(
      'Recipe submit values',
      values,
      'edit:',
      edit,
      'id:',
      rowData?.id
    ) // Build multipart form data to support image file upload
    const fd = new FormData()
    fd.append('recipe[name]', (values as any)?.name ?? '')
    fd.append('recipe[description]', (values as any)?.description ?? '')
    fd.append(
      'recipe[preparation_notes]',
      (values as any)?.preparation_notes ?? ''
    )
    // Ensure meal_category_id is always present
    const formMealCategoryId = (values as any)?.meal_category_id
    const rowMealCategoryId = rowData?.meal_category_id
    const formMealCategoryName = (values as any)?.meal_category
    const rowMealCategoryName = rowData?.meal_category
    const optionByName = mealCategoryOptions.find(
      (c: any) =>
        c?.name === formMealCategoryName || c?.name === rowMealCategoryName
    )
    const resolvedMealCategoryId =
      formMealCategoryId ?? rowMealCategoryId ?? optionByName?.id

    if (!resolvedMealCategoryId) {
      console.warn(
        'Missing meal_category_id: cannot submit without category id'
      )
      return
    }
    fd.append('recipe[meal_category_id]', String(resolvedMealCategoryId))
    fd.append('recipe[serving_unit]', (values as any)?.serving_unit ?? '')
    fd.append('recipe[default_serving_quantity]', '')
    // Nutrition fields
    fd.append('recipe[calories]', String((values as any)?.calories ?? ''))
    fd.append('recipe[protein]', String((values as any)?.protein ?? ''))
    fd.append('recipe[carbs]', String((values as any)?.carbs ?? ''))
    fd.append('recipe[fat]', String((values as any)?.fat ?? ''))
    fd.append('recipe[fiber]', String((values as any)?.fiber ?? ''))
    // Ingredients
    const ingredients: any[] = (values as any)?.ingredients ?? []
    ingredients.forEach((ing: any, index: number) => {
      const prefix = `recipe[recipe_ingredients_attributes][${index}]`
      if (ing?.name) {
        fd.append(`${prefix}[name]`, ing.name)
      }
      if (ing?.quantity != null && ing?.quantity !== '') {
        fd.append(`${prefix}[quantity]`, String(ing.quantity))
      }
      if (ing?.unit) {
        fd.append(`${prefix}[unit]`, ing.unit)
      }
    })

    const imageVal: any = (values as any)?.image
    if (imageVal && typeof imageVal !== 'string') {
      // Only append when a new File is provided
      fd.append('image', imageVal)
    }
    console.log('Recipe form data', fd)

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
  useEffect(() => {
    const toNumber = (v: any) => {
      const n = Number(v)
      return Number.isNaN(n) ? 0 : n
    }

    const isEmpty = (value: any) =>
      value === undefined || value === null || value === ''
    const macros = [protein, carbs, fat, fiber]
    const allEmpty = macros.every(isEmpty)

    if (allEmpty) {
      methods.setValue('calories', '' as any, {
        shouldValidate: false,
        shouldDirty: false,
      })
      return
    }

    const total =
      toNumber(protein) + toNumber(carbs) + toNumber(fat) + toNumber(fiber)

    methods.setValue('calories', total as any, {
      shouldValidate: true,
      shouldDirty: true,
    })
  }, [protein, carbs, fat, fiber, methods])

  const formFields = [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'Enter recipe name',
      required: true,
      maxLength: 100,
    },
    {
      name: 'meal_category',
      label: 'Meal Category',
      type: 'custom_search_select',
      placeholder: 'Select meal category',
      required: true,
      desc: 'name',
      descId: 'id',
      id: 'meal_category_id',
      data: mealCategoryOptions,
    },
    {
      name: 'serving_unit',
      label: 'Serving Unit',
      type: 'custom_search_select',
      placeholder: 'Select serving unit',
      required: true,
      desc: 'name',
      descId: 'id',
      id: 'serving_unit',
      data: servingUnitOptions,
    },
    {
      name: 'protein',
      label: 'Protein',
      type: 'text',
      placeholder: 'Enter protein',
      maxLength: 4,
      required: true,
      allowPositiveOnly: true,
    },
    {
      name: 'carbs',
      label: 'Carbs',
      type: 'text',
      placeholder: 'Enter carbs',
      maxLength: 4,
      required: true,
      allowPositiveOnly: true,
    },
    {
      name: 'fat',
      label: 'Fat',
      type: 'text',
      placeholder: 'Enter fat',
      maxLength: 4,
      required: true,
      allowPositiveOnly: true,
    },
    {
      name: 'fiber',
      label: 'Fiber',
      type: 'text',
      placeholder: 'Enter fiber',
      maxLength: 4,
      required: true,
      allowPositiveOnly: true,
    },
    {
      name: 'calories',
      label: 'Total Calories',
      type: 'text',
      placeholder: 'Enter total calories',
      required: true,
      allowPositiveOnly: true,
      disabled: true,
    },
    {
      name: 'preparation_notes',
      label: 'Preparation Notes',
      type: 'textarea',
      placeholder: 'Enter preparation notes (optional)',
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter description',
      required: false,
    },

    {
      name: 'image',
      label: 'Image',
      id: 'image',
      type: 'file_upload',
      placeholder: 'Upload recipe image',
      required: true,
      accept: 'image/*',
      supportedExtensions: [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
      ],
      acceptedFiles: 'PNG, JPG, JPEG, WEBP',
      fileSize: 5,
    },
  ]

  return (
    <DialogModal
      isOpen={isDrawerOpen}
      onClose={handleClose}
      title={edit ? 'Edit Recipe' : 'Create Recipe'}
      actionLabel={edit ? 'Save' : 'Save'}
      onSubmit={handleSubmit(onSubmit)}
      secondaryAction={handleClose}
      secondaryActionLabel="Cancel"
      small={false}
      body={
        // Make the create recipe content scrollable while keeping header/footer fixed
        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
          <FormProvider {...methods}>
            {/* Main fields in 2-column grid (excluding macros and full-width textareas) */}
            <FormBuilder
              data={formFields.filter(
                (f) =>
                  ![
                    'protein',
                    'carbs',
                    'fat',
                    'fiber',
                    'calories',
                    'preparation_notes',
                    'description',
                  ].includes(f.name)
              )}
              edit={true}
              spacing
            />

            {/* Full-width textareas */}
            <FormBuilder
              data={formFields.filter(
                (f) =>
                  f.name === 'preparation_notes' || f.name === 'description'
              )}
              edit={true}
              spacing={false}
            />
            {/* Calories / macros section */}
            <div className="mt-4 border-t pt-4">
              <h3 className="text-sm font-semibold mb-2">Calories</h3>
              <FormBuilder
                data={formFields.filter((f) =>
                  ['protein', 'carbs', 'fat', 'fiber', 'calories'].includes(
                    f.name
                  )
                )}
                edit={true}
                spacing
              />
            </div>

            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Ingredients</h3>
              </div>

              {ingredientFields.map((field, index) => (
                <div
                  key={field.id}
                  className="mb-3 rounded border p-3 text-[11px]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Ingredient {index + 1}</span>
                    {ingredientFields.length > 1 && index > 0 && (
                      <button
                        type="button"
                        className="text-[10px] text-red-500"
                        onClick={() => removeIngredient(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                    <div className="md:col-span-2">
                      <Controller
                        name={`ingredients.${index}.name` as const}
                        control={control}
                        render={({ field: { onChange, value } }) => (
                          <TextField
                            id={`ingredients.${index}.name`}
                            name={`ingredients.${index}.name`}
                            label="Name"
                            type="text"
                            placeholder="Ingredient name"
                            maxLength={100}
                            value={value ?? ''}
                            onChange={onChange as any}
                            required
                            errors={errors}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Controller
                        name={`ingredients.${index}.quantity`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            id={`ingredients.${index}.quantity`}
                            name={`ingredients.${index}.quantity`}
                            label="Quantity"
                            type="text"
                            placeholder="e.g. 800"
                            maxLength={6}
                            value={String(field.value ?? '')}
                            onChange={(e) => {
                              const val = e.target.value

                              // Allow decimals and empty
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                field.onChange(val)
                              }
                            }}
                            required
                            errors={errors}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Controller
                        name={`ingredients.${index}.unit` as const}
                        control={control}
                        render={({ field: { onChange, value } }) => (
                          <TextField
                            id={`ingredients.${index}.unit`}
                            name={`ingredients.${index}.unit`}
                            maxLength={10}
                            label="Unit"
                            type="text"
                            placeholder="e.g. grams"
                            value={value ?? ''}
                            onChange={onChange as any}
                            required
                            errors={errors}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  onClick={() =>
                    appendIngredient({ name: '', quantity: 0, unit: '' })
                  }
                  aria-label="Add ingredient row"
                >
                  +
                </button>
              </div>
            </div>
          </FormProvider>
        </div>
      }
    />
  )
}
