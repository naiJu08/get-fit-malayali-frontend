import React from 'react'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SnackbarProvider } from 'notistack'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { SnackbarManagerProvider } from './components/common/snackbar'

test('renders login screen', async () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  render(
    <MemoryRouter
      initialEntries={['/login']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <SnackbarProvider>
        <QueryClientProvider client={queryClient}>
          <SnackbarManagerProvider>
            <App />
          </SnackbarManagerProvider>
        </QueryClientProvider>
      </SnackbarProvider>
    </MemoryRouter>
  )

  expect(
    await screen.findByRole('heading', { name: /^login$/i })
  ).toBeInTheDocument()
})
