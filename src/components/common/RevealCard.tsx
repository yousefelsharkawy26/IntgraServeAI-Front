import { motion } from 'framer-motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface RevealCardProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function RevealCard({ children, className, delay = 0 }: RevealCardProps) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.05 })

  return (
    <div ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.5, delay, ease: [0.25, 1, 0.5, 1] }}
        className={cn(className)}
      >
        {children}
      </motion.div>
    </div>
  )
}
