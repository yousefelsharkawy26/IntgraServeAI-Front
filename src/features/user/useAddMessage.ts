import { addMessageErrorResponseT, addMessageRequestT, addMessageResponseT } from '@/schema/user/addMessageSchema';
import addMessage from '@/services/user/apiAddMessage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

const useAddMessage = () => {
  const queryClient = useQueryClient();

  const {
    mutate: sendMessage,
    isPending: isSending,
    error: sendError,
  } = useMutation<
      addMessageResponseT,          // Success Type
      AxiosError<addMessageErrorResponseT>, // Error Type (Axios wrapping your Error Schema)
      addMessageRequestT            // Variables Type (Request Schema)
    >({
    mutationFn: (data) => addMessage(data),
    
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticketMessages', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticketDetails', variables.ticketId] });
    },
    
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    sendMessage,
    isSending,
    sendError,
  };
};

export { useAddMessage };