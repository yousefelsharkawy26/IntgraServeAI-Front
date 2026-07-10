import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Ticket,
  Zap,
  Database,
  Users,
  Shield,
  UserCircle,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Box,
} from 'lucide-react'
import { useSidebarStore } from '@/store/sidebarStore'
import { useAuthStore } from '@/store/authStore'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Tech User', 'Support User'] },
  { path: '/tickets', label: 'Tickets', icon: Ticket, roles: ['Admin', 'Tech User', 'Support User'] },
  { path: '/actions', label: 'Actions', icon: Zap, roles: ['Admin', 'Tech User'] },
  { path: '/backups', label: 'Backups', icon: Database, roles: ['Admin', 'Tech User'] },
  { path: '/users', label: 'Users', icon: Users, roles: ['Admin'] },
  { path: '/roles', label: 'Roles', icon: Shield, roles: ['Admin'] },
  { path: '/profile', label: 'Profile', icon: UserCircle, roles: ['Admin', 'Tech User', 'Support User'] },
  { path: '/chat', label: 'Chat Widget', icon: MessageSquare, roles: ['Admin', 'Tech User', 'Support User'] },
]

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.05 * i, duration: 0.35, ease: [0.25, 1, 0.5, 1] as const },
  }),
}

export function Sidebar() {
  const { isCollapsed, setCollapsed } = useSidebarStore()
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const userRoles = user?.roles || []
  const visibleNavItems = navItems.filter((item) => userRoles.some((role) => item.roles.includes(role)))

  return (
    <motion.aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[var(--color-bg-grid)] bg-[var(--color-bg-surface)]',
        isCollapsed ? 'w-20' : 'w-[260px]'
      )}
      animate={{ width: isCollapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
    >
      <div className="flex h-16 items-center gap-3 px-4">
        <motion.div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-orange)]"
          whileHover={{ rotate: 10, scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        >
          <Box className="h-5 w-5 text-white" />
        </motion.div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap font-serif text-lg font-semibold tracking-tight text-[var(--color-text-primary)]"
            >
              IntegraServe
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!isCollapsed}
          className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-base)] hover:text-[var(--color-text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" aria-hidden="true" /> : <ChevronLeft className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {visibleNavItems.map((item, i) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
            const Icon = item.icon
            return (
              <motion.div
                key={item.path}
                custom={i}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
              >
                <NavLink
                  to={item.path}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-[var(--color-bg-active-nav)] text-[var(--color-accent-orange)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-base)] hover:text-[var(--color-text-primary)]'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-dot"
                      className="absolute left-0 h-6 w-1 rounded-r-full bg-[var(--color-accent-orange)]"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive && 'text-[var(--color-accent-orange)]')} />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="overflow-hidden whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              </motion.div>
            )
          })}
        </nav>
      </ScrollArea>

      <Separator />

      <div className="p-3">
        {user && (
          <div className={cn('flex items-center gap-3 rounded-lg p-2', !isCollapsed && 'bg-[var(--color-bg-base)]')}>
            <motion.div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-xs font-semibold text-white"
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </motion.div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex-1 overflow-hidden"
                >
                  <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{user.name}</p>
                  <p className="truncate text-xs text-[var(--color-text-muted)]">{user.role}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        <motion.button
          onClick={logout}
          whileHover={{ x: 4 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={cn(
            'mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-danger-hover)] hover:text-red-600 dark:hover:text-red-400',
            isCollapsed && 'justify-center'
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  )
}
