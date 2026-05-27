import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

import DietPlanForm from '../create'

const originalConsoleLog = console.log
beforeAll(() => {
  console.log = jest.fn()
})

afterAll(() => {
  console.log = originalConsoleLog
})

const mockCreateMutate = jest.fn()
const mockUpdateMutate = jest.fn()
let mockMealFields: any[] = []
let mockWatchedMeals: any[] = []

jest.mock('../api', () => ({
  useCreateDietPlan: () => ({ mutate: mockCreateMutate, isLoading: false }),
  useUpdateDietPlan: () => ({ mutate: mockUpdateMutate, isLoading: false }),
  useDietPlanDetail: () => ({ data: undefined }),
}))

jest.mock('../../../api', () => ({
  usePlan: () => ({ data: { plan: { duration_days: 7 } } }),
}))

jest.mock('../../../../Meals/api', () => ({
  useMeals: () => ({ data: { meals: [] }, refetch: jest.fn() }),
}))

jest.mock('../../../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({ enqueueSnackbar: jest.fn() }),
}))

jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: jest.fn(() => () => ({})),
}))

jest.mock('react-hook-form', () => ({
  FormProvider: ({ children }: any) => <>{children}</>,
  Controller: ({ render }: any) =>
    render({ field: { value: '', onChange: jest.fn() } }),
  useFieldArray: () => ({
    fields: mockMealFields,
    append: jest.fn(),
    remove: jest.fn(),
    replace: jest.fn(),
  }),
  useForm: () => ({
    control: {} as any,
    reset: jest.fn(),
    setValue: jest.fn(),
    watch: (key: string) => {
      if (key === 'meals') return mockWatchedMeals
      if (key === 'meal_time') return 'Breakfast'
      if (key === 'day_name') return 'Monday'
      if (key === 'day_number') return 1
      return ''
    },
    formState: { errors: {} },
    handleSubmit:
      (cb: any) =>
      () =>
        cb({
          plan_id: 1,
          day_number: 1,
          day_name: 'Monday',
          sequence_number: 1,
          meal_time: 'Breakfast',
          meal_name: '',
          calories: '',
          meals: [],
        }),
  }),
}))

jest.mock('qbs-core', () => ({
  AutoComplete: () => <div data-testid="autocomplete" />,
}))

jest.mock('../../../../../components/common/inputs/ToggleSwitch', () => ({
  __esModule: true,
  default: () => <div data-testid="toggle" />,
}))

jest.mock('../../../../../components/common/buttons/Button', () => ({
  __esModule: true,
  default: ({ label, onClick }: any) => (
    <button onClick={onClick}>{label}</button>
  ),
}))

jest.mock('../../../../../components/common', () => ({
  DialogModal: ({ isOpen, title, onSubmit, body }: any) =>
    isOpen ? (
      <div data-testid="dialog-modal">
        <div>{title}</div>
        <div data-testid="dialog-body">{body}</div>
        <button data-testid="submit" onClick={onSubmit}>
          Submit
        </button>
      </div>
    ) : null,
  TextField: () => null,
}))

jest.mock('../../../../../components/app/formBuilder', () => ({
  __esModule: true,
  default: () => <div data-testid="form-builder" />,
}))

describe('DietPlanForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMealFields = []
    mockWatchedMeals = []
  })

  it('submits create when not editing', () => {
    render(<DietPlanForm isOpen={true} handleClose={jest.fn()} planId={1} />)
    fireEvent.click(screen.getByTestId('submit'))
    expect(mockCreateMutate).toHaveBeenCalled()
  })

  it('submits update when editing and rowData.id present', () => {
    render(
      <DietPlanForm
        isOpen={true}
        handleClose={jest.fn()}
        planId={1}
        edit={true}
        rowData={{ id: 10, plan_id: 1, day_number: 1 }}
      />
    )
    fireEvent.click(screen.getByTestId('submit'))
    expect(mockUpdateMutate).toHaveBeenCalled()
  })

  it('renders meals section when field array has items', () => {
    mockMealFields = [{ id: 'm1' }]
    mockWatchedMeals = [{ meal_id: 1, count: 1, requirement: 'Optional' }]

    render(<DietPlanForm isOpen={true} handleClose={jest.fn()} planId={1} />)
    expect(screen.getByTestId('dialog-modal')).toBeInTheDocument()
    // basic smoke assertion that dialog body rendered
    expect(screen.getByTestId('dialog-body')).toBeInTheDocument()
  })
})
