import React from 'react'
import { render, screen } from '@testing-library/react'

jest.mock('../myProfile', () => {
  return function MockDrawer(props: any) {
    return <div data-testid="myprofile-drawer">Drawer</div>
  }
})

import MyProfile from '../index'

describe('MyProfile wrapper', () => {
  it('renders drawer when open', () => {
    render(
      <MyProfile
        isDrawerOpen={true}
        setOpenMyprofile={() => {}}
        setViewMode={() => {}}
        viewMode={false}
      />
    )

    expect(screen.getByTestId('myprofile-drawer')).toBeInTheDocument()
  })

  it('does not render drawer when closed', () => {
    render(
      <MyProfile
        isDrawerOpen={false}
        setOpenMyprofile={() => {}}
        setViewMode={() => {}}
        viewMode={false}
      />
    )

    const found = screen.queryByTestId('myprofile-drawer')
    expect(found).toBeNull()
  })
})
