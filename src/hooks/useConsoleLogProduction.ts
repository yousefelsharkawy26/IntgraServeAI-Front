import { useEffect } from 'react';

const useConsoleLogProduction = () => {
  useEffect(() => {
    const log = console['log'];
    if (import.meta.env.MODE === 'production') {
      queueMicrotask(() => {
        log(
          `%c IntgraAI
%c intgra-serve-ai
      `,
          'color: #ff461e; font-size: 70px; font-family: "Comic Sans MS", cursive;',
          'font-size: 16px;',
        );
      });
    }
  }, []);
};

export default useConsoleLogProduction;
