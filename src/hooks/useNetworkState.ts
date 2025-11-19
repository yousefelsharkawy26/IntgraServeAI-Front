import React from 'react';
import { NavigatorWithNetworkInfo, NetworkInformation, NetworkStateT } from '../types';

function isShallowEqual(object1: Partial<NetworkStateT>, object2: Partial<NetworkStateT>): boolean {
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
