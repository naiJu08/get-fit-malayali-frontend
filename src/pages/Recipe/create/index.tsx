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
  const getDefaultValues = () => {
    if (edit && rowData) {
      return {
        name: rowData?.name ?? '',
        description: rowData?.description ?? '',
        preparation_notes: rowData?.preparation_notes ?? '',
        meal_category: rowData?.meal_category ?? '',
        meal_category_id: rowData?.meal_category_id ?? undefined,
        serving_unit: rowData?.serving_unit ?? '',
        calories: rowData?.nutrition?.calories ?? rowData?.calories ?? 0,
        protein: rowData?.nutrition?.protein ?? 0,
        carbs: rowData?.nutrition?.carbs ?? 0,
        fat: rowData?.nutrition?.fat ?? 0,
        fiber: rowData?.nutrition?.fiber ?? 0,
        ingredients: Array.isArray(rowData?.ingredients)
          ? rowData.ingredients.map((ing: any) => ({
              name: ing?.name ?? '',
              quantity: ing?.quantity ?? 0,
              unit: ing?.unit ?? '',
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
      calories: 0 as any,
      protein: 0 as any,
      carbs: 0 as any,
      fat: 0 as any,
      fiber: 0 as any,
      ingredients: [
        {
          name: '',
          quantity: 0,
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
  const { handleSubmit, control } = methods
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
      required: true,
      allowPositiveOnly: true,
    },
    {
      name: 'carbs',
      label: 'Carbs',
      type: 'text',
      placeholder: 'Enter carbs',
      required: true,
      allowPositiveOnly: true,
    },
    {
      name: 'fat',
      label: 'Fat',
      type: 'text',
      placeholder: 'Enter fat',
      required: true,
      allowPositiveOnly: true,
    },
    {
      name: 'fiber',
      label: 'Fiber',
      type: 'text',
      placeholder: 'Enter fiber',
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

      required: false,
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
  ]

  return (
    <DialogModal
      isOpen={isDrawerOpen}
      onClose={handleClose}
      title={edit ? 'Edit Recipe' : 'Create Recipe'}
      actionLabel={edit ? 'Save' : 'Create'}
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
                            value={value ?? ''}
                            onChange={onChange as any}
                            required
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Controller
                        name={`ingredients.${index}.quantity` as const}
                        control={control}
                        render={({ field: { onChange, value } }) => (
                          <TextField
                            id={`ingredients.${index}.quantity`}
                            name={`ingredients.${index}.quantity`}
                            label="Quantity"
                            type="number"
                            placeholder="e.g. 800"
                            value={
                              value === undefined ||
                              value === null ||
                              value === 0
                                ? ''
                                : String(value)
                            }
                            onChange={onChange as any}
                            required
                            allowPositiveOnly
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
                            label="Unit"
                            type="text"
                            placeholder="e.g. grams"
                            value={value ?? ''}
                            onChange={onChange as any}
                            required
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
