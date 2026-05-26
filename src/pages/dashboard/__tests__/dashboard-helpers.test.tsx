import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import {
  fmt,
  fmtCurrency,
  fmtDate,
  fmtDateTime,
  fmtPct,
  HintTooltip,
  DonutChart,
  Sparkline,
  HBar,
  ProgressRing,
  VBarChart,
  StatCard,
  Card,
  LegendRow,
  GrowthBadge,
} from '../dashboard-helpers'

// Mock react-router-dom to prevent navigation errors
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}))

describe('Dashboard Helpers and Presentational Components', () => {
  describe('Formatting Utilities', () => {
    it('fmt formats values correctly', () => {
      expect(fmt(undefined)).toBe('--')
      expect(fmt(null)).toBe('--')
      expect(fmt('not-a-number')).toBe('not-a-number')
      expect(fmt(1234567.89)).toMatch(/12,34,567.89|1,234,567.89/)
      expect(fmt('1234')).toMatch(/1,234/)
    })

    it('fmtCurrency formats INR currency correctly', () => {
      expect(fmtCurrency(undefined)).toBe('--')
      expect(fmtCurrency(null)).toBe('--')
      expect(fmtCurrency('not-a-number')).toBe('not-a-number')
      // en-IN uses Indian digit grouping (12,34,567)
      expect(fmtCurrency(1234567)).toContain('12,34,567')
      expect(fmtCurrency(1234567)).toMatch(/₹|INR/)
    })

    it('fmtDate formats ISO date strings correctly', () => {
      expect(fmtDate(undefined)).toBe('')
      expect(fmtDate('')).toBe('')
      expect(fmtDate('invalid-date')).toBe('invalid-date')
      expect(fmtDate('2026-05-26T00:00:00.000Z')).toContain('May')
      expect(fmtDate('2026-05-26T00:00:00.000Z')).toContain('2026')
    })

    it('fmtDateTime formats ISO date time strings correctly', () => {
      expect(fmtDateTime(undefined)).toBe('')
      expect(fmtDateTime('')).toBe('')
      expect(fmtDateTime('invalid-date')).toBe('invalid-date')
      expect(fmtDateTime('2026-05-26T15:30:00.000Z')).toContain('2026')
      expect(fmtDateTime('2026-05-26T15:30:00.000Z')).toMatch(/am|pm/i)
    })

    it('fmtPct formats decimals/percentages correctly', () => {
      expect(fmtPct(undefined)).toBe('--')
      expect(fmtPct(null)).toBe('--')
      expect(fmtPct(56.78)).toBe('56.8%')
    })
  })

  describe('HintTooltip Component', () => {
    it('toggles visibility of the hint text on button click', () => {
      render(<HintTooltip text="This is a test hint description." />)
      
      const button = screen.getByRole('button')
      expect(screen.queryByText('This is a test hint description.')).not.toBeInTheDocument()

      fireEvent.click(button)
      expect(screen.getByText('This is a test hint description.')).toBeInTheDocument()

      fireEvent.click(button)
      expect(screen.queryByText('This is a test hint description.')).not.toBeInTheDocument()
    })

    it('hides tooltip on outside click', () => {
      render(
        <div>
          <button data-testid="outside-element">Outside</button>
          <HintTooltip text="Outside target hint description." />
        </div>
      )

      const button = screen.getAllByRole('button')[1]
      fireEvent.click(button)
      expect(screen.getByText('Outside target hint description.')).toBeInTheDocument()

      const outside = screen.getByTestId('outside-element')
      fireEvent.mouseDown(outside)
      expect(screen.queryByText('Outside target hint description.')).not.toBeInTheDocument()
    })
  })

  describe('DonutChart Component', () => {
    const slices = [
      { label: 'Slice A', value: 30, color: 'red' },
      { label: 'Slice B', value: 70, color: 'blue' },
    ]

    it('renders correct amount of slices as circles', () => {
      const { container } = render(<DonutChart slices={slices} />)
      const circles = container.querySelectorAll('circle')
      expect(circles.length).toBe(2)
    })

    it('renders fallback circle if total value is 0', () => {
      const emptySlices = [
        { label: 'Slice A', value: 0, color: 'red' },
        { label: 'Slice B', value: 0, color: 'blue' },
      ]
      const { container } = render(<DonutChart slices={emptySlices} />)
      const circles = container.querySelectorAll('circle')
      expect(circles.length).toBe(1)
      expect(circles[0].getAttribute('stroke')).toBe('#e2e8f0')
    })
  })

  describe('Sparkline Component', () => {
    it('renders polyline with values', () => {
      const { container } = render(<Sparkline values={[1, 5, 2, 8, 3]} />)
      const polyline = container.querySelector('polyline')
      expect(polyline).toBeInTheDocument()
      expect(polyline?.getAttribute('stroke')).toBe('#667eea')
    })

    it('returns null if no values passed', () => {
      const { container } = render(<Sparkline values={[]} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('HBar Component', () => {
    it('renders progress bar with correct width constraint', () => {
      const { container } = render(<HBar pct={75} color="green" />)
      const progressBar = container.querySelector('div.h-full.rounded-full')
      expect(progressBar).toHaveStyle('width: 75%')
      expect(progressBar).toHaveStyle('background: green')
    })

    it('clips percentage between 0 and 100', () => {
      const { container: containerLow } = render(<HBar pct={-10} color="red" />)
      expect(containerLow.querySelector('div.h-full.rounded-full')).toHaveStyle(
        'width: 0%'
      )

      const { container: containerHigh } = render(<HBar pct={150} color="blue" />)
      expect(containerHigh.querySelector('div.h-full.rounded-full')).toHaveStyle(
        'width: 100%'
      )
    })
  })

  describe('ProgressRing Component', () => {
    it('renders circular progress rings', () => {
      const { container } = render(
        <ProgressRing pct={60} color="purple">
          <span>60%</span>
        </ProgressRing>
      )
      expect(screen.getByText('60%')).toBeInTheDocument()
      const circles = container.querySelectorAll('circle')
      expect(circles.length).toBe(2)
      expect(circles[1].getAttribute('stroke')).toBe('purple')
    })
  })

  describe('VBarChart Component', () => {
    const chartData = [
      { label: 'Jan', value: 100 },
      { label: 'Feb', value: 200 },
      { label: 'Mar', value: 50 },
    ]

    it('renders bars for each data item scaled appropriately', () => {
      const { container } = render(<VBarChart data={chartData} height={100} />)
      expect(screen.getByText('Jan')).toBeInTheDocument()
      expect(screen.getByText('Feb')).toBeInTheDocument()
      expect(screen.getByText('Mar')).toBeInTheDocument()

      const bars = container.querySelectorAll('div.rounded-t-sm')
      expect(bars.length).toBe(3)
    })
  })

  describe('StatCard Component', () => {
    it('renders title, value, subtext, icon, and badge', () => {
      const handleClick = jest.fn()
      render(
        <StatCard
          title="Revenue"
          value="$15,000"
          sub="Monthly summary"
          gradient="linear-gradient(#fff, #000)"
          icon="💰"
          badge="PRO"
          onClick={handleClick}
        />
      )

      expect(screen.getByText(/Revenue/i)).toBeInTheDocument()
      expect(screen.getByText('$15,000')).toBeInTheDocument()
      expect(screen.getByText('Monthly summary')).toBeInTheDocument()
      expect(screen.getByText('💰')).toBeInTheDocument()
      expect(screen.getByText('PRO')).toBeInTheDocument()

      fireEvent.click(screen.getByText('$15,000'))
      expect(handleClick).toHaveBeenCalled()
    })
  })

  describe('Card Component', () => {
    it('renders title, icon, and children', () => {
      render(
        <Card title="Activity Log" icon="✏️">
          <p>My Child Content</p>
        </Card>
      )

      expect(screen.getByText('✏️')).toBeInTheDocument()
      expect(screen.getByText('Activity Log')).toBeInTheDocument()
      expect(screen.getByText('My Child Content')).toBeInTheDocument()
    })
  })

  describe('LegendRow Component', () => {
    it('renders label, value, and optional progress bar', () => {
      render(<LegendRow label="active" value={25} pct={50} color="green" />)

      expect(screen.getByText('active')).toBeInTheDocument()
      expect(screen.getByText('25')).toBeInTheDocument()
      expect(screen.getByText('50.0%')).toBeInTheDocument()
    })
  })

  describe('GrowthBadge Component', () => {
    it('renders growth percentage and text labels', () => {
      render(<GrowthBadge value={15} label="new subscribers" />)
      expect(screen.getByText(/↑/)).toBeInTheDocument()
      expect(screen.getByText(/15/)).toBeInTheDocument()
      expect(screen.getByText(/new subscribers/)).toBeInTheDocument()
    })

    it('returns null if value is not provided', () => {
      const { container } = render(<GrowthBadge value={undefined} />)
      expect(container.firstChild).toBeNull()
    })
  })
})
