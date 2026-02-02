import { fireEvent, render, screen } from '@testing-library/react'
import CreateRecipe from './index'

const mockInvalidateQueries = jest.fn()
const mockCreateMutate = jest.fn()
const mockUpdateMutate = jest.fn()

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}))

jest.mock('../api', () => ({
  useCreateRecipe: () => ({
    mutate: (...args: any[]) => mockCreateMutate(...args),
  }),
  useUpdateRecipe: () => ({
    mutate: (...args: any[]) => mockUpdateMutate(...args),
  }),
}))

const mockMealCategoriesHook = jest.fn((arg?: any) => {
  void arg
  return {
    data: { meal_categories: [] },
  }
})
const mockServingUnitsHook = jest.fn((arg?: any) => {
  void arg
  return {
    data: { serving_units: [] },
  }
})

jest.mock('../../Meals/api', () => ({
  useMealCategories: () => mockMealCategoriesHook(),
  useServingUnits: (arg?: any) => mockServingUnitsHook(arg),
}))

const mockAppend = jest.fn()
const mockRemove = jest.fn()
const mockSetValue = jest.fn()

let mockFormValues: any = {}
let mockWatchValues: Record<string, any> = {}

const setMockFormState = (
  values: any,
  extraWatch: Record<string, any> = {}
) => {
  mockFormValues = values
  mockWatchValues = {
    protein: values?.protein ?? 0,
    carbs: values?.carbs ?? 0,
    fat: values?.fat ?? 0,
    fiber: values?.fiber ?? 0,
    meal_category_id: values?.meal_category_id,
    ...extraWatch,
  }
}

jest.mock('react-hook-form', () => {
  return {
    useForm: () => ({
      handleSubmit: (cb: any) => () => cb(mockFormValues),
      control: {},
      watch: (field: string) => (field ? mockWatchValues[field] : undefined),
      setValue: mockSetValue,
      formState: { errors: {} },
    }),
    FormProvider: ({ children }: any) => (
      <div data-testid="form-provider">{children}</div>
    ),
    Controller: ({ render }: any) =>
      render({ field: { value: '', onChange: jest.fn() } }),
    useFieldArray: () => ({
      fields: [{ id: 'ingredient-1' }],
      append: mockAppend,
      remove: mockRemove,
    }),
  }
})

jest.mock('../../../components/common', () => ({
  DialogModal: ({ title, body, onSubmit }: any) => (
    <div data-testid="dialog-modal">
      <span data-testid="dialog-title">{title}</span>
      <button
        onClick={() =>
          onSubmit?.({
            preventDefault() {
              return undefined
            },
          } as any)
        }
      >
        trigger-submit
      </button>
      {body}
    </div>
  ),
  TextField: ({ label }: any) => <input aria-label={label} />,
}))

const MockFormBuilder = () => <div data-testid="form-builder" />
MockFormBuilder.displayName = 'MockFormBuilder'

jest.mock('../../../components/app/formBuilder', () => ({
  __esModule: true,
  default: MockFormBuilder,
}))

describe('CreateRecipe drawer', () => {
  const baseValues = {
    name: 'Power Salad',
    description: 'Yummy',
    preparation_notes: 'Mix well',
    meal_category: 'Lunch',
    meal_category_id: 5,
    serving_unit: 'Bowl',
    protein: 10,
    carbs: 20,
    fat: 5,
    fiber: 3,
    calories: 38,
    ingredients: [
      {
        name: 'Lettuce',
        quantity: 1,
        unit: 'cup',
      },
    ],
    image: '',
  }

  const setup = (props: any = {}) => {
    const handleClose = jest.fn()
    const handleRefresh = jest.fn()
    return {
      handleClose,
      handleRefresh,
      ...render(
        <CreateRecipe
          isDrawerOpen
          handleClose={handleClose}
          handleRefresh={handleRefresh}
          {...props}
        />
      ),
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    setMockFormState(baseValues)
    mockCreateMutate.mockImplementation((_payload: any, options?: any) => {
      options?.onSuccess?.()
    })
    mockUpdateMutate.mockImplementation((_payload: any, options?: any) => {
      options?.onSuccess?.()
    })
  })

  it('renders create dialog title', () => {
    setup()

    expect(screen.getByTestId('dialog-title')).toHaveTextContent(
      'Create Recipe'
    )
  })

  it('submits form in create mode and calls create mutation', () => {
    const { handleClose, handleRefresh } = setup()

    fireEvent.click(screen.getByText('trigger-submit'))

    expect(mockCreateMutate).toHaveBeenCalledTimes(1)
    const [formPayload] = mockCreateMutate.mock.calls[0]
    expect(formPayload).toBeInstanceOf(FormData)
    expect(formPayload.get('recipe[name]')).toBe('Power Salad')
    expect(formPayload.get('recipe[meal_category_id]')).toBe('5')
    expect(mockUpdateMutate).not.toHaveBeenCalled()

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['recipes_list'],
    })
    expect(handleRefresh).toHaveBeenCalled()
    expect(handleClose).toHaveBeenCalled()
  })

  it('uses update mutation when edit mode is enabled', () => {
    const rowData = {
      id: 42,
      meal_category_id: 9,
      meal_category: 'Dinner',
    }
    setMockFormState({ ...baseValues, meal_category_id: undefined })

    const { handleClose } = setup({ edit: true, rowData })

    fireEvent.click(screen.getByText('trigger-submit'))

    expect(mockUpdateMutate).toHaveBeenCalledTimes(1)
    const [payload] = mockUpdateMutate.mock.calls[0]
    expect(payload).toEqual({
      id: rowData.id,
      payload: expect.any(FormData),
    })
    expect(payload.payload.get('recipe[meal_category_id]')).toBe('9')
    expect(mockCreateMutate).not.toHaveBeenCalled()
    expect(handleClose).toHaveBeenCalled()
  })
})
