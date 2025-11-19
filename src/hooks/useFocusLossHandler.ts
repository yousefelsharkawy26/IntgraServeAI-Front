import { QueryClient } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { useExamContext } from '../providers/context/examContext/examContext';

const useFocusLossHandler = (queryClient: QueryClient) => {
  const { levelId, lessonId } = useParams();
  const [focusLossCount, setFocusLossCount] = useState<number>(0);
  const { state: examState } = useExamContext();
  const navigate = useNavigate();

  const isFocusHandledRef = useRef(false);
  const errorToastRef = useRef<string | null>(null);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !isFocusHandledRef.current) {
        isFocusHandledRef.current = true;
        setFocusLossCount((prev) => prev + 1);
        console.log('Focus lost - Tab hidden');
      }

      if (document.visibilityState === 'visible') {
        isFocusHandledRef.current = false;
      }
    };

    if (examState.status !== 'finish' && examState.status !== 'null') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    if (examState.status === 'finish' || examState.status === 'null') {
      if (errorToastRef.current) toast.dismiss(errorToastRef.current);
      errorToastRef.current = null;
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [examState.status]);

  useEffect(() => {
    if (focusLossCount > 0 && focusLossCount <= 3) {
      errorToastRef.current = toast.error(
        `ركز, سوف يتم إغلاق الإمتحان بعد ${4 - focusLossCount} مرة من فقدان التركيز`,
        {
          icon: '‼️',
          style: { borderColor: '#f5a524', borderBottomWidth: '5px' },
          duration: 60 * 1000,
        },
      );
    }
    if (focusLossCount === 4) {
      queryClient.setQueryDefaults(['examEnter'], { staleTime: 0 });
      console.log('Exam closed due to focus loss');
      toast.error(
        `تم إغلاق الإمتحان بسبب عدم التركيز ${focusLossCount} مرات 😀`,
        {
          duration: 12 * 1000,
        },
      );
      navigate(`/levels/${levelId}/lesson/${lessonId}`);
      setFocusLossCount(0);
    }
  }, [focusLossCount, navigate, queryClient, lessonId, levelId]);
};

export { useFocusLossHandler };
