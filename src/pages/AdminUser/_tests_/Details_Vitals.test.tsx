import { cleanup } from '@testing-library/react'
import { fireEvent, render, screen } from '@testing-library/react/pure'

jest.mock('../api', () => ({
  useVitals: jest.fn(),
}))

jest.mock('../../../components/common/icons', () => (props: any) => (
  <span data-testid={`icon-${props?.name ?? 'unknown'}`} />
))

jest.mock('../../../components/common/buttons/Button', () => (props: any) => (
  <button type="button" onClick={props?.onClick}>
    {props?.label ?? props?.children ?? 'button'}
  </button>
))

jest.mock('moment', () => {
  const moment = (_input?: any) => ({
    format: (fmt?: string) => {
      if (fmt === 'YYYY') return '2026'
      if (fmt === 'MMMM') return 'January'
      if (fmt === 'DD') return '01'
      return '01 Jan 2026'
    },
  })

  return { __esModule: true, default: moment }
})

jest.mock('jspdf', () => {
  const save = jest.fn()

  function jsPDF(this: any) {
    this.internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } }
    this.setFontSize = jest.fn()
    this.setTextColor = jest.fn()
    this.text = jest.fn()
    this.splitTextToSize = jest.fn((text: string) => [text])
    this.setFillColor = jest.fn()
    this.setDrawColor = jest.fn()
    this.setLineWidth = jest.fn()
    this.rect = jest.fn()
    this.addPage = jest.fn()
    this.save = save
  }

  return { __esModule: true, jsPDF, __save: save }
})

const { useVitals } = jest.requireMock('../api')

// Import after mocks so heavy deps (e.g. jspdf) are never loaded.
const Vitals = require('../Details/Vitals').default

describe('Vitals Component', () => {
  beforeEach(() => {
    useVitals.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows empty state when no items', () => {
    useVitals.mockReturnValue({ data: { items: [] }, isFetching: false })
    render(<Vitals user={{ id: 'u1' }} subscriptionId={null} />)
    expect(screen.getByText(/No vitals to display/i)).toBeInTheDocument()
  })

  it('shows loading state', () => {
    useVitals.mockReturnValue({ data: undefined, isFetching: true })
    render(<Vitals user={{ id: 'u1' }} subscriptionId={null} />)
    expect(screen.getByText(/Loading vitals/i)).toBeInTheDocument()
  })

  it('renders items and shows the generate PDF button', () => {
    useVitals.mockReturnValue({
      data: {
        items: [
          {
            id: 1,
            recorded_at: '2026-01-01T00:00:00Z',
            sleep_hours: 7,
            water_intake: 2,
            steps: 1234,
            heart_rate: 80,
            blood_pressure: '120/80',
            sugar_level: 90,
          },
        ],
        total_pages: 1,
      },
      isFetching: false,
    })

    render(<Vitals user={{ id: 'u1' }} subscriptionId={null} />)
    expect(screen.getByText(/Generate PDF/i)).toBeInTheDocument()
  })

  it('paginates with "View more" and appends items', async () => {
    const page1 = {
      data: {
        items: [{ id: 1, recorded_at: '2026-01-01T00:00:00Z', steps: 111 }],
        total_pages: 2,
      },
      isFetching: false,
    }
    const page2 = {
      data: {
        items: [{ id: 2, recorded_at: '2026-01-02T00:00:00Z', steps: 222 }],
        total_pages: 2,
      },
      isFetching: false,
    }

    useVitals.mockImplementation((params: any) =>
      params?.page === 2 ? page2 : page1
    )

    render(<Vitals user={{ id: 'u1' }} subscriptionId={null} />)

    expect(screen.getByText('111')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /view more/i }))
    expect(await screen.findByText('222')).toBeInTheDocument()
  })

  it('generates a PDF when clicking "Generate PDF"', () => {
    useVitals.mockReturnValue({
      data: {
        items: [
          {
            id: 1,
            recorded_at: '2026-01-01T00:00:00Z',
            sleep_hours: 7,
            water_intake: 2,
            steps: 1234,
          },
        ],
        total_pages: 1,
      },
      isFetching: false,
    })

    render(<Vitals user={{ id: 'u1' }} subscriptionId={null} />)
    fireEvent.click(screen.getByRole('button', { name: /Generate PDF/i }))

    const pdfMock = jest.requireMock('jspdf')
    expect(pdfMock.__save).toHaveBeenCalledWith('vitals.pdf')
  })

  it('renders fallback date and hides empty metric cards', () => {
    useVitals.mockReturnValue({
      data: {
        items: [
          {
            id: 3,
            recorded_at: null,
            heart_rate: null,
            blood_pressure: '',
            sugar_level: null,
            sleep_hours: null,
            water_intake: null,
            steps: null,
          },
        ],
        total_pages: 1,
      },
      isFetching: false,
    })

    render(<Vitals user={{ id: 'u1' }} subscriptionId={null} />)

    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByText(/Heart Rate/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Blood Pressure/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Sugar Level/i)).not.toBeInTheDocument()
  })

  it('does not paginate while fetching more', () => {
    useVitals.mockReturnValue({
      data: {
        items: [{ id: 1, recorded_at: '2026-01-01T00:00:00Z', steps: 111 }],
        total_pages: 2,
      },
      isFetching: true,
    })

    render(<Vitals user={{ id: 'u1' }} subscriptionId={null} />)

    const viewMoreButton = screen.getByRole('button', { name: /loading more/i })
    expect(viewMoreButton).toBeDisabled()
    useVitals.mockClear()
    fireEvent.click(viewMoreButton)

    expect(useVitals).not.toHaveBeenCalled()
  })
})
