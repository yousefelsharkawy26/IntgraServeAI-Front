import { useEffect, useState } from 'react';

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      const userAgent =
        navigator.userAgent ||
        navigator.vendor ||
        ('opera' in window &&
          typeof (window as typeof window & { opera: string }).opera ===
            'string' &&
          (window as typeof window & { opera: string }).opera) ||
        '';
      const mobileRegex =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      const isMobileUserAgent = mobileRegex.test(userAgent.toLowerCase());
      const isMobileWidth = window.innerWidth <= 768;
      const isTouchDevice =
        'ontouchstart' in window || navigator.maxTouchPoints > 0;

      setIsMobile(isMobileUserAgent && isMobileWidth && isTouchDevice);
    };

    // Initial check
    checkMobile();

    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

export default useMobileDetection;
