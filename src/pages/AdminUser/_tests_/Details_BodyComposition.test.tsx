import { fireEvent, render, screen } from '@testing-library/react'
import BodyComposition from '../Details/BodyComposition'

jest.mock('../api', () => ({
  useBodyCompositions: jest.fn(),
}))

jest.mock('../../../components/common/icons', () => (props: any) => (
  <span data-testid={`icon-${props?.name ?? 'unknown'}`} />
))

describe('BodyComposition', () => {
  const page1 = {
    data: {
      items: [{ id: '1', recorded_at: '2026-05-01', fat_percentage: 10 }],
      total_pages: 2,
      current_page: 1,
    },
    isFetching: false,
  }

  const page2 = {
    data: {
      items: [{ id: '2', recorded_at: '2026-05-02', fat_percentage: 12 }],
      total_pages: 2,
      current_page: 2,
    },
    isFetching: false,
  }

  beforeEach(() => {
    const api = jest.requireMock('../api')
    api.useBodyCompositions.mockReset()
  })

  it('renders loading and empty states', () => {
    const api = jest.requireMock('../api')
    api.useBodyCompositions.mockReturnValue({ data: undefined, isFetching: true })

    const { rerender } = render(<BodyComposition user={{ id: '1' }} subscriptionId="sub" />)
    expect(screen.getByText(/Loading body composition/i)).toBeInTheDocument()

    api.useBodyCompositions.mockReturnValue({
      data: { items: [], total_pages: 1, current_page: 1 },
      isFetching: false,
    })
    rerender(<BodyComposition user={{ id: '1' }} subscriptionId="sub" />)
    expect(screen.getByText(/No body composition to display/i)).toBeInTheDocument()
  })

  it('appends items when paging via "View more"', async () => {
    const api = jest.requireMock('../api')

    api.useBodyCompositions.mockImplementation((params: any) => {
      return params?.page === 2 ? page2 : page1
    })

    render(<BodyComposition user={{ id: '1' }} subscriptionId="sub" />)
    expect(screen.getAllByText('Fat %').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: /view more/i }))

    // Second page item should render too.
    expect(await screen.findAllByText('Fat %')).toHaveLength(2)
  })
})
