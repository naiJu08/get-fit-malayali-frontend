import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

import WorkoutPlanForm from '../create'

const mockCreateMutate = jest.fn()
const mockUpdateMutate = jest.fn()

jest.mock('../api', () => ({
  useCreateWorkoutPlan: () => ({ mutate: mockCreateMutate, isLoading: false }),
  useUpdateWorkoutPlan: () => ({ mutate: mockUpdateMutate, isLoading: false }),
}))

jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: jest.fn(() => () => ({})),
}))

jest.mock('react-hook-form', () => ({
  FormProvider: ({ children }: any) => <>{children}</>,
  useForm: () => ({
    reset: jest.fn(),
    handleSubmit:
      (cb: any) =>
      () =>
        cb({
          plan_id: 1,
          day_number: 1,
          title: 'T',
          description: '',
        }),
  }),
}))

jest.mock('../../../../../components/app/formBuilder', () => ({
  __esModule: true,
  default: () => <div data-testid="form-builder" />,
}))

jest.mock('../../../../../components/common', () => ({
  DialogModal: ({ isOpen, title, onSubmit }: any) =>
    isOpen ? (
      <div data-testid="dialog-modal">
        <div>{title}</div>
        <button data-testid="submit" onClick={onSubmit}>
          Submit
        </button>
      </div>
    ) : null,
}))

describe('WorkoutPlanForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('submits create when not editing', () => {
    render(<WorkoutPlanForm isOpen={true} handleClose={jest.fn()} planId={1} />)
    fireEvent.click(screen.getByTestId('submit'))
    expect(mockCreateMutate).toHaveBeenCalled()
  })

  it('submits update when editing and rowData.id present', () => {
    render(
      <WorkoutPlanForm
        isOpen={true}
        handleClose={jest.fn()}
        planId={1}
        edit={true}
        rowData={{ id: 9, plan_id: 1 }}
      />
    )
    fireEvent.click(screen.getByTestId('submit'))
    expect(mockUpdateMutate).toHaveBeenCalled()
  })
})

