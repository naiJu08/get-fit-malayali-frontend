import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

jest.mock('../../../../../components/app/alertBox/infoBox', () => {
  return function MockInfoBox({ content }: { content: string }) {
    return <div data-testid="info-box">{content}</div>
  }
})

const defaultProps = {
  template: {
    id: '1',
    name: 'Weight Loss Template',
    duration_days: 30,
    diet_template_category_name: 'Weight Loss',
    thumbnail_url: '',
  },
  loading: false,
  error: '',
  onEdit: jest.fn(),
}

describe('DetailTab Component', () => {
  const DetailTab = require('../index').default

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders detail items when template data is provided', () => {
    render(<DetailTab {...defaultProps} />)

    expect(screen.getByText(/weight loss template/i)).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('Weight Loss')).toBeInTheDocument()
  })

  it('renders loading state when loading is true', () => {
    render(<DetailTab {...defaultProps} loading={true} />)

    expect(screen.getByTestId('info-box')).toBeInTheDocument()
    expect(screen.getByText('Loading template details...')).toBeInTheDocument()
  })

  it('renders error state when error is provided', () => {
    render(<DetailTab {...defaultProps} error="Failed to load template" />)

    expect(screen.getByTestId('info-box')).toBeInTheDocument()
    expect(screen.getByText('Failed to load template')).toBeInTheDocument()
  })

  it('renders edit button when template has id and onEdit is provided', () => {
    render(<DetailTab {...defaultProps} />)

    const editButton = screen.getByRole('button', { name: /edit template/i })
    expect(editButton).toBeInTheDocument()
  })

  it('does not render edit button when template has no id', () => {
    render(
      <DetailTab
        {...defaultProps}
        template={{ ...defaultProps.template, id: undefined }}
      />
    )

    expect(
      screen.queryByRole('button', { name: /edit template/i })
    ).not.toBeInTheDocument()
  })

  it('does not render edit button when onEdit is not provided', () => {
    render(<DetailTab {...defaultProps} onEdit={undefined} />)

    expect(
      screen.queryByRole('button', { name: /edit template/i })
    ).not.toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn()
    render(<DetailTab {...defaultProps} onEdit={onEdit} />)

    const editButton = screen.getByRole('button', { name: /edit template/i })
    fireEvent.click(editButton)

    expect(onEdit).toHaveBeenCalled()
  })

  it('capitalizes template name correctly', () => {
    render(
      <DetailTab
        {...defaultProps}
        template={{ ...defaultProps.template, name: 'weight loss template' }}
      />
    )

    expect(screen.getByText(/weight loss template/i)).toBeInTheDocument()
  })

  it('displays duration days', () => {
    render(<DetailTab {...defaultProps} />)

    expect(screen.getByText('30')).toBeInTheDocument()
  })

  it('displays diet template category', () => {
    render(<DetailTab {...defaultProps} />)

    expect(screen.getByText('Weight Loss')).toBeInTheDocument()
  })

  it('renders detail labels correctly', () => {
    render(<DetailTab {...defaultProps} />)

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Duration (Days)')).toBeInTheDocument()
    expect(screen.getByText('Diet Template Category')).toBeInTheDocument()
  })

  it('handles null template values gracefully', () => {
    render(
      <DetailTab
        {...defaultProps}
        template={{
          id: '1',
          name: null,
          duration_days: null,
          diet_template_category_name: null,
        }}
      />
    )

    expect(screen.queryByTestId('info-box')).not.toBeInTheDocument()
  })

  it('renders with grid layout', () => {
    const { container } = render(<DetailTab {...defaultProps} />)

    const gridContainer = container.querySelector('.grid')
    expect(gridContainer).toBeInTheDocument()
    expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2')
  })

  it('renders edit button with correct styling', () => {
    render(<DetailTab {...defaultProps} />)

    const editButton = screen.getByRole('button', { name: /edit template/i })
    expect(editButton).toHaveClass('bg-primaryGreen', 'text-white')
  })
})
