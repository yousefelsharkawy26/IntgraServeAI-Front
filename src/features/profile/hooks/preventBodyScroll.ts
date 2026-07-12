import { useEffect } from 'react'

/**
 * Locks body scroll while `locked` is true and restores on unmount/toggle.
 * Handles SSR safely and supports iOS-style scroll preservation with
 * a fixed body height to avoid rubber-band scrolling on mobile.
 */
export function usePreventBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return

    const original = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    }

    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${window.scrollY}px`
    document.body.style.width = '100%'
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`

    return () => {
      const top = document.body.style.top
      document.body.style.overflow = original.overflow
      document.body.style.paddingRight = original.paddingRight
      document.body.style.position = original.position
      document.body.style.top = original.top
      document.body.style.width = original.width
      if (top) window.scrollTo(0, parseInt(top, 10) * -1)
    }
  }, [locked])
}
