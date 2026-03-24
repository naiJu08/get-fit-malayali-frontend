import { zodResolver } from '@hookform/resolvers/zod'
import {
  FormProvider,
  useForm,
  useFieldArray,
  Controller,
} from 'react-hook-form'
import { useEffect } from 'react'
import { DialogModal, TextArea, TextField } from '../../../components/common'
import TextEditor from '../../../components/common/TextEditer'
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
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
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
        serving_people_count: coerceNumberOrEmpty(
          rowData?.serving_people_count
        ),
        quantity: coerceNumberOrEmpty(rowData?.quantity),
        size: coerceNumberOrEmpty(rowData?.size),
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
              details: ing?.details ?? '',
              size: ing?.size ?? '',
            }))
          : [],
        additional_info: (() => {
          const existingInfo = rowData?.additional_info

          // If additional_info is null, undefined, or empty string, return empty array
          if (
            !existingInfo ||
            (typeof existingInfo === 'string' && existingInfo.trim() === '')
          ) {
            return [{ info: '' }]
          }

          // Handle different data formats
          if (Array.isArray(existingInfo)) {
            // Filter out empty info items
            const filteredInfo = existingInfo.filter((info: any) => {
              const infoValue =
                info?.info ?? (typeof info === 'string' ? info : '')
              return infoValue && infoValue.trim() !== ''
            })

            // If no valid info, return empty array
            if (filteredInfo.length === 0) {
              return [{ info: '' }]
            }

            return filteredInfo.map((info: any) => ({
              info: info?.info ?? (typeof info === 'string' ? info : ''),
            }))
          } else if (typeof existingInfo === 'string') {
            // Parse string with <br> tags or newlines into array
            const lines = existingInfo
              .split(/<br\s*\/?>|\n/)
              .map((line: string) => line.trim())
              .filter((line: string) => line.length > 0)

            return lines.length > 0
              ? lines.map((line: string) => ({ info: line }))
              : [{ info: '' }]
          }

          return [{ info: '' }]
        })(),
        image: rowData?.image_url ?? '', // Pre-fill image for edit
      } as any
    }

    // Handle duplicate mode (edit=false but rowData exists)
    if (!edit && rowData) {
      return {
        name: toTitleCase(rowData?.name) ?? '',
        description: toTitleCase(rowData?.description) ?? '',
        preparation_notes: toTitleCase(rowData?.preparation_notes) ?? '',
        meal_category: toTitleCase(rowData?.meal_category),
        meal_category_id: coerceId(rowData?.meal_category_id),
        serving_unit: toTitleCase(rowData?.serving_unit) ?? '',
        serving_people_count: coerceNumberOrEmpty(
          rowData?.serving_people_count
        ),
        quantity: coerceNumberOrEmpty(rowData?.quantity),
        size: coerceNumberOrEmpty(rowData?.size),
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
              details: ing?.details ?? '',
              size: ing?.size ?? '',
            }))
          : [],
        additional_info: (() => {
          const existingInfo = rowData?.additional_info

          // If additional_info is null, undefined, or empty string, return empty array
          if (
            !existingInfo ||
            (typeof existingInfo === 'string' && existingInfo.trim() === '')
          ) {
            return [{ info: '' }]
          }

          // Handle different data formats
          if (Array.isArray(existingInfo)) {
            // Filter out empty info items
            const filteredInfo = existingInfo.filter((info: any) => {
              const infoValue =
                info?.info ?? (typeof info === 'string' ? info : '')
              return infoValue && infoValue.trim() !== ''
            })

            // If no valid info, return empty array
            if (filteredInfo.length === 0) {
              return [{ info: '' }]
            }

            return filteredInfo.map((info: any) => ({
              info: info?.info ?? (typeof info === 'string' ? info : ''),
            }))
          } else if (typeof existingInfo === 'string') {
            // Parse string with <br> tags or newlines into array
            const lines = existingInfo
              .split(/<br\s*\/?>|\n/)
              .map((line: string) => line.trim())
              .filter((line: string) => line.length > 0)

            return lines.length > 0
              ? lines.map((line: string) => ({ info: line }))
              : [{ info: '' }]
          }

          return [{ info: '' }]
        })(),
        image: rowData?.image_url ?? '', // Pre-fill image for duplicate
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
      serving_people_count: '' as any,
      quantity: '' as any,
      size: '' as any,
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
          details: '',
          size: '',
        },
      ],
      additional_info: [{ info: '' }],
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

  const {
    fields: additionalInfoFields,
    append: appendAdditionalInfo,
    remove: removeAdditionalInfo,
  } = useFieldArray({
    control,
    name: 'additional_info',
  })

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
    // Set meal_category_id from meal_category name for both edit and duplicate modes
    if ((edit || (!edit && rowData)) && mealCategoryOptions.length > 0) {
      const currentId = methods.getValues('meal_category_id')
      if (currentId != null && currentId !== undefined) return
      const currentName = methods.getValues('meal_category')
      if (!currentName) return
      const matchingOption = mealCategoryOptions.find(
        (option: any) =>
          option?.name?.toLowerCase() === currentName.toLowerCase()
      )
      if (matchingOption?.id != null) {
        methods.setValue('meal_category_id', matchingOption.id, {
          shouldDirty: false,
          shouldValidate: true,
        })
      }
    }
  }, [edit, mealCategoryOptions, methods, rowData])

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
    // Only clear serving unit for create mode (not edit or duplicate)
    if (!edit && !rowData) {
      methods.setValue('serving_unit', '' as any, {
        shouldValidate: false,
        shouldDirty: false,
      })
    }
  }, [selectedMealCategoryId, edit, rowData, methods])

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

    // Capitalize first letter of recipe name
    const recipeName = (values as any)?.name ?? ''
    const capitalizedName =
      recipeName.charAt(0).toUpperCase() + recipeName.slice(1)
    fd.append('recipe[name]', capitalizedName)
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
    fd.append(
      'recipe[serving_people_count]',
      (values as any)?.serving_people_count ?? ''
    )
    fd.append('recipe[quantity]', (values as any)?.quantity ?? '')
    fd.append('recipe[size]', (values as any)?.size ?? '')
    // Nutrition fields - only append if they have values
    const calories = (values as any)?.calories
    const protein = (values as any)?.protein
    const carbs = (values as any)?.carbs
    const fat = (values as any)?.fat
    const fiber = (values as any)?.fiber

    // Only append calories if it has a value
    if (calories !== '' && calories !== undefined && calories !== null) {
      fd.append('recipe[calories]', String(calories))
    }

    // Other nutrition fields only if they have values
    if (protein !== '' && protein !== undefined && protein !== null) {
      fd.append('recipe[protein]', String(protein))
    }
    if (carbs !== '' && carbs !== undefined && carbs !== null) {
      fd.append('recipe[carbs]', String(carbs))
    }
    if (fat !== '' && fat !== undefined && fat !== null) {
      fd.append('recipe[fat]', String(fat))
    }
    if (fiber !== '' && fiber !== undefined && fiber !== null) {
      fd.append('recipe[fiber]', String(fiber))
    }
    // Ingredients
    const ingredients: any[] = (values as any)?.ingredients ?? []
    ingredients.forEach((ing: any, index: number) => {
      const prefix = `recipe[recipe_ingredients_attributes][${index}]`
      if (ing?.name) {
        // Capitalize first letter of ingredient name
        const capitalizedName =
          ing.name.charAt(0).toUpperCase() + ing.name.slice(1).toLowerCase()
        fd.append(`${prefix}[name]`, capitalizedName)
      }
      if (ing?.quantity != null && ing?.quantity !== '') {
        fd.append(`${prefix}[quantity]`, String(ing.quantity))
      }
      if (ing?.unit) {
        fd.append(`${prefix}[unit]`, ing.unit)
      }
      if (ing?.size) {
        fd.append(`${prefix}[size]`, ing.size)
      }
      if (ing?.details && ing.details.trim() !== '') {
        fd.append(`${prefix}[details]`, ing.details.trim())
      }
    })

    // Additional Info - append each info as separate lines with HTML breaks
    const additionalInfo: any[] = (values as any)?.additional_info ?? []
    if (additionalInfo.length > 0) {
      const infoText = additionalInfo
        .filter((info: any) => info?.info && info.info.trim() !== '')
        .map((info: any) => info.info.trim())
        .join('<br>')
      fd.append('recipe[additional_info]', infoText || '')
    } else {
      fd.append('recipe[additional_info]', '')
    }

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
  // Auto-calculation removed - Total Calories is now manually editable

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
      name: 'quantity',
      label: 'Serving Quantity',
      type: 'text',
      placeholder: 'Enter serving quantity',
      required: false,
    },
    {
      name: 'serving_people_count',
      label: 'Serving Count',
      type: 'text',
      placeholder: 'Enter serving count',
      required: false,
      allowPositiveOnly: true,
    },
    {
      name: 'size',
      label: 'Size',
      type: 'text',
      placeholder: 'Enter size',
      required: false,
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
      acceptedFiles: 'PNG, JPG, JPEG, WEBP',
      fileSize: 5,
    },
    {
      name: 'calories',
      label: 'Total Calories',
      type: 'text',
      placeholder: 'Enter total calories',
      required: false,
      allowPositiveOnly: true,
    },
    {
      name: 'protein',
      label: 'Protein',
      type: 'text',
      placeholder: 'Enter protein',
      maxLength: 4,
      required: false,
      allowPositiveOnly: true,
    },
    {
      name: 'carbs',
      label: 'Carbs',
      type: 'text',
      placeholder: 'Enter carbs',
      maxLength: 4,
      required: false,
      allowPositiveOnly: true,
    },
    {
      name: 'fat',
      label: 'Fat',
      type: 'text',
      placeholder: 'Enter fat',
      maxLength: 4,
      required: false,
      allowPositiveOnly: true,
    },
    {
      name: 'fiber',
      label: 'Fiber',
      type: 'text',
      placeholder: 'Enter fiber',
      maxLength: 4,
      required: false,
      allowPositiveOnly: true,
    },

    {
      name: 'preparation_notes',
      label: 'Preparation Notes',
      type: 'custom',
      required: true,
      render: () => (
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold mb-2">
            Preparation Notes <span className="text-red-500">*</span>
          </h3>
          <Controller
            name="preparation_notes"
            control={control}
            rules={{ required: 'Preparation notes are required' }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <div>
                <TextEditor
                  value={value || ''}
                  onChange={onChange}
                  placeholder="Enter preparation notes"
                  label=""
                />
                {error && (
                  <p className="mt-1 text-xs text-red-500">{error.message}</p>
                )}
              </div>
            )}
          />
        </div>
      ),
    },
  ]

  return (
    <DialogModal
      isOpen={isDrawerOpen}
      onClose={handleClose}
      title={
        edit ? 'Edit Recipe' : rowData ? 'Duplicate Recipe' : 'Create Recipe'
      }
      actionLabel={edit ? 'Save' : 'Save'}
      onSubmit={handleSubmit(onSubmit)}
      secondaryAction={handleClose}
      secondaryActionLabel="Cancel"
      small={false}
      body={
        // Make the create recipe content scrollable while keeping header/footer fixed
        <div className="flex flex-col gap-4 overflow-y-auto pr-1">
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
                    'description',
                  ].includes(f.name)
              )}
              edit={true}
              spacing
            />

            {/* Full-width textareas */}
            <FormBuilder
              data={formFields.filter((f) => f.name === 'description')}
              edit={true}
              spacing={false}
            />
            {/* Calories / macros section */}
            <div className="mt-4 border-t pt-4">
              <h3 className="text-sm font-semibold mb-2">Nutritional Value</h3>
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

            {/* Additional Info section */}
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Additional Info</h3>
              </div>

              {additionalInfoFields.map((field, index) => (
                <div key={field.id} className="text-[11px]">
                  <div className="flex items-center justify-between mb-2 mr-2">
                    <span className="font-medium"></span>
                    {additionalInfoFields.length > 1 && (
                      <button
                        type="button"
                        className="text-[10px] text-red-500"
                        onClick={() => removeAdditionalInfo(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="w-full">
                    <Controller
                      name={`additional_info.${index}.info` as const}
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <TextField
                          id={`additional_info.${index}.info`}
                          name={`additional_info.${index}.info`}
                          placeholder="Enter additional information"
                          value={value ?? ''}
                          onChange={onChange}
                          errors={errors}
                        />
                      )}
                    />
                  </div>
                </div>
              ))}

              <div className="flex justify-end">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  onClick={() => appendAdditionalInfo({ info: '' })}
                  aria-label="Add more info"
                >
                  +
                </button>
              </div>
            </div>

            <div className="border-t pt-4">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 items-end">
                    <div>
                      <Controller
                        name={`ingredients.${index}.name` as const}
                        control={control}
                        render={({ field: { onChange, value } }) => (
                          <>
                            <TextField
                              id={`ingredients.${index}.name`}
                              name={`ingredients.${index}.name`}
                              label="Name"
                              type="text"
                              placeholder="Ingredient name"
                              maxLength={100}
                              value={value ?? ''}
                              onChange={onChange}
                              required
                              errors={errors}
                              autoComplete={true}
                            />
                          </>
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

                              // More flexible validation - allow typing partial inputs
                              const isValid =
                                val === '' || // empty
                                /^\d+$/.test(val) || // whole numbers
                                /^\d+\.$/.test(val) || // decimal with trailing dot
                                /^\d+\.\d+$/.test(val) || // complete decimals
                                /^\d+\/$/.test(val) || // fraction with trailing slash
                                /^\d+\/\d+$/.test(val) || // complete fractions
                                /^\d+\s\/$/.test(val) || // fraction with space and trailing slash
                                /^\d+\s\/\s\d+$/.test(val) || // fractions with spaces
                                /^\d+\s$/.test(val) // number with trailing space

                              if (isValid) {
                                field.onChange(val)
                              }
                            }}
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
                            errors={errors}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <Controller
                      name={`ingredients.${index}.details` as const}
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <TextArea
                          id={`ingredients.${index}.details`}
                          name={`ingredients.${index}.details`}
                          placeholder="Enter specifications (e.g., organic, fresh, diced)"
                          value={value ?? ''}
                          onChange={onChange}
                          rows={2}
                          errors={errors}
                        />
                      )}
                    />
                  </div>
                </div>
              ))}

              <div className="mt-6   flex justify-end">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  onClick={() =>
                    appendIngredient({
                      name: '',
                      quantity: '',
                      unit: '',
                      details: '',
                      size: '',
                    })
                  }
                  aria-label="Add ingredient row"
                >
                  +
                </button>
              </div>
            </div>

            {/* Preparation Notes section */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-2">
                Preparation Notes <span className="text-red-500">*</span>
              </h3>
              <Controller
                name="preparation_notes"
                control={control}
                rules={{ required: 'Preparation notes are required' }}
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <div>
                    <TextEditor
                      value={value || ''}
                      onChange={onChange}
                      placeholder="Enter preparation notes"
                      label=""
                    />
                    {error && (
                      <p className="mt-1 text-xs text-red-700">
                        {error.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Description section */}
            <div className="mt-4 border-t pt-4">
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              <Controller
                name="description"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <TextArea
                    id="description"
                    name="description"
                    value={value || ''}
                    onChange={onChange}
                    placeholder="Enter description"
                    rows={3}
                    errors={errors}
                  />
                )}
              />
            </div>
          </FormProvider>
        </div>
      }
    />
  )
}
