import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App'
import { StrictMode } from 'react'
import ErrorBoundary from './components/common/ErrorBoundary'
import { AuthProvider } from './providers/AuthProvider'
import InternetConnectionProvider from './providers/InternetConnectionProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <InternetConnectionProvider>
          <AuthProvider>
            <StrictMode>
              <App />
            </StrictMode>
          </AuthProvider>
        </InternetConnectionProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  </BrowserRouter>
)
