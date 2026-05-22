import React from 'react'
import { render, screen } from '@testing-library/react'
import AdditionalInfoTab from '../Details/AdditionalInfoTab'

jest.mock('../../AdminUser/Details/AdditionalInfo', () => {
  const MockAdditionalInfo = ({ user, subscriptionId }: any) => (
    <div data-testid="additional-info">
      user:{user?.id} subscription:{subscriptionId ?? 'none'}
    </div>
  )

  return MockAdditionalInfo
})

describe('AdditionalInfoTab', () => {
  it('shows a warning when user information is unavailable', () => {
    render(<AdditionalInfoTab subscription={{ id: 10 }} />)

    expect(
      screen.getByText(
        'User information is unavailable to view nutritional assessment.'
      )
    ).toBeInTheDocument()
    expect(screen.queryByTestId('additional-info')).not.toBeInTheDocument()
  })

  it('passes subscription user_id and subscription id to AdditionalInfo', () => {
    render(<AdditionalInfoTab subscription={{ id: 10, user_id: 42 }} />)

    expect(screen.getByTestId('additional-info')).toHaveTextContent(
      'user:42 subscription:10'
    )
  })

  it('falls back to nested user id when user_id is missing', () => {
    render(
      <AdditionalInfoTab
        subscription={{ id: 11, user: { id: 77 } }}
      />
    )

    expect(screen.getByTestId('additional-info')).toHaveTextContent(
      'user:77 subscription:11'
    )
  })
})
