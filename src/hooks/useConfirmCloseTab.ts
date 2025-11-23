import { useEffect } from 'react';
import { useBlocker } from 'react-router';

const useConfirmCloseTab = (
  confirmationMessage: string,
  enabled: boolean = true,
) => {
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = confirmationMessage;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [confirmationMessage, enabled]);

  const blocker = useBlocker(enabled);

  useEffect(() => {
    if (blocker.state !== 'blocked') return;

    const confirm = window.confirm(confirmationMessage);

    if (confirm) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }, [blocker, confirmationMessage]);
};

export { useConfirmCloseTab };
