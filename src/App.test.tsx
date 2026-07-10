import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import App from './App'
import { useAuthStore } from './store/authStore'

const renderApp = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
  })

  return render(
    <MemoryRouter initialEntries={['/login']}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('App', () => {
  it('mounts without crashing', async () => {
    renderApp()
    expect(await screen.findByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })
})
