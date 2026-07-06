import { AppRoutes } from './routes'
import { useThemeStore } from './store/themeStore'
import { useEffect } from 'react'

export default function App() {
  const { theme } = useThemeStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return <AppRoutes />
}
