// ============================================================
// useModalA11y — reusable accessibility hook for custom modals,
// dialogs, drawers, and overlay panels.
//
// Provides:
//   - Escape key to close
//   - Body scroll lock (iOS-safe, preserves scroll position)
//   - Focus trap (Tab/Shift+Tab cycles within the modal)
//   - Focus restoration to the previously-focused element on close
//
// Usage:
//   const modalRef = useRef<HTMLDivElement>(null)
//   useModalA11y({ open, onClose, containerRef: modalRef, labelId: 'title-id' })
//
// This complements (but does not replace) the ARIA attributes you
// still need to set on the container:
//   role="dialog" aria-modal="true" aria-labelledby={labelId}
// ============================================================

import { useEffect, useRef } from 'react'

export interface UseModalA11yOptions {
  /** Whether the modal is currently open. */
  open: boolean
  /** Called when the user requests to close (Escape, backdrop click). */
  onClose: () => void
  /** Ref to the modal container element (for focus trapping). */
  containerRef: React.RefObject<HTMLElement | null>
  /** Optional id of the element that labels the modal (aria-labelledby). */
  labelId?: string
  /** Disable the Escape handler (e.g. for confirmation dialogs). Defaults to false. */
  disableEscape?: boolean
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
]
  .join(', ')

export function useModalA11y({
  open,
  onClose,
  containerRef,
  disableEscape = false,
}: UseModalA11yOptions) {
  // Remember the element that was focused before the modal opened so we can
  // restore focus when it closes. This is critical for screen-reader and
  // keyboard users.
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  // Saved scroll position for body-scroll-lock restoration (iOS safe).
  const savedScrollYRef = useRef(0)

  // ---- Escape to close + body scroll lock + focus restore ----
  useEffect(() => {
    if (!open) return

    // Capture the currently focused element BEFORE we move focus into the modal.
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      previouslyFocusedRef.current = document.activeElement
    }

    // ---- Body scroll lock (iOS-safe) ----
    const body = document.body
    savedScrollYRef.current = window.scrollY
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    body.style.position = 'fixed'
    body.style.top = `-${savedScrollYRef.current}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`
    }

    // ---- Move focus into the modal ----
    // Defer to next tick so the modal is mounted.
    const focusTimer = setTimeout(() => {
      const container = containerRef.current
      if (!container) return
      const first = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
      if (first) {
        first.focus()
      } else {
        // Make the container itself focusable so keyboard users have a target.
        container.setAttribute('tabindex', '-1')
        container.focus()
      }
    }, 0)

    // ---- Escape key handler ----
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disableEscape) return
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      // ---- Focus trap (Tab / Shift+Tab) ----
      if (e.key === 'Tab') {
        const container = containerRef.current
        if (!container) return
        const focusables = Array.from(
          container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        )
        if (focusables.length === 0) {
          e.preventDefault()
          return
        }
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const active = document.activeElement as HTMLElement | null

        if (e.shiftKey) {
          if (active === first || !container.contains(active)) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (active === last || !container.contains(active)) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      clearTimeout(focusTimer)

      // ---- Restore body scroll ----
      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      body.style.width = ''
      body.style.paddingRight = ''
      window.scrollTo(0, savedScrollYRef.current)

      // ---- Restore focus to the previously-focused element ----
      if (previouslyFocusedRef.current && typeof previouslyFocusedRef.current.focus === 'function') {
        previouslyFocusedRef.current.focus()
      }
      previouslyFocusedRef.current = null
    }
  }, [open, onClose, containerRef, disableEscape])
}