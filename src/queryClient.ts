import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
      useErrorBoundary: false,
      // Prevent throwing to React error overlay
      throwOnError: false,
    },
  },
})
