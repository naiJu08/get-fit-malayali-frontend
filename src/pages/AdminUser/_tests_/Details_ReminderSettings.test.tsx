import { render, screen } from '@testing-library/react'
import ReminderSettings from '../Details/ReminderSettings'

jest.mock('../api', () => ({
  useUserReminders: jest.fn(),
}))

jest.mock('../../../components/common/icons', () => (props: any) => (
  <span data-testid={`icon-${props?.name ?? 'unknown'}`} />
))

describe('ReminderSettings', () => {
  beforeEach(() => {
    const api = jest.requireMock('../api')
    api.useUserReminders.mockReset()
  })

  it('prompts to select a user when userId is missing', () => {
    const api = jest.requireMock('../api')
    api.useUserReminders.mockReturnValue({ data: { items: [] }, isLoading: false })

    render(<ReminderSettings />)
    expect(
      screen.getByText(/Select a user to view their reminders/i)
    ).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('renders loading, error, and empty states', () => {
    const api = jest.requireMock('../api')

    api.useUserReminders.mockReturnValue({ data: undefined, isLoading: true, error: null })
    const { rerender } = render(<ReminderSettings userId="u1" />)
    expect(screen.getByText(/Loading reminders/i)).toBeInTheDocument()

    api.useUserReminders.mockReturnValue({ data: undefined, isLoading: false, error: new Error('x') })
    rerender(<ReminderSettings userId="u1" />)
    expect(
      screen.getByText(/Failed to load reminders/i)
    ).toBeInTheDocument()

    api.useUserReminders.mockReturnValue({ data: { items: [] }, isLoading: false, error: null })
    rerender(<ReminderSettings userId="u1" />)
    expect(
      screen.getByText(/No reminders configured for this user yet/i)
    ).toBeInTheDocument()
  })

  it('groups reminders by schedule date and formats details', () => {
    const api = jest.requireMock('../api')
    api.useUserReminders.mockReturnValue({
      data: {
        items: [
          // hydration/water: interval + end_time should appear
          {
            id: 'r1',
            reminder_type: 'water',
            active: true,
            scheduled_for: '2026-05-01T10:00:00Z',
            start_time: '07:05',
            end_time: '18:30',
            interval_minutes: 60,
          },
          // workout: no wake-up row
          {
            id: 'r2',
            reminder_type: 'workout',
            active: false,
            schedule_date: '2026-05-01',
          },
          // sleep: wake-up row appears, interval/end rows do not
          {
            id: 'r3',
            reminder_type: 'sleep',
            active: true,
            date: '2026-04-30',
            start_time: '06:00',
          },
          // unknown type uses fallback label
          {
            id: 'r4',
            reminder_type: 'custom',
            active: true,
            created_at: '2026-05-02T09:00:00Z',
            start_time: '09:00',
            end_time: '10:00',
          },
        ],
      },
      isLoading: false,
      error: null,
    })

    render(<ReminderSettings userId="u1" />)

    // Summary should count total reminders
    expect(screen.getByText('4')).toBeInTheDocument()

    // Group headers
    expect(screen.getAllByText(/Schedule Date/i).length).toBeGreaterThan(0)

    // Hydration label (from REMINDER_COPY)
    expect(screen.getByText(/Hydration Breaks/i)).toBeInTheDocument()

    // Time formatting (07:05 -> 07:05 AM, 18:30 -> 06:30 PM)
    expect(screen.getByText(/07:05 AM/i)).toBeInTheDocument()
    expect(screen.getByText(/06:30 PM/i)).toBeInTheDocument()
    expect(screen.getByText(/60 mins/i)).toBeInTheDocument()

    // Workout label and inactive style path
    expect(screen.getByText(/^Workout$/i)).toBeInTheDocument()

    // Custom label uses capitalization fallback
    expect(screen.getByText(/^Custom$/i)).toBeInTheDocument()
  })
})
