import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bell, Sun, Moon, Search } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { useNotificationStore } from '@/store/notificationStore'
import { useAuthStore } from '@/store/authStore'
import { NotificationCenter } from '@/components/common/NotificationCenter'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/tickets': 'Tickets',
  '/actions': 'Actions',
  '/backups': 'Backups',
  '/users': 'Users',
  '/roles': 'Roles',
  '/profile': 'Profile',
  '/chat': 'Chat Widget',
}

export function Header() {
  const location = useLocation()
  const { theme, toggleTheme } = useThemeStore()
  const { unreadCount, togglePanel } = useNotificationStore()
  const { user } = useAuthStore()
  const [searchOpen, setSearchOpen] = useState(false)

  const pageTitle = pageTitles[location.pathname] || 'IntegraServeAI'

  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--color-bg-grid)] bg-[var(--color-bg-surface)] px-6">
      <div className="flex items-center gap-4">
        <motion.h1
          key={pageTitle}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
          className="font-serif text-2xl font-medium tracking-tight text-[var(--color-text-primary)]"
        >
          {pageTitle}
        </motion.h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          {searchOpen ? (
            <Input
              autoFocus
              placeholder="Search..."
              className="h-9 w-64 rounded-full border-[var(--color-border-medium)] bg-[var(--color-bg-base)] pr-9 text-sm"
              onBlur={() => setSearchOpen(false)}
            />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-bg-base)]"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-[18px] w-[18px]" />
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-bg-base)]"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-bg-base)]"
          onClick={togglePanel}
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent-orange)] text-[11px] font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </Button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-sm font-semibold text-white">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>

        <NotificationCenter />
      </div>
    </header>
  )
}
