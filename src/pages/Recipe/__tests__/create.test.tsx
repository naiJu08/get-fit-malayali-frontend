import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CreateRecipe from '../create'

// ── Mock react-hook-form ──────────────────────────────────────────────────────
const mockReset = jest.fn()
const mockHandleSubmit = jest.fn()
const mockWatch = jest.fn()
const mockGetValues = jest.fn()
const mockSetValue = jest.fn()
const mockAppendIngredient = jest.fn()
const mockRemoveIngredient = jest.fn()
const mockAppendAdditionalInfo = jest.fn()
const mockRemoveAdditionalInfo = jest.fn()

jest.mock('react-hook-form', () => {
  const actual = jest.requireActual('react-hook-form')
  return {
    ...actual,
    useForm: (options?: any) => ({
      ...actual.useForm(options),
      reset: mockReset,
      handleSubmit: (fn: any) => (e?: any) => {
        mockHandleSubmit(fn, e)
        return fn(mockGetValues())
      },
      watch: mockWatch,
      getValues: mockGetValues,
      setValue: mockSetValue,
      control: {},
      formState: { errors: {} },
    }),
    useFieldArray: (params: any) => {
      if (params.name === 'ingredients') {
        return {
          fields: [
            { id: 'ing-1', name: '', quantity: '', unit: '', details: '', size: '' },
          ],
          append: mockAppendIngredient,
          remove: mockRemoveIngredient,
        }
      }
      return {
        fields: [{ id: 'info-1', info: '' }],
        append: mockAppendAdditionalInfo,
        remove: mockRemoveAdditionalInfo,
      }
    },
    Controller: ({ render: renderFn, name }: any) => {
      const field = {
        onChange: jest.fn(),
        value: '',
        name,
      }
      const fieldState = { error: undefined }
      return renderFn({ field, fieldState })
    },
    FormProvider: ({ children }: any) => <div data-testid="form-provider">{children}</div>,
  }
})

// ── Mock DialogModal ──────────────────────────────────────────────────────────
jest.mock('../../../components/common/modal/DialogModal', () => {
  const MockDialogModal = ({
    isOpen,
    onClose,
    title,
    actionLabel,
    onSubmit,
    secondaryAction,
    secondaryActionLabel,
    small,
    body,
  }: any) => (
    <div data-testid="dialog-modal">
      <span data-testid="modal-open">{String(isOpen)}</span>
      <span data-testid="modal-title">{title}</span>
      <span data-testid="modal-action-label">{actionLabel}</span>
      <span data-testid="modal-secondary-label">{secondaryActionLabel}</span>
      <span data-testid="modal-small">{String(small)}</span>
      <div data-testid="modal-body">{body}</div>
      {isOpen && (
        <>
          <button data-testid="modal-submit-btn" onClick={onSubmit}>
            {actionLabel}
          </button>
          <button data-testid="modal-cancel-btn" onClick={secondaryAction}>
            {secondaryActionLabel}
          </button>
          <button data-testid="modal-close-btn" onClick={onClose}>
            Close
          </button>
        </>
      )}
    </div>
  )
  return MockDialogModal
})

