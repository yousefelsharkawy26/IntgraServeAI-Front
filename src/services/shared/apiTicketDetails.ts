import {
  ticketDetailsResponseT,
  ticketDetailsSchema,
} from '@/schema/shared/ticketDetailsSchema';
import axiosInstance from '../axiosInstance';
import axios from 'axios';

const getTicketDetails = async (ticketId: string): Promise<ticketDetailsResponseT> => {
  try {
    const response = await axiosInstance.get(`/api/v1/tickets/${ticketId}`);

    const validateResponse = ticketDetailsSchema.parse(response.data);
    return validateResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message);
    } else {
      console.error(error);
      throw error;
    }
  }
};

export default getTicketDetails;