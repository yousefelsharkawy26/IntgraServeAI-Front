import { useCallback, useRef, useState } from 'react';

interface IUseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | Document | null;
  rootMargin?: string;
}

function useIntersectionObserver(
  options: IUseIntersectionObserverOptions = {},
) {
  const { threshold = 0.3, root = null, rootMargin = '0px' } = options;
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  const previousObserver = useRef<IntersectionObserver | null>(null);

  const customRef = useCallback(
    (node: HTMLElement) => {
      if (previousObserver.current) {
        previousObserver.current.disconnect();
        previousObserver.current = null;
      }

      if (node?.nodeType === Node.ELEMENT_NODE) {
        const observer = new IntersectionObserver(
          ([entry]) => {
            setEntry(entry);
          },
          { threshold, root, rootMargin },
        );

        observer.observe(node);
        previousObserver.current = observer;
      }
    },
    [threshold, root, rootMargin],
  );

  return { customRef, entry };
}

export default useIntersectionObserver;