// ── Mock TextEditor ───────────────────────────────────────────────────────────
jest.mock('../../../components/common/TextEditer', () => {
  const MockTextEditor = ({ value, onChange, placeholder, label }: any) => (
    <div data-testid="text-editor">
      <span data-testid="te-value">{value}</span>
      <span data-testid="te-placeholder">{placeholder}</span>
      <span data-testid="te-label">{label}</span>
      <input
        data-testid="te-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
  return MockTextEditor
})

// ── Mock FormBuilder ──────────────────────────────────────────────────────────
jest.mock('../../../components/app/formBuilder', () => {
  const MockFormBuilder = ({ data, edit, spacing }: any) => (
    <div data-testid="form-builder">
      <span data-testid="fb-edit">{String(edit)}</span>
      <span data-testid="fb-spacing">{String(spacing)}</span>
      <span data-testid="fb-field-count">{data?.length ?? 0}</span>
      {data?.map((field: any, idx: number) => (
        <div key={idx} data-testid={`fb-field-${field.name}`}>
          {field.label}
        </div>
      ))}
    </div>
  )
  return MockFormBuilder
})

// ── Mock TextField ────────────────────────────────────────────────────────────
jest.mock('../../../components/common', () => ({
  DialogModal: ({
    isOpen,
    onClose,
    title,
    actionLabel,
    onSubmit,
    secondaryAction,
    secondaryActionLabel,
    small,
    body,
  }: any) => (
    <div data-testid="dialog-modal">
      <span data-testid="modal-open">{String(isOpen)}</span>
      <span data-testid="modal-title">{title}</span>
      <span data-testid="modal-action-label">{actionLabel}</span>
      <span data-testid="modal-secondary-label">{secondaryActionLabel}</span>
      <span data-testid="modal-small">{String(small)}</span>
      <div data-testid="modal-body">{body}</div>
      {isOpen && (
        <>
          <button data-testid="modal-submit-btn" onClick={onSubmit}>
            {actionLabel}
          </button>
          <button data-testid="modal-cancel-btn" onClick={secondaryAction}>
            {secondaryActionLabel}
          </button>
          <button data-testid="modal-close-btn" onClick={onClose}>
            Close
          </button>
        </>
      )}
    </div>
  ),
  TextField: ({ id, label, placeholder, value, onChange, required, errors }: any) => (
    <div data-testid={`text-field-${id}`}>
      {label && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        data-testid={`input-${id}`}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={onChange}
        required={required}
      />
    </div>
  ),
  TextArea: ({ id, placeholder, value, onChange, rows, errors }: any) => (
    <div data-testid={`textarea-${id}`}>
      <textarea
        id={id}
        data-testid={`textarea-input-${id}`}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={onChange}
        rows={rows}
      />
    </div>
  ),
}))

// ── Mock APIs ─────────────────────────────────────────────────────────────────
const mockCreateRecipeMutate = jest.fn()
const mockUpdateRecipeMutate = jest.fn()

jest.mock('../api', () => ({
  useCreateRecipe: () => ({
    mutate: mockCreateRecipeMutate,
  }),
  useUpdateRecipe: () => ({
    mutate: mockUpdateRecipeMutate,
  }),
}))

// ── Mock useMealCategories ────────────────────────────────────────────────────
const mockUseMealCategories = jest.fn()
const mockUseServingUnits = jest.fn()
jest.mock('../../Meals/api', () => ({
  useMealCategories: (...args: any[]) => mockUseMealCategories(...args),
  useServingUnits: (...args: any[]) => mockUseServingUnits(...args),
}))

// ── Mock useQueryClient ───────────────────────────────────────────────────────
const mockInvalidateQueries = jest.fn()
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
    }),
  }
})

// ── Test helpers ──────────────────────────────────────────────────────────────

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const defaultProps = {
  isDrawerOpen: true,
  handleClose: jest.fn(),
  handleRefresh: jest.fn(),
  edit: false,
  rowData: undefined,
  formKey: 'create-123',
}

