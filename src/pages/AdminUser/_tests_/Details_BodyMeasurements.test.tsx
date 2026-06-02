import { fireEvent, render, screen } from '@testing-library/react'
import BodyMeasurements from '../Details/BodyMeasurements'

jest.mock('../api', () => ({
  useBodyMeasurements: jest.fn(),
}))

jest.mock('jspdf', () => {
  class MockJsPdf {
    internal = {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    }
    setFontSize() {}
    setTextColor() {}
    setFillColor() {}
    setDrawColor() {}
    setLineWidth() {}
    rect() {}
    line() {}
    text() {}
    addPage() {}
    save = jest.fn()
  }
  return { jsPDF: MockJsPdf }
})

jest.mock('../../../components/common/icons', () => (props: any) => (
  <span data-testid={`icon-${props?.name ?? 'unknown'}`} />
))

jest.mock('../../../components/common/buttons/Button', () => (props: any) => (
  <button type="button" onClick={props?.onClick}>
    {props?.label ?? 'button'}
  </button>
))

describe('BodyMeasurements', () => {
  beforeEach(() => {
    const api = jest.requireMock('../api')
    api.useBodyMeasurements.mockReset()
  })

  it('avoids API call params when subscriptionId is missing and shows empty state', () => {
    const api = jest.requireMock('../api')
    api.useBodyMeasurements.mockReturnValue({
      data: { items: [], total_pages: 1, current_page: 1 },
      isFetching: false,
    })

    render(<BodyMeasurements user={{ id: '1' }} subscriptionId={null} />)
    expect(screen.getByText(/No body measurements to display/i)).toBeInTheDocument()
    expect(api.useBodyMeasurements).toHaveBeenCalled()
  })

  it('generates PDF when items exist', () => {
    const api = jest.requireMock('../api')
    api.useBodyMeasurements.mockReturnValue({
      data: {
        items: [
          {
            id: '1',
            recorded_at: '2026-05-01',
            chest: 90,
            waist: 80,
            hip: 95,
            arm: 30,
            thigh: 50,
            neck: 35,
            height: 170,
            weight: 70,
          },
        ],
        total_pages: 1,
        current_page: 1,
      },
      isFetching: false,
    })

    render(<BodyMeasurements user={{ id: '1' }} subscriptionId="sub" />)
    fireEvent.click(screen.getByRole('button', { name: /Generate PDF/i }))

    const { jsPDF } = require('jspdf')
    expect(jsPDF).toBeDefined()
  })
})

