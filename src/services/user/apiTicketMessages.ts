import {
  ticketMessagesResponseSchema,
  ticketMessagesResponseT,
} from '@/schema/user/ticketMessagesSchema';
import axiosInstance from '../axiosInstance';
import axios from 'axios';

interface IGetTicketMessagesParams {
  ticketId: string;
  page?: number;
  limit?: number;
}

const getTicketMessages = async ({
  ticketId,
  page = 1,
  limit = 20,
}: IGetTicketMessagesParams): Promise<ticketMessagesResponseT> => {
  try {
    const response = await axiosInstance.get(
      `/api/v1/tickets/${ticketId}/messages`,
      {
        params: {
          page,
          limit,
        },
      }
    );

    const validateResponse = ticketMessagesResponseSchema.parse(response.data);
    return validateResponse;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const message = error.response.data.message || 'Failed to fetch messages';
      throw new Error(message);
    } else {
      console.error(error);
      throw error;
    }
  }
};

export default getTicketMessages;