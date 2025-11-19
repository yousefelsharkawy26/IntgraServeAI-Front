import React, { useCallback } from 'react';

const useMouseMove = () => {
  const calcOffsets = useCallback((event: React.MouseEvent) => {
    const { clientX, clientY } = event;

    const elementRect = event.currentTarget.getBoundingClientRect();
    const offsetX =
      ((clientX - elementRect.left) / elementRect.width) * 20 - 10;
    const offsetY =
      ((clientY - elementRect.top) / elementRect.height) * 20 - 10;

    return { offsetX, offsetY };
  }, []);

  return { calcOffsets };
};

export { useMouseMove };
