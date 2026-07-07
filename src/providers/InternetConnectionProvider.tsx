import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, ServerCrash, Gauge, ChevronDown, ChevronUp } from 'lucide-react'
import useNetworkState, { useServerConnection } from '../hooks/useNetworkState'

interface InternetConnectionProviderProps {
  children: ReactNode
  /** Show detailed connection metrics when expanded. Defaults to true. */
  showSpeedDetails?: boolean
}

/**
 * Renders a small, dismissible connection-status alert at the bottom-left of
 * the screen. The alert ONLY appears when there is an actual connection issue
 * (offline, server unreachable, or slow network) — when everything is fine,
 * nothing is rendered, so the UI stays clean.
 *
 * Accessibility:
 *   - role="status" + aria-live="polite" so screen readers announce changes.
 *   - Real icon labels via aria-label (no emoji-only labels).
 *   - Expandable details are keyboard-operable (button + aria-expanded).
 */
const InternetConnectionProvider = ({
  children,
  showSpeedDetails = true,
}: InternetConnectionProviderProps) => {
  const networkState = useNetworkState()
  const [expanded, setExpanded] = useState<boolean>(false)
  const { serverError } = useServerConnection()

  const isLowSpeed = (networkState.downlink ?? 1) < 0.85
  const isDisconnected = !networkState.online
  const isLowQuality =
    networkState.effectiveType === '2g' || (networkState.rtt ?? 0) > 400

  const isConnectionIssue = isDisconnected || !!serverError.error || isLowSpeed || isLowQuality

  // Don't render anything when the connection is healthy.
  if (!isConnectionIssue) return <>{children}</>

  // Pick the most severe status: offline > server error > slow/unstable.
  let Icon = Gauge
  let message = 'Your internet is slow or unstable'
  let variant: 'destructive' | 'warning' = 'warning'

  if (isDisconnected) {
    Icon = WifiOff
    message = 'You are offline. Reconnect to continue.'
    variant = 'destructive'
  } else if (serverError.error) {
    Icon = ServerCrash
    message = 'Server connection lost. Retrying…'
    variant = 'destructive'
  } else if (isLowQuality) {
    Icon = Wifi
    message = 'Unstable connection detected'
    variant = 'warning'
  }

  const variantClasses =
    variant === 'destructive'
      ? 'border-destructive/40 bg-destructive/10 text-destructive'
      : 'border-amber-300/50 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'

  return (
    <>
      {children}
      <motion.div
        // aria-live polite so screen readers announce status changes without
        // interrupting the user. role=status is implicit but set explicitly.
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 left-4 z-[100] w-[calc(100vw-2rem)] max-w-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
      >
        <motion.div
          className={`w-full rounded-xl border p-3 shadow-lg backdrop-blur-md ${variantClasses}`}
          initial={false}
          animate={{ height: expanded ? 'auto' : 'auto' }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          <div className="flex items-start gap-3">
            <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-snug">{message}</p>

              <AnimatePresence>
                {expanded && showSpeedDetails && (
                  <motion.dl
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs opacity-90"
                  >
                    <dt className="text-muted-foreground">Type</dt>
                    <dd>{networkState.type || 'unknown'}</dd>
                    <dt className="text-muted-foreground">Speed</dt>
                    <dd>{networkState.downlink ? `${networkState.downlink.toFixed(2)} Mbps` : 'unknown'}</dd>
                    <dt className="text-muted-foreground">RTT</dt>
                    <dd>{networkState.rtt ? `${networkState.rtt} ms` : 'unknown'}</dd>
                    <dt className="text-muted-foreground">Effective</dt>
                    <dd>{networkState.effectiveType || 'unknown'}</dd>
                  </motion.dl>
                )}
              </AnimatePresence>
            </div>

            {showSpeedDetails && (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                aria-expanded={expanded}
                aria-label={expanded ? 'Hide connection details' : 'Show connection details'}
                className="shrink-0 rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {expanded ? (
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </>
  )
}

export default InternetConnectionProvider
