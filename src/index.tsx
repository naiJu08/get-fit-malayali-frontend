import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SnackbarProvider } from 'notistack'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import { SnackbarManagerProvider } from './components/common/snackbar'
import reportWebVitals from './reportWebVitals'

import './styles/styles.scss'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnWindowFocus: false,
    },
  },
})
root.render(
  <BrowserRouter>
    {/* <React.StrictMode> */}
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <QueryClientProvider client={queryClient}>
        <SnackbarManagerProvider>
          <App />
        </SnackbarManagerProvider>
      </QueryClientProvider>
    </SnackbarProvider>
    {/* </React.StrictMode> */}
  </BrowserRouter>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
