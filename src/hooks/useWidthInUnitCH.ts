import { RefObject, useEffect, useRef, useState } from 'react';
import { calculateWidthInUnitCH } from '@/utils/helpers';

interface IReturn {
  widthInUnitCH: number;
  elementRef: RefObject<HTMLDivElement>;
  setMounted: (value: boolean) => void;
}

const useWidthInUnitCH = (): IReturn => {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [widthInUnitCH, setWidthInUnitCH] = useState<number>(1);
  const [mounted, setMounted] = useState<boolean>(false);

  const updateWidth = () => {
    const element = elementRef.current;
    if (!element) return;

    const width = calculateWidthInUnitCH(element);
    setWidthInUnitCH(width);
  };

  useEffect(() => {
    if (!mounted) return;

    const element = elementRef.current;
    if (!element) return;

    // 🔹 تأخير التحديث للتأكد من تحميل العنصر
    setTimeout(updateWidth, 50);

    // ✅ إعادة الحساب عند تغيير النص داخل العنصر
    const observer = new MutationObserver(updateWidth);
    observer.observe(element, { childList: true, subtree: true });

    // ✅ تحديث العرض عند تغيير حجم العنصر
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(element);

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, [mounted]);

  return {
    widthInUnitCH,
    elementRef: elementRef as RefObject<HTMLDivElement>,
    setMounted,
  };
};

export default useWidthInUnitCH;
