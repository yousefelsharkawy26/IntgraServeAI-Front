import {
  resolveTicketRequestSchema,
  resolveTicketResponseSchema,
  resolveTicketResponseT,
} from '@/schema/user/resolveTicketSchema';
import axiosInstance from '../axiosInstance';
import axios from 'axios';

interface IResolveParams {
  ticketId: string;
  resolution_notes: string;
}

const resolveTicket = async ({
  ticketId,
  resolution_notes,
}: IResolveParams): Promise<resolveTicketResponseT> => {
  try {
    // Validate request data locally first
    resolveTicketRequestSchema.parse({ resolution_notes });

    const response = await axiosInstance.patch(
      `/api/v1/tickets/${ticketId}/resolve`,
      { resolution_notes }
    );

    const validateResponse = resolveTicketResponseSchema.parse(response.data);
    return validateResponse;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || error.message);
    } else {
      throw error;
    }
  }
};

export default resolveTicket;