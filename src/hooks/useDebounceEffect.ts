import { useEffect } from 'react';

interface IProps {
  effect: () => void;
  delay: number;
  deps: unknown[];
}

export function useDebounceEffect({ effect, delay, deps }: IProps) {
  useEffect(() => {
    const handler = setTimeout(effect, delay);
    return () => clearTimeout(handler);
  }, [delay, effect, deps]);
}
