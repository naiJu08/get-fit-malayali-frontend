import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import AdditionalInfo from '../Details/AdditionalInfo'

jest.mock('../api', () => ({
  getUserAdditionalData: jest.fn(),
  saveUserAdditionalData: jest.fn(),
  updateUserAdditionalData: jest.fn(),
}))

jest.mock('../../AssessmentCategory/api', () => ({
  useAssessmentCategories: jest.fn(),
}))

jest.mock('../../../components/common/icons', () => (props: any) => (
  <span data-testid={`icon-${props?.name ?? 'unknown'}`} />
))

jest.mock('../../../components/app/alertBox/infoBox', () => (props: any) => (
  <div>{props?.content}</div>
))

jest.mock('../../../components/common/snackbar', () => {
  const actual = jest.requireActual('../../../components/common/snackbar')
  const enqueueSnackbar = jest.fn()
  return {
    ...actual,
    __enqueueSnackbar: enqueueSnackbar,
    useSnackbarManager: () => ({ enqueueSnackbar }),
  }
})

jest.mock('../../../components/common/table/SmartTable', () => {
  return function MockSmartTable(props: any) {
    return (
      <div data-testid="additionalinfo-table">
        <div>
          {props?.actionProps?.map?.((a: any) => (
            <button
              key={a.title}
              type="button"
              onClick={() =>
                a?.action?.({
                  additionalData: props?.data?.[0]?.additionalData,
                })
              }
            >
              {a.title}
            </button>
          ))}
        </div>
      </div>
    )
  }
})

jest.mock('../../../components/common/modal/DialogModal', () => (props: any) =>
  props?.isOpen ? (
    <div>
      <div>{props?.title}</div>
      {props?.body}
    </div>
  ) : null
)

