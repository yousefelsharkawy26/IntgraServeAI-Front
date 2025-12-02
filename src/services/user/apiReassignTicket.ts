import {
  reassignTicketRequestSchema,
  reassignTicketResponseSchema,
  reassignTicketResponseT,
} from '@/schema/user/reassignTicketSchema';
import axiosInstance from '../axiosInstance';
import axios from 'axios';

interface IReassignParams {
  ticketId: string;
  reason: string;
}

const reassignTicket = async ({
  ticketId,
  reason,
}: IReassignParams): Promise<reassignTicketResponseT> => {
  try {
    // Validate Input
    reassignTicketRequestSchema.parse({ reason });

    // Patch request is commonly used for partial updates/actions
    const response = await axiosInstance.patch(
      `/api/v1/tickets/${ticketId}/reassign`,
      { reason }
    );

    const validateResponse = reassignTicketResponseSchema.parse(response.data);
    return validateResponse;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || error.message);
    } else {
      throw error;
    }
  }
};

export default reassignTicket;