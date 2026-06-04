import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { jsPDF } from 'jspdf'
import SubscriptionBodyMeasurementsTab from '../Details/BodyMeasurementsTab'

const mockUseBodyMeasurements = jest.fn()

jest.mock('../../AdminUser/api', () => ({
  useBodyMeasurements: (params: any) => mockUseBodyMeasurements(params),
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

const measurement = {
  id: 1,
  recorded_at: '2026-05-21T08:00:00Z',
  chest: 90,
  waist: 75,
  hip: 95,
  arm: 30,
  thigh: 55,
  neck: 35,
  height: 170,
  weight: 68,
}

const mockJsPDF = jsPDF as unknown as jest.Mock
const originalConsoleError = console.error

describe('SubscriptionBodyMeasurementsTab', () => {
  beforeAll(() => {
    console.error = jest.fn((...args) => {
      const message = args[0]?.toString() || ''
      if (message.includes('ReactDOMTestUtils.act')) return
      ;(originalConsoleError as any)(...args)
    })
  })

  afterAll(() => {
    console.error = originalConsoleError
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockPdfDoc.internal.pageSize.getWidth.mockReturnValue(210)
    mockPdfDoc.internal.pageSize.getHeight.mockReturnValue(297)
    mockJsPDF.mockImplementation(() => mockPdfDoc as any)
  })

  it('calls useBodyMeasurements with subscription params and shows loading state', () => {
    mockUseBodyMeasurements.mockReturnValue({
      data: undefined,
      isFetching: true,
    })

    render(<SubscriptionBodyMeasurementsTab subscription={subscription} />)

    expect(mockUseBodyMeasurements).toHaveBeenCalledWith({
      user_id: 42,
      subscription_id: 99,
      page: 1,
      per_page: 10,
    })
    expect(screen.getByText('Loading measurements...')).toBeInTheDocument()
  })

  it('renders empty state when there are no measurements', () => {
    mockUseBodyMeasurements.mockReturnValue({
      data: { items: [], total_pages: 1 },
      isFetching: false,
    })

    render(<SubscriptionBodyMeasurementsTab subscription={subscription} />)

    expect(screen.getByTestId('icon-no-data-icon')).toBeInTheDocument()
    expect(screen.getByText('No body measurements to display')).toBeInTheDocument()
    expect(screen.queryByText('Generate PDF')).not.toBeInTheDocument()
  })

  it('renders date and all available measurement cards', async () => {
    mockUseBodyMeasurements.mockReturnValue({
      data: { items: [measurement], total_pages: 1 },
      isFetching: false,
    })

    render(<SubscriptionBodyMeasurementsTab subscription={subscription} />)

    await waitFor(() => {
      expect(screen.getByText('2026')).toBeInTheDocument()
      expect(screen.getByText('May')).toBeInTheDocument()
      expect(screen.getByText('21')).toBeInTheDocument()
    })

    expect(screen.getByText('Chest')).toBeInTheDocument()
    expect(screen.getByText('Waist')).toBeInTheDocument()
    expect(screen.getByText('Hip')).toBeInTheDocument()
    expect(screen.getByText('Arm')).toBeInTheDocument()
    expect(screen.getByText('Thigh')).toBeInTheDocument()
    expect(screen.getByText('Neck')).toBeInTheDocument()
    expect(screen.getByText('Height')).toBeInTheDocument()
    expect(screen.getByText('Weight')).toBeInTheDocument()
    ;[90, 75, 95, 30, 55, 35, 170, 68].forEach((value) => {
      expect(screen.getByText(String(value))).toBeInTheDocument()
    })
    expect(screen.getByText('Generate PDF')).toBeInTheDocument()
  })

  it('hides optional measurement cards when values are null or undefined', async () => {
    mockUseBodyMeasurements.mockReturnValue({
      data: {
        items: [
          {
            id: 2,
            recorded_at: null,
            chest: null,
            waist: undefined,
            hip: null,
            arm: undefined,
            thigh: null,
            neck: undefined,
            height: null,
            weight: undefined,
          },
        ],
        total_pages: 1,
      },
      isFetching: false,
    })

    render(<SubscriptionBodyMeasurementsTab subscription={subscription} />)

    await waitFor(() => expect(screen.getByText('Generate PDF')).toBeInTheDocument())

    expect(screen.queryByText('Chest')).not.toBeInTheDocument()
    expect(screen.queryByText('Waist')).not.toBeInTheDocument()
    expect(screen.queryByText('Hip')).not.toBeInTheDocument()
    expect(screen.queryByText('Arm')).not.toBeInTheDocument()
    expect(screen.queryByText('Thigh')).not.toBeInTheDocument()
    expect(screen.queryByText('Neck')).not.toBeInTheDocument()
    expect(screen.queryByText('Height')).not.toBeInTheDocument()
    expect(screen.queryByText('Weight')).not.toBeInTheDocument()
  })

  it('loads the next page and appends only new measurements', async () => {
    const firstPage = {
      data: { items: [measurement], total_pages: 2 },
      isFetching: false,
    }
    const secondPage = {
      data: {
        items: [
          measurement,
          {
            id: 3,
            recorded_at: '2026-05-22T08:00:00Z',
            chest: 91,
            waist: 74,
          },
        ],
        total_pages: 2,
      },
      isFetching: false,
    }

    mockUseBodyMeasurements.mockImplementation((params: any) => {
      if (params.page === 2) {
        return secondPage
      }

      return firstPage
    })

    render(<SubscriptionBodyMeasurementsTab subscription={subscription} />)

    expect(await screen.findByText('90')).toBeInTheDocument()
    fireEvent.click(screen.getByText('View more'))

    await waitFor(() => {
      expect(screen.getByText('91')).toBeInTheDocument()
      expect(screen.queryByText('View more')).not.toBeInTheDocument()
    })
    expect(screen.getAllByText('90')).toHaveLength(1)
    expect(mockUseBodyMeasurements).toHaveBeenLastCalledWith({
      user_id: 42,
      subscription_id: 99,
      page: 2,
      per_page: 10,
    })
  })

  it('disables the view more button while fetching additional measurements', async () => {
    mockUseBodyMeasurements.mockReturnValue({
      data: { items: [measurement], total_pages: 2 },
      isFetching: true,
    })

    render(<SubscriptionBodyMeasurementsTab subscription={subscription} />)

    await waitFor(() =>
      expect(screen.getByText('Loading more...')).toBeDisabled()
    )
  })

  it('generates a body measurements PDF for rendered items', async () => {
    mockUseBodyMeasurements.mockReturnValue({
      data: { items: [measurement], total_pages: 1 },
      isFetching: false,
    })

    render(<SubscriptionBodyMeasurementsTab subscription={subscription} />)

    expect(await screen.findByText('Generate PDF')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Generate PDF'))

    expect(mockJsPDF).toHaveBeenCalledWith('p', 'mm', 'a4')
    expect(mockPdfDoc.text).toHaveBeenCalledWith(
      'Body Measurements Report',
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
    ;['90', '75', '95', '30', '55', '35'].forEach((value) => {
      expect(mockPdfDoc.text).toHaveBeenCalledWith(
        value,
        expect.any(Number),
        expect.any(Number)
      )
    })
    expect(mockPdfDoc.save).toHaveBeenCalledWith(
      'subscription-body-measurements.pdf'
    )
  })

  it('adds a new PDF page when rows exceed available page height', async () => {
    const manyMeasurements = Array.from({ length: 36 }, (_, index) => ({
      id: index + 1,
      recorded_at: '2026-05-21T08:00:00Z',
      chest: 80 + index,
      waist: 70,
      hip: 90,
      arm: 30,
      thigh: 50,
      neck: 35,
    }))
    mockUseBodyMeasurements.mockReturnValue({
      data: { items: manyMeasurements, total_pages: 1 },
      isFetching: false,
    })

    render(<SubscriptionBodyMeasurementsTab subscription={subscription} />)

    expect(await screen.findByText('Generate PDF')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Generate PDF'))

    expect(mockPdfDoc.addPage).toHaveBeenCalled()
    expect(mockPdfDoc.save).toHaveBeenCalledWith(
      'subscription-body-measurements.pdf'
    )
  })
})
