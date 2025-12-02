import {
  allTicketsResponseSchema,
  allTicketsResponseT,
  ticketPriorityEnumT,
  ticketSortByEnumT,
  ticketStatusEnumT,
} from '@/schema/shared/allTicketsSchema';
import axios from 'axios';
import axiosInstance from '../axiosInstance';

// Interface for API Parameters
export interface IMyTicketsParams {
  page?: number;
  limit?: number;
  status?: ticketStatusEnumT;
  priority?: ticketPriorityEnumT;
  sort_by?: ticketSortByEnumT;
  search?: string | null;
}

const myTickets = async ({
  limit,
  page,
  priority,
  search,
  sort_by,
  status,
}: IMyTicketsParams): Promise<allTicketsResponseT> => {
  try {
    const response = await axiosInstance.get('/api/v1/tickets/my-tickets', {
      params: {
        page,
        limit,
        status,
        priority,
        sort_by,
        search,
      },
    });

    // Validate the response with Zod
    const validateResponse = allTicketsResponseSchema.parse(response.data);
    return validateResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios Error', error.message);
      throw new Error(`Axios Error: ${error.message}`);
    } else {
      console.error(error);
      throw error;
    }
  }
};

export default myTickets;