jest.mock('../../../components/app/formBuilder', () => {
  const React = require('react')
  const { useFormContext } = require('react-hook-form')
  return function MockFormBuilder(props: any) {
    const { setValue } = useFormContext()
    const fields = Array.isArray(props?.data) ? props.data : []
    return (
      <div>
        {fields.map((f: any) => {
          const key = String(f?.id ?? f?.name)
          return (
            <label key={key}>
              <span>{f?.label ?? f?.name}</span>
              <input
                data-testid={`fb-${key}`}
                defaultValue=""
                onChange={(e) => {
                  if (f?.name) {
                    setValue(String(f.name), e.target.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  if (f?.id && f?.id !== f?.name) {
                    setValue(String(f.id), e.target.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  if (typeof f?.handleCallBack === 'function') {
                    f.handleCallBack()
                  }
                }}
              />
            </label>
          )
        })}
      </div>
    )
  }
})

describe('AdditionalInfo', () => {
  beforeEach(() => {
    const api = jest.requireMock('../api')
    api.getUserAdditionalData.mockReset()
    api.saveUserAdditionalData.mockReset()
    api.updateUserAdditionalData.mockReset()

    const assessment = jest.requireMock('../../AssessmentCategory/api')
    assessment.useAssessmentCategories.mockReset()
    assessment.useAssessmentCategories.mockReturnValue({
      data: { assessment_categories: [] },
    })
  })

  it('renders missing user id message', () => {
    render(<AdditionalInfo user={{}} subscriptionId={null} /> as any)
    expect(
      screen.getByText(/User identifier is required to load additional information/i)
    ).toBeInTheDocument()
  })

  it('shows a loading state while fetching and then falls back to the empty state', async () => {
    const api = jest.requireMock('../api')
    let resolveRequest: (value: any) => void = () => undefined
    api.getUserAdditionalData.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve
      })
    )

    render(<AdditionalInfo user={{ id: '1' }} subscriptionId="sub" />)

    expect(
      await screen.findByText(/Loading additional information/i)
    ).toBeInTheDocument()

    resolveRequest({ additional_data: [] })

    await waitFor(() =>
      expect(
        screen.getByText(/No nutritional assessment available for this user/i)
      ).toBeInTheDocument()
    )
  })

  it('treats 404 fetches as an empty state without showing a load error', async () => {
    const api = jest.requireMock('../api')
    api.getUserAdditionalData.mockRejectedValue({ response: { status: 404 } })

    const snackbar = jest.requireMock('../../../components/common/snackbar')
    const enqueueSnackbar = snackbar.__enqueueSnackbar as jest.Mock

    render(<AdditionalInfo user={{ id: '1' }} subscriptionId="sub" />)

    await waitFor(() =>
      expect(
        screen.getByText(/No nutritional assessment available for this user/i)
      ).toBeInTheDocument()
    )
    expect(enqueueSnackbar).not.toHaveBeenCalledWith(
      'Failed to load additional information.',
      expect.anything()
    )
  })

  it('creates assessment data and saves via API', async () => {
    const api = jest.requireMock('../api')
    api.getUserAdditionalData.mockResolvedValue({ additional_data: [] })
    api.saveUserAdditionalData.mockResolvedValue({
      message: 'Saved',
      additional_data: { id: 'new-1', package: 'pkg' },
    })

    const assessment = jest.requireMock('../../AssessmentCategory/api')
    assessment.useAssessmentCategories.mockReturnValue({
      data: {
        assessment_categories: [
          {
            id: '1',
            name: 'General',
            assessment_questions: [{ id: '10', question_text: 'Q1?' }],
          },
        ],
      },
    })

    render(<AdditionalInfo user={{ id: '1', height: 170, weight: 70 }} subscriptionId="sub" />)

    await screen.findByRole('button', { name: /Create/i })
    fireEvent.click(screen.getByRole('button', { name: /Create/i }))

    // Choose a category so the questions render, then answer "Yes" to make form dirty.
    fireEvent.change(screen.getByTestId('fb-assessment_categories.0.assessment_category_id'), {
      target: { value: '1' },
    })

    fireEvent.click(await screen.findByLabelText(/Yes/i))

    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    await waitFor(() => expect(api.saveUserAdditionalData).toHaveBeenCalled())
  })

  it('opens view mode for saved data and edit mode updates existing additional info', async () => {
    const api = jest.requireMock('../api')
    api.getUserAdditionalData.mockResolvedValue({
      additional_data: [
        {
          id: 'existing-1',
          package: 'diet_only',
          social_habits: 'karaoke nights',
          preferred_workout_yoga_time: 'late evening',
          height: '170',
          weight: '70',
          bmi: '24.2',
          assessment_answers: [
            {
              id: 'ans-1',
              assessment_category_id: 1,
              assessment_question_id: 10,
              answer: true,
              category_name: 'General',
            },
          ],
        },
      ],
    })
    api.updateUserAdditionalData.mockResolvedValue({
      message: 'Updated',
      additional_data: {
        id: 'existing-1',
        package: 'diet_only',
      },
    })

    const assessment = jest.requireMock('../../AssessmentCategory/api')
    assessment.useAssessmentCategories.mockReturnValue({
      data: {
        assessment_categories: [
          {
            id: '1',
            name: 'General',
            assessment_questions: [{ id: '10', question_text: 'Q1?' }],
          },
        ],
      },
    })

    render(<AdditionalInfo user={{ id: '1', height: 170, weight: 70 }} subscriptionId="sub" />)

    await screen.findByRole('button', { name: /View/i })
    fireEvent.click(screen.getByRole('button', { name: /View/i }))
    expect(
      await screen.findByText('Nutritional Assessment Details')
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Edit/i }))
    expect(
      await screen.findByText('Edit Nutritional Assessment')
    ).toBeInTheDocument()

    fireEvent.change(screen.getByTestId('fb-social_habits_other'), {
      target: { value: 'party' },
    })
    fireEvent.change(screen.getByTestId('fb-preferred_workout_yoga_time_other'), {
      target: { value: 'late night' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    await waitFor(() =>
      expect(api.updateUserAdditionalData).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          social_habits: 'party',
          social_habits_other: '',
          preferred_workout_yoga_time: 'late night',
          preferred_workout_yoga_time_other: '',
          assessment_answers_attributes: [
            {
              id: 'ans-1',
              assessment_category_id: 1,
              assessment_question_id: 10,
              answer: true,
            },
          ],
        }),
        'existing-1'
      )
    )
  })

  it('shows error when editing without an id', async () => {
    const api = jest.requireMock('../api')
    api.getUserAdditionalData.mockResolvedValue({
      additional_data: [{ package: 'pkg-without-id' }],
    })

    const assessment = jest.requireMock('../../AssessmentCategory/api')
    assessment.useAssessmentCategories.mockReturnValue({ data: { assessment_categories: [] } })

    const snackbar = jest.requireMock('../../../components/common/snackbar')
    const enqueueSnackbar = snackbar.__enqueueSnackbar as jest.Mock

    render(<AdditionalInfo user={{ id: '1' }} subscriptionId="sub" />)

    await screen.findByRole('button', { name: /Edit/i })
    fireEvent.click(screen.getByRole('button', { name: /Edit/i }))
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    await waitFor(() =>
      expect(enqueueSnackbar).toHaveBeenCalledWith(
        expect.stringMatching(/id is required to update/i),
        expect.anything()
      )
    )
  })

  it('shows the fallback error when saving fails without an API message', async () => {
    const api = jest.requireMock('../api')
    api.getUserAdditionalData.mockResolvedValue({ additional_data: [] })
    api.saveUserAdditionalData.mockRejectedValue({ response: { data: {} } })

    const assessment = jest.requireMock('../../AssessmentCategory/api')
    assessment.useAssessmentCategories.mockReturnValue({
      data: {
        assessment_categories: [
          {
            id: '1',
            name: 'General',
            assessment_questions: [{ id: '10', question_text: 'Q1?' }],
          },
        ],
      },
    })

    const snackbar = jest.requireMock('../../../components/common/snackbar')
    const enqueueSnackbar = snackbar.__enqueueSnackbar as jest.Mock

    render(<AdditionalInfo user={{ id: '1', height: 170, weight: 70 }} subscriptionId="sub" />)

    await screen.findByRole('button', { name: /Create/i })
    fireEvent.click(screen.getByRole('button', { name: /Create/i }))
    fireEvent.change(screen.getByTestId('fb-assessment_categories.0.assessment_category_id'), {
      target: { value: '1' },
    })
    fireEvent.click(await screen.findByLabelText(/Yes/i))
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    await waitFor(() =>
      expect(enqueueSnackbar).toHaveBeenCalledWith(
        'An unexpected error occurred',
        expect.anything()
      )
    )
  })
})
