import {
  cancelTicketRequestSchema,
  cancelTicketResponseSchema,
  cancelTicketResponseT,
} from '@/schema/user/cancelTicketSchema';
import axiosInstance from '../axiosInstance';
import axios from 'axios';

interface ICancelParams {
  ticketId: string;
  cancellation_reason: string;
}

const cancelTicket = async ({
  ticketId,
  cancellation_reason,
}: ICancelParams): Promise<cancelTicketResponseT> => {
  try {
    // Validate locally
    cancelTicketRequestSchema.parse({ cancellation_reason });

    const response = await axiosInstance.patch(
      `/api/v1/tickets/${ticketId}/cancel`,
      { cancellation_reason }
    );

    const validateResponse = cancelTicketResponseSchema.parse(response.data);
    return validateResponse;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || error.message);
    } else {
      throw error;
    }
  }
};

export default cancelTicket;