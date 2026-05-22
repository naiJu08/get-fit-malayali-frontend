import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import SubscriptionVitalsTab from '../Details/VitalsTab'
import { useVitals } from '../../AdminUser/api'
import { jsPDF } from 'jspdf'

const mockUseVitals = jest.fn()

jest.mock('../../AdminUser/api', () => ({
  useVitals: (params: any) => mockUseVitals(params),
}))

const mockPdfDoc = {
  internal: {
    pageSize: {
      getWidth: jest.fn(() => 210),
      getHeight: jest.fn(() => 297),
    },
  },
  setFontSize: jest.fn(),
  setTextColor: jest.fn(),
  setFillColor: jest.fn(),
  setDrawColor: jest.fn(),
  setLineWidth: jest.fn(),
  rect: jest.fn(),
  text: jest.fn(),
  addPage: jest.fn(),
  save: jest.fn(),
}

jest.mock('jspdf', () => ({
  jsPDF: jest.fn(() => mockPdfDoc),
}))

jest.mock('../../../components/common/icons', () => {
  const MockIcons = ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`}>{name}</span>
  )

  return MockIcons
})

jest.mock('../../../components/common/buttons/Button', () => {
  const MockButton = ({ label, onClick, className }: any) => (
    <button type="button" className={className} onClick={onClick}>
      {label}
    </button>
  )

  return MockButton
})

const subscription = {
  id: 99,
  user_id: 42,
}

const firstVitals = [
  {
    id: 1,
    recorded_at: '2026-05-21T08:00:00Z',
    heart_rate: 78,
    blood_pressure: '120/80',
    sugar_level: 95,
    sleep_hours: 7.5,
    water_intake: 2,
    steps: 9000,
  },
]

describe('SubscriptionVitalsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(jsPDF as jest.Mock).mockImplementation(() => mockPdfDoc)
  })

  it('calls useVitals with subscription params and shows loading state', () => {
    mockUseVitals.mockReturnValue({
      data: undefined,
      isFetching: true,
    })

    render(<SubscriptionVitalsTab subscription={subscription} />)

    expect(useVitals).toHaveBeenCalledWith({
      user_id: 42,
      subscription_id: 99,
      page: 1,
      per_page: 10,
    })
    expect(screen.getByText('Loading vitals...')).toBeInTheDocument()
  })

  it('renders empty state when there are no vitals', () => {
    mockUseVitals.mockReturnValue({
      data: { items: [], total_pages: 1 },
      isFetching: false,
    })

    render(<SubscriptionVitalsTab subscription={subscription} />)

    expect(screen.getByTestId('icon-no-data-icon')).toBeInTheDocument()
    expect(screen.getByText('No vitals to display')).toBeInTheDocument()
    expect(screen.queryByText('Generate PDF')).not.toBeInTheDocument()
  })

  it('renders all available vital cards and date parts', async () => {
    mockUseVitals.mockReturnValue({
      data: { items: firstVitals, total_pages: 1 },
      isFetching: false,
    })

    render(<SubscriptionVitalsTab subscription={subscription} />)

    await waitFor(() => {
      expect(screen.getByText('2026')).toBeInTheDocument()
      expect(screen.getByText('May')).toBeInTheDocument()
      expect(screen.getByText('21')).toBeInTheDocument()
    })

    expect(screen.getByText('Heart Rate')).toBeInTheDocument()
    expect(screen.getByText('78 bpm')).toBeInTheDocument()
    expect(screen.getByText('Blood Pressure')).toBeInTheDocument()
    expect(screen.getByText('120/80')).toBeInTheDocument()
    expect(screen.getByText('Sugar Level')).toBeInTheDocument()
    expect(screen.getByText('95 mg/dL')).toBeInTheDocument()
    expect(screen.getByText('Sleep')).toBeInTheDocument()
    expect(screen.getByText('7.5 hrs')).toBeInTheDocument()
    expect(screen.getByText('Water Intake')).toBeInTheDocument()
    expect(screen.getByText('2 G')).toBeInTheDocument()
    expect(screen.getByText('Steps')).toBeInTheDocument()
    expect(screen.getByText('9000')).toBeInTheDocument()
    expect(screen.getByText('Generate PDF')).toBeInTheDocument()
  })

  it('does not render optional vital cards for null, undefined, or empty values', async () => {
    mockUseVitals.mockReturnValue({
      data: {
        items: [
          {
            id: 2,
            recorded_at: null,
            heart_rate: null,
            blood_pressure: '',
            sugar_level: undefined,
            sleep_hours: null,
            water_intake: undefined,
            steps: null,
          },
        ],
        total_pages: 1,
      },
      isFetching: false,
    })

    render(<SubscriptionVitalsTab subscription={subscription} />)

    await waitFor(() => {
      expect(screen.getByText('Generate PDF')).toBeInTheDocument()
    })

    expect(screen.queryByText('Heart Rate')).not.toBeInTheDocument()
    expect(screen.queryByText('Blood Pressure')).not.toBeInTheDocument()
    expect(screen.queryByText('Sugar Level')).not.toBeInTheDocument()
    expect(screen.queryByText('Sleep')).not.toBeInTheDocument()
    expect(screen.queryByText('Water Intake')).not.toBeInTheDocument()
    expect(screen.queryByText('Steps')).not.toBeInTheDocument()
  })

  it('loads the next page and appends only new vitals', async () => {
    mockUseVitals.mockImplementation((params: any) => {
      if (params.page === 2) {
        return {
          data: {
            items: [
              firstVitals[0],
              {
                id: 3,
                recorded_at: '2026-05-22T08:00:00Z',
                sleep_hours: 8,
                water_intake: 3,
                steps: 11000,
              },
            ],
            total_pages: 2,
          },
          isFetching: false,
        }
      }

      return {
        data: { items: firstVitals, total_pages: 2 },
        isFetching: false,
      }
    })

    render(<SubscriptionVitalsTab subscription={subscription} />)

    await waitFor(() => expect(screen.getByText('9000')).toBeInTheDocument())
    fireEvent.click(screen.getByText('View more'))

    await waitFor(() => {
      expect(screen.getByText('11000')).toBeInTheDocument()
      expect(screen.queryByText('View more')).not.toBeInTheDocument()
    })
    expect(screen.getAllByText('9000')).toHaveLength(1)
    expect(useVitals).toHaveBeenLastCalledWith({
      user_id: 42,
      subscription_id: 99,
      page: 2,
      per_page: 10,
    })
  })

  it('disables the view more button while fetching', async () => {
    mockUseVitals.mockReturnValue({
      data: { items: firstVitals, total_pages: 2 },
      isFetching: true,
    })

    render(<SubscriptionVitalsTab subscription={subscription} />)

    await waitFor(() => expect(screen.getByText('Loading more...')).toBeDisabled())
  })

  it('generates a vitals PDF for rendered items', async () => {
    mockUseVitals.mockReturnValue({
      data: { items: firstVitals, total_pages: 1 },
      isFetching: false,
    })

    render(<SubscriptionVitalsTab subscription={subscription} />)

    await waitFor(() => expect(screen.getByText('Generate PDF')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Generate PDF'))

    expect(jsPDF).toHaveBeenCalledWith('p', 'mm', 'a4')
    expect(mockPdfDoc.text).toHaveBeenCalledWith(
      'Vitals Report',
      105,
      18,
      { align: 'center' }
    )
    expect(mockPdfDoc.text).toHaveBeenCalledWith(
      expect.stringContaining('Subscription #99'),
      105,
      26,
      { align: 'center' }
    )
    expect(mockPdfDoc.text).toHaveBeenCalledWith(
      '21 May 2026',
      expect.any(Number),
      expect.any(Number)
    )
    expect(mockPdfDoc.text).toHaveBeenCalledWith(
      '7.5 hrs',
      expect.any(Number),
      expect.any(Number)
    )
    expect(mockPdfDoc.text).toHaveBeenCalledWith(
      '2 L',
      expect.any(Number),
      expect.any(Number)
    )
    expect(mockPdfDoc.text).toHaveBeenCalledWith(
      '9000',
      expect.any(Number),
      expect.any(Number)
    )
    expect(mockPdfDoc.save).toHaveBeenCalledWith('subscription-vitals.pdf')
  })

  it('adds new pages when PDF rows exceed the current page height', async () => {
    const manyVitals = Array.from({ length: 45 }, (_, index) => ({
      id: index + 1,
      recorded_at: '2026-05-21T08:00:00Z',
      sleep_hours: 6,
      water_intake: 2,
      steps: index,
    }))

    mockUseVitals.mockReturnValue({
      data: { items: manyVitals, total_pages: 1 },
      isFetching: false,
    })

    render(<SubscriptionVitalsTab subscription={subscription} />)

    await waitFor(() => expect(screen.getByText('Generate PDF')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Generate PDF'))

    expect(mockPdfDoc.addPage).toHaveBeenCalled()
    expect(mockPdfDoc.save).toHaveBeenCalledWith('subscription-vitals.pdf')
  })
})
