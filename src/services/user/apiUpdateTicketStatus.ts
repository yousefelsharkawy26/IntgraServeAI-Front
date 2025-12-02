import {
  updateTicketStatusRequestSchema,
  updateTicketStatusResponseSchema,
  updateTicketStatusResponseT,
  updateTicketStatusRequestT
} from '@/schema/user/updateTicketStatusSchema';
import axiosInstance from '../axiosInstance';
import axios from 'axios';

interface IUpdateParams extends updateTicketStatusRequestT {
  ticketId: string;
}

const updateTicketStatus = async ({
  ticketId,
  status,
  notes
}: IUpdateParams): Promise<updateTicketStatusResponseT> => {
  try {
    // Validate Input before sending (Defensive programming)
    updateTicketStatusRequestSchema.parse({ status, notes });

    const response = await axiosInstance.patch(
      `/api/v1/tickets/${ticketId}/status`,
      { status, notes }
    );

    const validateResponse = updateTicketStatusResponseSchema.parse(response.data);
    return validateResponse;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || error.message);
    } else {
      throw error;
    }
  }
};

export default updateTicketStatus;