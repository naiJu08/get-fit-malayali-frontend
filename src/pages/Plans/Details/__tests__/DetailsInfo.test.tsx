import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

import DetailsInfo from '../DetailsInfo'

jest.mock('../../../../components/app/alertBox/infoBox', () => ({
  __esModule: true,
  default: ({ content }: any) => <div data-testid="info-box">{content}</div>,
}))

describe('Plan DetailsInfo', () => {
  it('shows loading state', () => {
    render(<DetailsInfo plan={{}} loading={true} error={''} />)
    expect(screen.getByTestId('info-box')).toHaveTextContent(
      'Loading plan details...'
    )
  })

  it('shows error state', () => {
    render(<DetailsInfo plan={{}} loading={false} error={'Boom'} />)
    expect(screen.getByTestId('info-box')).toHaveTextContent('Boom')
  })

  it('renders plan fields and edit button when plan has id', () => {
    const onEdit = jest.fn()
    render(
      <DetailsInfo
        plan={{
          id: 1,
          name: 'diabetes',
          category: 'Diabetes',
          description: 'Desc',
          duration_days: 10,
          active: true,
          fees: 1500,
        }}
        loading={false}
        error={''}
        onEdit={onEdit}
      />
    )
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getAllByText('Diabetes').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Edit plan' }))
    expect(onEdit).toHaveBeenCalled()
  })
})
