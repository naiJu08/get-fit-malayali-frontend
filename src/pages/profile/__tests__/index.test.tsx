import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'

let latestDrawerProps: any

jest.mock('../myProfile', () => {
  return function MockDrawer(props: any) {
    latestDrawerProps = props
    return (
      <div data-testid="myprofile-drawer">
        <button
          data-testid="set-edit-indicator"
          onClick={() => props.setEditViewIndicator(true)}
        >
          set-edit
        </button>
        <button data-testid="close-drawer" onClick={() => props.handleClose()}>
          close
        </button>
      </div>
    )
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

  it('handleClose keeps drawer in view mode when editViewIndicator is set', () => {
    const setOpenMyprofile = jest.fn()
    const setViewMode = jest.fn()

    render(
      <MyProfile
        isDrawerOpen={true}
        setOpenMyprofile={setOpenMyprofile}
        setViewMode={setViewMode}
        viewMode={false}
      />
    )

    fireEvent.click(screen.getByTestId('set-edit-indicator'))
    fireEvent.click(screen.getByTestId('close-drawer'))

    // last call sets it back to true when editViewIndicator was true
    expect(setViewMode).toHaveBeenLastCalledWith(true)
    expect(setOpenMyprofile).toHaveBeenCalledWith(false)

    // internal flag keeps drawer mounted even if parent says closed
    expect(screen.getByTestId('myprofile-drawer')).toBeInTheDocument()
  })

  it('handleClose closes drawer normally when editViewIndicator is false', () => {
    const setOpenMyprofile = jest.fn()
    const setViewMode = jest.fn()

    render(
      <MyProfile
        isDrawerOpen={true}
        setOpenMyprofile={setOpenMyprofile}
        setViewMode={setViewMode}
        viewMode={false}
      />
    )

    act(() => {
      latestDrawerProps.handleClose()
    })

    expect(setOpenMyprofile).toHaveBeenCalledWith(false)
    expect(setViewMode).toHaveBeenCalledWith(false)
  })
})
