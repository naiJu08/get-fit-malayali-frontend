import React from 'react'
import { act } from 'react-dom/test-utils'
import { createRoot, Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

const mockEnqueueSnackbar = jest.fn()
const mockClearAuthenticated = jest.fn()

jest.mock('./routes/mainRoutes', () => ({
  __esModule: true,
  default: () => <div data-testid="main-routes">Main Routes</div>,
}))

jest.mock('./components/common/snackbar', () => ({
  __esModule: true,
  useSnackbarManager: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}))

jest.mock('./store/authStore', () => ({
  __esModule: true,
  useAuthStore: () => ({ clearAuthenticated: mockClearAuthenticated }),
}))

jest.mock('./store/themeStore', () => ({
  __esModule: true,
  useThemeStore: () => ({ isDark: false, theme: 'theme-light' }),
}))

jest.mock('./store/domainManageStore', () => ({
  __esModule: true,
  useDomainManageStore: () => ({ domainType: 'Employee' }),
  domainTypes: {
    EMPLOYEE: 'Employee',
    ASSESSOR: 'Assessor',
    ORGANISATION: 'Organisation',
  },
}))

jest.mock('./utilities/visibility', () => ({
  __esModule: true,
  useTabVisibility: jest.fn(),
  useReloadOnStorageChange: jest.fn(),
}))

describe('App component', () => {
  let container: HTMLDivElement
  let root: Root

  const renderApp = () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
      )
    })
  }

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
  })

  it('renders the mocked MainRoutes inside a router', () => {
    renderApp()

    const mainRoutes = container.querySelector('[data-testid="main-routes"]')
    expect(mainRoutes?.textContent).toBe('Main Routes')
  })
})
