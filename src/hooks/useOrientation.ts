import { useEffect, useState } from 'react';

export type orientationT = 'portrait' | 'landscape';

const useOrientation = () => {
  const [orientation, setOrientation] = useState<orientationT>(() => {
    if (typeof window === 'undefined') return 'portrait';
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOrientationChange = () => {
      const newOrientation =
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      setOrientation(newOrientation);
    };

    const handleOrientationChangeWithDelay = () => {
      setTimeout(handleOrientationChange, 100);
    };

    handleOrientationChange();

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener(
      'orientationchange',
      handleOrientationChangeWithDelay,
    );

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener(
        'orientationchange',
        handleOrientationChangeWithDelay,
      );
    };
  }, []);

  return orientation;
};

export default useOrientation;