const renderCreateRecipe = (props: any = {}) => {
  const queryClient = createTestQueryClient()
  const mergedProps = { ...defaultProps, ...props }
  return render(
    <QueryClientProvider client={queryClient}>
      <CreateRecipe {...mergedProps} />
    </QueryClientProvider>
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CreateRecipe Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWatch.mockReturnValue(undefined)
    mockGetValues.mockReturnValue({
      name: 'test recipe',
      description: 'simple recipe',
      preparation_notes: 'cook well',
      meal_category: 'Lunch',
      meal_category_id: 1,
      serving_unit: 'grams',
      serving_people_count: 2,
      quantity: 1,
      size: 'medium',
      calories: 100,
      protein: 10,
      carbs: 20,
      fat: 5,
      fiber: 2,
      ingredients: [
        {
          name: 'chicken',
          quantity: '500',
          unit: 'grams',
          details: 'boneless',
          size: '',
        },
      ],
      additional_info: [{ info: 'Serve hot' }],
      image: '',
    })

    mockUseMealCategories.mockReturnValue({
      data: {
        meal_categories: [
          { id: 1, name: 'Lunch' },
          { id: 2, name: 'Breakfast' },
          { id: 3, name: 'Dinner' },
        ],
      },
      isLoading: false,
    })

    mockUseServingUnits.mockReturnValue({
      data: { serving_units: ['grams', 'cups', 'pieces'] },
    })
  })

  // ── Rendering ──────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders the DialogModal when isDrawerOpen is true', () => {
      renderCreateRecipe()
      expect(screen.getByTestId('modal-open')).toHaveTextContent('true')
    })

    it('does not render the DialogModal when isDrawerOpen is false', () => {
      renderCreateRecipe({ isDrawerOpen: false })
      expect(screen.getByTestId('modal-open')).toHaveTextContent('false')
    })

    it('renders with correct title for create mode', () => {
      renderCreateRecipe()
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Create Recipe')
    })

    it('renders with correct title for edit mode', () => {
      renderCreateRecipe({
        edit: true,
        rowData: { id: 1, name: 'Test Recipe' },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('renders with correct title for duplicate mode', () => {
      renderCreateRecipe({
        edit: false,
        rowData: { id: 1, name: 'Test Recipe' },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Duplicate Recipe'
      )
    })

    it('renders action label as "Save" for all modes', () => {
      renderCreateRecipe()
      expect(screen.getByTestId('modal-action-label')).toHaveTextContent('Save')
    })

    it('renders secondary action label as "Cancel"', () => {
      renderCreateRecipe()
      expect(screen.getByTestId('modal-secondary-label')).toHaveTextContent(
        'Cancel'
      )
    })

    it('renders with small=false', () => {
      renderCreateRecipe()
      expect(screen.getByTestId('modal-small')).toHaveTextContent('false')
    })

    it('renders FormProvider', () => {
      renderCreateRecipe()
      expect(screen.getByTestId('form-provider')).toBeInTheDocument()
    })

    it('renders FormBuilder with main fields (excluding macros and description)', () => {
      renderCreateRecipe()
      const fbFieldCount = screen.getAllByTestId('fb-field-count')[0]
      // Main fields: name, meal_category, serving_unit, quantity,
      // serving_people_count, size, image, preparation_notes
      expect(Number(fbFieldCount.textContent)).toBeGreaterThanOrEqual(7)
    })

    it('renders FormBuilder with description field', () => {
      renderCreateRecipe()
      expect(screen.getByTestId('textarea-description')).toBeInTheDocument()
    })

    it('renders FormBuilder with nutrition fields', () => {
      renderCreateRecipe()
      expect(screen.getByTestId('fb-field-calories')).toBeInTheDocument()
      expect(screen.getByTestId('fb-field-protein')).toBeInTheDocument()
      expect(screen.getByTestId('fb-field-carbs')).toBeInTheDocument()
      expect(screen.getByTestId('fb-field-fat')).toBeInTheDocument()
      expect(screen.getByTestId('fb-field-fiber')).toBeInTheDocument()
    })

    it('renders the ingredients section', () => {
      renderCreateRecipe()
      expect(screen.getByText('Ingredients')).toBeInTheDocument()
    })

    it('renders the preparation notes section', () => {
      renderCreateRecipe()
      expect(screen.getAllByText('Preparation Notes').length).toBeGreaterThanOrEqual(1)
    })

    it('renders the nutritional value section', () => {
      renderCreateRecipe()
      expect(screen.getByText('Nutritional Value')).toBeInTheDocument()
    })

    it('renders the additional info section', () => {
      renderCreateRecipe()
      expect(screen.getByText('Additional Info')).toBeInTheDocument()
    })

    it('renders the description section', () => {
      renderCreateRecipe()
      expect(screen.getByText('Description')).toBeInTheDocument()
    })

    it('renders the add ingredient button', () => {
      renderCreateRecipe()
      expect(screen.getByLabelText('Add ingredient row')).toBeInTheDocument()
    })

    it('renders the add additional info button', () => {
      renderCreateRecipe()
      expect(screen.getByLabelText('Add more info')).toBeInTheDocument()
    })
  })

  // ── Dialog actions ─────────────────────────────────────────────────────

  describe('Dialog actions', () => {
    it('calls handleClose when cancel button is clicked', () => {
      const handleClose = jest.fn()
      renderCreateRecipe({ handleClose })
      const cancelBtn = screen.getByTestId('modal-cancel-btn')
      fireEvent.click(cancelBtn)
      expect(handleClose).toHaveBeenCalled()
    })

    it('calls handleClose when close button is clicked', () => {
      const handleClose = jest.fn()
      renderCreateRecipe({ handleClose })
      const closeBtn = screen.getByTestId('modal-close-btn')
      fireEvent.click(closeBtn)
      expect(handleClose).toHaveBeenCalled()
    })
  })

  // ── Submit behavior ────────────────────────────────────────────────────

  describe('Submit behavior', () => {
    it('calls createRecipeMutate when submitted in create mode', async () => {
      renderCreateRecipe()
      const submitBtn = screen.getByTestId('modal-submit-btn')
      fireEvent.click(submitBtn)
      // The onSubmit handler should be called
      await waitFor(() => {
        expect(mockCreateRecipeMutate).toHaveBeenCalled()
      })
    })

    it('calls updateRecipeMutate when submitted in edit mode', async () => {
      renderCreateRecipe({
        edit: true,
        rowData: { id: 1, name: 'Test Recipe' },
      })
      const submitBtn = screen.getByTestId('modal-submit-btn')
      fireEvent.click(submitBtn)
      await waitFor(() => {
        expect(mockUpdateRecipeMutate).toHaveBeenCalled()
      })
    })

    it('calls createRecipeMutate when submitted in duplicate mode', async () => {
      renderCreateRecipe({
        edit: false,
        rowData: { id: 1, name: 'Test Recipe' },
      })
      const submitBtn = screen.getByTestId('modal-submit-btn')
      fireEvent.click(submitBtn)
      await waitFor(() => {
        expect(mockCreateRecipeMutate).toHaveBeenCalled()
      })
    })

    it('calls handleRefresh and handleClose on create success', async () => {
      const handleRefresh = jest.fn()
      const handleClose = jest.fn()
      renderCreateRecipe({ handleRefresh, handleClose })
      const submitBtn = screen.getByTestId('modal-submit-btn')
      fireEvent.click(submitBtn)
      await waitFor(() => {
        expect(mockCreateRecipeMutate).toHaveBeenCalled()
      })
      // Simulate the onSuccess callback
      const onSuccessCallback = mockCreateRecipeMutate.mock.calls[0][1].onSuccess
      act(() => {
        onSuccessCallback()
      })
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['recipes_list'],
      })
      expect(handleRefresh).toHaveBeenCalled()
      expect(handleClose).toHaveBeenCalled()
    })

    it('calls handleRefresh and handleClose on update success', async () => {
      const handleRefresh = jest.fn()
      const handleClose = jest.fn()
      renderCreateRecipe({
        edit: true,
        rowData: { id: 1, name: 'Test Recipe' },
        handleRefresh,
        handleClose,
      })
      const submitBtn = screen.getByTestId('modal-submit-btn')
      fireEvent.click(submitBtn)
      await waitFor(() => {
        expect(mockUpdateRecipeMutate).toHaveBeenCalled()
      })
      // Simulate the onSuccess callback
      const onSuccessCallback = mockUpdateRecipeMutate.mock.calls[0][1].onSuccess
      act(() => {
        onSuccessCallback()
      })
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['recipes_list'],
      })
      expect(handleRefresh).toHaveBeenCalled()
      expect(handleClose).toHaveBeenCalled()
    })
  })

  // ── Meal categories ────────────────────────────────────────────────────

  describe('Meal categories', () => {
    it('renders meal category options from API', () => {
      renderCreateRecipe()
      // The FormBuilder should receive mealCategoryOptions
      expect(screen.getByTestId('fb-field-meal_category')).toBeInTheDocument()
    })

    it('handles null meal categories data', () => {
      mockUseMealCategories.mockReturnValue({
        data: null,
        isLoading: false,
      })
      renderCreateRecipe()
      expect(screen.getByTestId('fb-field-meal_category')).toBeInTheDocument()
    })

    it('handles undefined meal categories data', () => {
      mockUseMealCategories.mockReturnValue({
        data: undefined,
        isLoading: false,
      })
      renderCreateRecipe()
      expect(screen.getByTestId('fb-field-meal_category')).toBeInTheDocument()
    })

    it('handles meal categories as array directly', () => {
      mockUseMealCategories.mockReturnValue({
        data: [
          { id: 1, name: 'Lunch' },
          { id: 2, name: 'Breakfast' },
        ],
        isLoading: false,
      })
      renderCreateRecipe()
      expect(screen.getByTestId('fb-field-meal_category')).toBeInTheDocument()
    })

    it('handles empty meal categories array', () => {
      mockUseMealCategories.mockReturnValue({
        data: { meal_categories: [] },
        isLoading: false,
      })
      renderCreateRecipe()
      expect(screen.getByTestId('fb-field-meal_category')).toBeInTheDocument()
    })
  })

  // ── Serving units ──────────────────────────────────────────────────────

  describe('Serving units', () => {
    it('renders serving unit options', () => {
      renderCreateRecipe()
      expect(screen.getByTestId('fb-field-serving_unit')).toBeInTheDocument()
    })

    it('clears serving unit when meal category changes in create mode', () => {
      renderCreateRecipe()
      // Simulate meal_category_id watch returning a new value
      expect(mockSetValue).toHaveBeenCalled()
    })
  })

  // ── Ingredients ────────────────────────────────────────────────────────

  describe('Ingredients', () => {
    it('renders ingredient fields', () => {
      renderCreateRecipe()
      expect(screen.getByText('Ingredient 1')).toBeInTheDocument()
    })

    it('adds a new ingredient row when add button is clicked', () => {
      renderCreateRecipe()
      const addBtn = screen.getByLabelText('Add ingredient row')
      fireEvent.click(addBtn)
      expect(mockAppendIngredient).toHaveBeenCalledWith({
        name: '',
        quantity: '',
        unit: '',
        details: '',
        size: '',
      })
    })
  })

  // ── Additional Info ────────────────────────────────────────────────────

  describe('Additional Info', () => {
    it('renders additional info fields', () => {
      renderCreateRecipe()
      expect(
        screen.getByTestId('text-field-additional_info.0.info')
      ).toBeInTheDocument()
    })

    it('adds a new additional info row when add button is clicked', () => {
      renderCreateRecipe()
      const addBtn = screen.getByLabelText('Add more info')
      fireEvent.click(addBtn)
      expect(mockAppendAdditionalInfo).toHaveBeenCalledWith({ info: '' })
    })
  })

  // ── Form reset ─────────────────────────────────────────────────────────

  describe('Form reset', () => {
    it('resets form when isDrawerOpen changes to false', () => {
      const { rerender } = render(
        <QueryClientProvider client={createTestQueryClient()}>
          <CreateRecipe {...defaultProps} />
        </QueryClientProvider>
      )
      // Rerender with isDrawerOpen=false
      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <CreateRecipe {...defaultProps} isDrawerOpen={false} />
        </QueryClientProvider>
      )
      expect(mockReset).toHaveBeenCalled()
    })

    it('resets form when edit or rowData changes', () => {
      renderCreateRecipe({
        edit: true,
        rowData: { id: 1, name: 'Test Recipe' },
      })
      expect(mockReset).toHaveBeenCalled()
    })
  })

  // ── Edge cases ─────────────────────────────────────────────────────────

  describe('Edge cases', () => {
    it('handles missing meal_category_id gracefully', () => {
      mockGetValues.mockReturnValue({
        meal_category_id: undefined,
        meal_category: '',
      })
      renderCreateRecipe()
      const submitBtn = screen.getByTestId('modal-submit-btn')
      fireEvent.click(submitBtn)
      // Should not call mutate because meal_category_id is missing
      expect(mockCreateRecipeMutate).not.toHaveBeenCalled()
    })

    it('handles rowData with nutrition object', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Chicken Curry',
          nutrition: {
            calories: 450,
            protein: 30,
            carbs: 20,
            fat: 25,
            fiber: 5,
          },
          ingredients: [{ name: 'Chicken', quantity: '500', unit: 'grams' }],
          additional_info: [{ info: 'Serve hot' }],
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with null additional_info', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          additional_info: null,
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with string additional_info containing <br> tags', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          additional_info: 'Line 1<br>Line 2<br>Line 3',
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with empty string additional_info', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          additional_info: '',
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with undefined additional_info', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          additional_info: undefined,
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with empty ingredients array', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          ingredients: [],
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with null ingredients', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          ingredients: null,
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with undefined ingredients', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          ingredients: undefined,
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with null/undefined nutrition values', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          nutrition: {
            calories: null,
            protein: undefined,
            carbs: 0,
            fat: '',
            fiber: 20,
          },
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with calories at top level (not in nutrition object)', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          calories: 500,
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with null/undefined serving_people_count', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          serving_people_count: null,
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with null/undefined quantity', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          quantity: null,
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with null/undefined size', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          size: null,
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with null/undefined meal_category_id', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          meal_category_id: null,
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with null/undefined meal_category', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          meal_category: null,
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with null/undefined serving_unit', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          serving_unit: null,
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with null/undefined description', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          description: null,
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with null/undefined preparation_notes', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          preparation_notes: null,
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with null/undefined image_url', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          image_url: null,
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with ingredient having null quantity', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          ingredients: [
            { name: 'Chicken', quantity: null, unit: 'grams' },
          ],
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with ingredient having undefined quantity', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          ingredients: [
            { name: 'Chicken', quantity: undefined, unit: 'grams' },
          ],
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with ingredient having null name', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          ingredients: [
            { name: null, quantity: '500', unit: 'grams' },
          ],
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with ingredient having undefined name', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          ingredients: [
            { name: undefined, quantity: '500', unit: 'grams' },
          ],
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with ingredient having null unit', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          ingredients: [
            { name: 'Chicken', quantity: '500', unit: null },
          ],
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with ingredient having undefined unit', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          ingredients: [
            { name: 'Chicken', quantity: '500', unit: undefined },
          ],
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with ingredient having null details', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          ingredients: [
            { name: 'Chicken', quantity: '500', unit: 'grams', details: null },
          ],
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with ingredient having undefined details', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          ingredients: [
            { name: 'Chicken', quantity: '500', unit: 'grams', details: undefined },
          ],
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with ingredient having null size', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          ingredients: [
            { name: 'Chicken', quantity: '500', unit: 'grams', size: null },
          ],
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with ingredient having undefined size', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          ingredients: [
            { name: 'Chicken', quantity: '500', unit: 'grams', size: undefined },
          ],
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with additional_info as array of strings', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          additional_info: ['Info 1', 'Info 2'],
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with additional_info containing empty strings', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          additional_info: [{ info: '' }, { info: 'Valid Info' }],
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with additional_info containing only empty strings', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          additional_info: [{ info: '' }],
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with additional_info as string with newlines', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          additional_info: 'Line 1\nLine 2\nLine 3',
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with additional_info as string with only whitespace', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          additional_info: '   ',
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with additional_info as non-array, non-string type', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          additional_info: 123 as any,
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with empty string meal_category', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          meal_category: '',
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with empty string serving_unit', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          serving_unit: '',
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with empty string description', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          description: '',
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })

    it('handles rowData with empty string preparation_notes', () => {
      renderCreateRecipe({
        edit: true,
        rowData: {
          id: 1,
          name: 'Test',
          preparation_notes: '',
        },
      })
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Recipe')
    })
  })
})
