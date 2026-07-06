import React, { useEffect, useState } from 'react';
import { 
    type NavigatorWithNetworkInfo, 
    type NetworkInformation,
    type NetworkServerErrorStateT, 
    type NetworkStateT } 
from '../types/network';
import axios from 'axios';
import { API_ENDPOINTS } from '@/constants/api'

function isShallowEqual(
  object1: Partial<NetworkStateT>,
  object2: Partial<NetworkStateT>,
): boolean {
  const keys1 = Object.keys(object1) as (keyof NetworkStateT)[];
  const keys2 = Object.keys(object2) as (keyof NetworkStateT)[];

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (object1[key] !== object2[key]) {
      return false;
    }
  }

  return true;
}

const getConnection = (): NetworkInformation | undefined => {
  const nav = navigator as NavigatorWithNetworkInfo;
  return nav.connection || nav.mozConnection || nav.webkitConnection;
};

const useNetworkStateSubscribe = (callback: EventListener): (() => void) => {
  window.addEventListener('online', callback, { passive: true });
  window.addEventListener('offline', callback, { passive: true });

  const connection = getConnection();

  if (connection?.addEventListener) {
    connection.addEventListener('change', callback, { passive: true });
  }

  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);

    if (connection?.removeEventListener) {
      connection.removeEventListener('change', callback);
    }
  };
};

const getNetworkStateServerSnapshot = (): never => {
  throw Error('useNetworkState is a client-only hook');
};

export const useServerConnection = () => {
  const [serverError, setServerError] = useState<NetworkServerErrorStateT>({
    error: null,
  });

  const checkServerConnection = async () => {
    try {
      await axios.get(`${API_ENDPOINTS.health.check}`);
      setServerError({ error: null });
      console.log('not server error');
    } catch (error) {
      console.error('server connection error', error);
      if (axios.isAxiosError(error)) {
        setServerError({ error: 'server not connected' });
        console.error('axios server connection error', error);
      }
    }
  };

  useEffect(() => {
    if (navigator.onLine) {
      setTimeout(() => checkServerConnection, 0);
    }

    const interval = setInterval(
      () => {
        if (navigator.onLine) {
          checkServerConnection();
        }
      },
      0.5 * 1000 * 60,
    );

    return () => clearInterval(interval);
  }, []);

  console.log('serverError', serverError);

  return { serverError };
};

// ⭐⭐⭐⭐
function useNetworkState() {
  const cache = React.useRef<Partial<NetworkStateT>>({});

  const getSnapshot = () => {
    const online = navigator.onLine;
    const connection = getConnection();

    const nextState: NetworkStateT = {
      online,
      downlink: connection?.downlink ?? null,
      downlinkMax: connection?.downlinkMax ?? null,
      effectiveType: connection?.effectiveType ?? null,
      rtt: connection?.rtt ?? null,
      saveData: connection?.saveData ?? null,
      type: connection?.type ?? null,
    };

    if (isShallowEqual(cache.current, nextState)) {
      return cache.current;
    } else {
      cache.current = nextState;
      return nextState;
    }
  };

  return React.useSyncExternalStore(
    useNetworkStateSubscribe,
    getSnapshot,
    getNetworkStateServerSnapshot,
  );
}

export default useNetworkState;
