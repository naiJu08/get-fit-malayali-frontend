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
