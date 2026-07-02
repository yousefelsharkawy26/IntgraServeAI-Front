import { useLocation, Outlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ToastContainer } from '@/components/common/ToastContainer'
import { useSidebarStore } from '@/store/sidebarStore'

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
}

export function AppLayout() {
  const { isCollapsed } = useSidebarStore()
  const location = useLocation()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-bg-base)] bg-grain">
      <Sidebar />
      <div
        className="flex flex-1 flex-col overflow-hidden transition-all duration-300"
        style={{ marginLeft: isCollapsed ? '80px' : '260px' }}
      >
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
