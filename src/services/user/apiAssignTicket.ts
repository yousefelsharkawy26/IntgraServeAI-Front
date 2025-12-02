import {
  assignTicketResponseSchema,
  assignTicketResponseT,
} from '@/schema/user/assignTicketSchema';
import axiosInstance from '../axiosInstance';
import axios from 'axios';

const assignTicketToMe = async (ticketId: string): Promise<assignTicketResponseT> => {
  try {
    const response = await axiosInstance.patch(
      `/api/v1/tickets/${ticketId}/assign-to-me`
    );

    const validateResponse = assignTicketResponseSchema.parse(response.data);
    return validateResponse;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Backend sent an error message (e.g. "Ticket not found")
      throw new Error(error.response.data.message || error.message);
    } else {
      throw error;
    }
  }
};

export default assignTicketToMe;