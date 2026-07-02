import { useState, type ReactNode } from 'react';
import useNetworkState, { useServerConnection } from '../hooks/useNetworkState';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface InternetConnectionProviderProps {
  children: ReactNode;
  showSpeedDetails?: boolean;
}

const InternetConnectionProvider = ({
  children,
  showSpeedDetails = true,
}: InternetConnectionProviderProps) => {
  const networkState = useNetworkState();
  console.log('networkState', networkState);
  const [expanded, setExpanded] = useState<boolean>(false);
  const { serverError } = useServerConnection();

  const isLowSpeed = (networkState.downlink ?? 1) < 0.85;
  const isDisconnected = !networkState.online;
  const isLowQuality =
    networkState.effectiveType === '2g' || (networkState.rtt ?? 0) > 400;

  const isConnectionIssue = isLowSpeed || isDisconnected || isLowQuality;

  const getConnectionStatus = (): {
    icon: string | ReactNode;
    message: string;
    variant: 'destructive' | 'default';
  } => {
    if (!networkState.online) {
      return {
        icon: '⚠️',
        message: 'Not connected to the internet',
        variant: 'destructive',
      };
    }

    if (serverError.error) {
      return {
        icon: '💔',
        message: 'Server connection lost',
        variant: 'destructive',
      };
    }

    if (isConnectionIssue) {
      return {
        icon: '⚡',
        message: 'Your internet is slow or unstable',
        variant: 'default',
      };
    }

    return {
      icon: '✅',
      message: 'Connection is good',
      variant: 'default',
    };
  };

  const status = getConnectionStatus();

  return (
    <>
      {children}
      <motion.div
          className="fixed bottom-1 left-5 z-99999 flex items-center justify-center text-right text-sm text-stone-500 select-none"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="bg-background text-content4-foreground w-full max-w-sm space-y-4 rounded-xl p-0 shadow-xl"
            initial={{ height: 'auto' }}
            animate={{ height: expanded ? 'auto' : '60px' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              boxShadow:
                '0 0 15px rgba(0,0,0,0.2), 0 0 25px rgba(0,0,0,0.15), 0 0 35px rgba(0,0,0,0.1)',
            }}
          >
            <Alert
              variant={status.variant}
              className="cursor-pointer border-0 p-4!"
              onClick={() => setExpanded(!expanded)}
            >
              <AlertTitle className="flex items-center gap-x-2">
                <span className="text-xl">{status.icon}</span>
                <span className="w-max">{status.message}</span>
              </AlertTitle>

              <AnimatePresence>
                {expanded && showSpeedDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <AlertDescription className="text-tiny mt-3! space-y-1">
                      <div className="flex w-max gap-x-2">
                        <span>Connection type:</span>
                        <span>{networkState.type || 'not exist'}</span>
                      </div>
                      <div className="flex w-max gap-x-2">
                        <span>Speed:</span>
                        <span>
                          {networkState.downlink
                            ? `${networkState.downlink.toFixed(2)} Mbps`
                            : 'not exist'}
                        </span>
                      </div>
                      <div className="flex w-max gap-x-2">
                        <span>RTT:</span>
                        <span>{networkState.rtt || 'not exist'} ms</span>
                      </div>
                      <div className="flex w-max gap-x-2">
                        <span>Effective speed:</span>
                        <span>{networkState.effectiveType || 'not exist'}</span>
                      </div>
                    </AlertDescription>
                  </motion.div>
                )}
              </AnimatePresence>
            </Alert>
          </motion.div>
        </motion.div>
    </>
  );
};

export default InternetConnectionProvider;
