import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SIDEBAR_STORAGE_KEY } from '@/constants/theme'

interface SidebarState {
  isOpen: boolean
  isCollapsed: boolean
  toggle: () => void
  setOpen: (open: boolean) => void
  setCollapsed: (collapsed: boolean) => void
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isOpen: true,
      isCollapsed: false,

      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      setOpen: (open) => set({ isOpen: open }),
      setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
    }),
    {
      name: SIDEBAR_STORAGE_KEY,
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    }
  )
)
