import { Button } from '@/components/ui/button.tsx';
import { useMoveBack } from '@/hooks/useMoveBack';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

interface IProps {
  className?: string;
  fallbackPath?: string;
}

const ButtonMoveBack = ({ className, fallbackPath }: IProps) => {
  const moveBack = useMoveBack();
  const navigate = useNavigate();
  return (
    <Button
      className={`fixed inset-0 top-16 left-0 z-30 mr-auto mb-4 flex h-fit w-fit flex-row items-center justify-center py-1 md:top-16 md:left-0 ${className}`}
      variant="ghost"
      onClick={() => (fallbackPath ? navigate(fallbackPath) : moveBack())}
    >
      <ChevronLeft size={17} className="mr-1" />
      Back
    </Button>
  );
};
export default ButtonMoveBack;
