import {
  closeTicketResponseSchema,
  closeTicketResponseT,
} from '@/schema/user/closeTicketSchema';
import axiosInstance from '../axiosInstance';
import axios from 'axios';

const closeTicket = async (ticketId: string): Promise<closeTicketResponseT> => {
  try {
    const response = await axiosInstance.patch(
      `/api/v1/tickets/${ticketId}/close`
    );

    const validateResponse = closeTicketResponseSchema.parse(response.data);
    return validateResponse;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || error.message);
    } else {
      throw error;
    }
  }
};

export default closeTicket;