// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill TextEncoder/TextDecoder for jsPDF compatibility in jsdom
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util')
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder as any
}

// Speed up tests by mocking heavy browser-only libs.
// Individual test files can override this mock if they need jsPDF behavior.
jest.mock('jspdf', () => {
  class MockJsPDF {
    internal = {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    }
    setFontSize = jest.fn()
    setFont = jest.fn()
    setTextColor = jest.fn()
    setFillColor = jest.fn()
    setDrawColor = jest.fn()
    setLineWidth = jest.fn()
    rect = jest.fn()
    line = jest.fn()
    text = jest.fn()
    addPage = jest.fn()
    splitTextToSize = jest.fn((text: string) => [text])
    getTextWidth = jest.fn(() => 50)
    save = jest.fn()
  }

  return {
    __esModule: true,
    jsPDF: MockJsPDF,
    default: MockJsPDF,
  }
})

// Wrap all React Testing Library renders with the providers our pages expect.
// Keep imports inside the mock factory to satisfy Jest's "no out-of-scope variables".
jest.mock('@testing-library/react', () => {
  const actual = jest.requireActual('@testing-library/react')
  const React = require('react')
  const { MemoryRouter } = require('react-router-dom')
  // Always use the real React Query exports for providers, even if a test file
  // mocks '@tanstack/react-query' for hook-level unit tests.
  const ReactQuery = jest.requireActual('@tanstack/react-query')
  const { SnackbarProvider } = require('notistack')
  const { SnackbarManagerProvider } = require('./components/common/snackbar')

  const QueryClient = ReactQuery.QueryClient ?? ReactQuery.default?.QueryClient
  const QueryClientProvider =
    ReactQuery.QueryClientProvider ?? ReactQuery.default?.QueryClientProvider

  const Providers = ({ children }: { children: React.ReactNode }) => {
    const [client] = React.useState(
      () =>
        new QueryClient({
          defaultOptions: {
            // In unit tests we want deterministic "render without crashing"
            // with no background network activity.
            queries: { retry: false, enabled: false },
            mutations: { retry: false },
          },
          logger: {
            log: () => {},
            warn: () => {},
            error: () => {},
          } as any,
        } as any)
    )

    return React.createElement(
      QueryClientProvider,
      { client },
      React.createElement(
        MemoryRouter,
        {
          future: {
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          },
        },
        React.createElement(
          SnackbarProvider,
          { maxSnack: 3 },
          React.createElement(SnackbarManagerProvider, null, children)
        )
      )
    )
  }

  return {
    ...actual,
    render: (ui: any, options: any = {}) => {
      const UserWrapper = options.wrapper
      const wrapper = UserWrapper
        ? ({ children }: { children: React.ReactNode }) =>
            React.createElement(
              Providers,
              null,
              React.createElement(UserWrapper, null, children)
            )
        : Providers

      return actual.render(ui, { ...options, wrapper })
    },
  }
})

// Reduce noisy logs during tests (token refresh, etc.)
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
  
  // Suppress deprecation warnings that are not actionable in tests
  const originalWarn = console.warn
  jest.spyOn(console, 'warn').mockImplementation((message: any, ...args) => {
    if (
      typeof message === 'string' &&
      (message.includes('v7_startTransition') || message.includes('v7_relativeSplatPath'))
    ) {
      return
    }
    originalWarn(message, ...args)
  })

  // Suppress ReactDOMTestUtils.act deprecation - v13 testing-library uses it internally
  const originalError = console.error
  jest.spyOn(console, 'error').mockImplementation((message: any, ...args) => {
    if (typeof message === 'string' && message.includes('ReactDOMTestUtils.act')) {
      return
    }
    originalError(message, ...args)
  })
})
