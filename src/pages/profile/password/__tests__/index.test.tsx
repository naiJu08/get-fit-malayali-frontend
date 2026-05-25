import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SnackbarProvider } from 'notistack'
import { SnackbarManagerProvider } from '../../../../components/common/snackbar'

const MockDialogModal = ({ isOpen, onClose, body }: any) => {
  if (!isOpen) return null
  return (
    <div>
      <div data-testid="dialog-body">{body}</div>
      <button onClick={onClose}>close</button>
    </div>
  )
}

const MockButton = ({ label, onClick, type }: any) => (
  <button type={type} onClick={onClick}>
    {label}
  </button>
)

jest.mock('../../../../components/common', () => ({
  DialogModal: (props: any) => MockDialogModal(props),
  Button: (props: any) => MockButton(props),
}))

jest.mock('../../api', () => ({
  changePassword: jest.fn(() => Promise.resolve({})),
}))

import ChangePassword from '../index'

describe('ChangePassword component', () => {
  it('toggles password visibility for new password and confirm', () => {
    render(
      <SnackbarProvider>
        <SnackbarManagerProvider>
          <ChangePassword isOpen={true} handleClose={() => {}} />
        </SnackbarManagerProvider>
      </SnackbarProvider>
    )

    // There are two inputs with placeholder 'Enter Password' (old and new), get the second one
    const allPwdInputs = screen.getAllByPlaceholderText('Enter Password')
    const pwd = allPwdInputs[1]
    const confirm = screen.getByPlaceholderText('Confirm Password')

    // initially password fields are type password
    expect(pwd).toHaveAttribute('type', 'password')
    expect(confirm).toHaveAttribute('type', 'password')

    // Find toggle buttons by their position (they contain eye icons)
    // The toggle buttons are inside the relative divs after each password input
    const allButtons = screen.getAllByRole('button')
    // Buttons order: Cancel, Submit, and toggle buttons for new password and confirm password
    // The toggle buttons are the ones with icons (eye/eye-close)
    // We need to find the toggle buttons - they are the last two buttons before Cancel/Submit in DOM order
    // Actually, let's find them by looking at the structure - toggle buttons are type="button" 
    // and are inside the password field containers
    
    // Get all buttons of type="button" (toggle buttons)
    const toggleButtons = allButtons.filter(btn => btn.getAttribute('type') === 'button' && !btn.textContent?.trim().match(/^(Cancel|Submit)$/))
    
    // Click the new password toggle (first toggle button)
    fireEvent.click(toggleButtons[0])
    expect(pwd).toHaveAttribute('type', 'text')

    // Click the confirm password toggle (second toggle button)
    fireEvent.click(toggleButtons[1])
    expect(confirm).toHaveAttribute('type', 'text')
  })

  it('calls handleClose when cancel clicked', () => {
    const mockClose = jest.fn()
    render(
      <SnackbarProvider>
        <SnackbarManagerProvider>
          <ChangePassword isOpen={true} handleClose={mockClose} />
        </SnackbarManagerProvider>
      </SnackbarProvider>
    )

    const cancelBtn = screen.getByText('Cancel')
    fireEvent.click(cancelBtn)

    expect(mockClose).toHaveBeenCalled()
  })
})
