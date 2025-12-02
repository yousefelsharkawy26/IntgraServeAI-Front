import {
  allTicketsResponseSchema,
  allTicketsResponseT,
  ticketPriorityEnumT,
  ticketSortByEnumT,
} from '@/schema/shared/allTicketsSchema';
import axiosInstance from '../axiosInstance';
import axios from 'axios';

// Interface specific to this endpoint params
export interface IUnassignedTicketsParams {
  page?: number;
  limit?: number;
  priority?: ticketPriorityEnumT;
  sort_by?: ticketSortByEnumT;
  search?: string | null;
}

const unassignedTickets = async ({
  limit,
  page,
  priority,
  search,
  sort_by,
}: IUnassignedTicketsParams): Promise<allTicketsResponseT> => {
  try {
    const response = await axiosInstance.get('/api/v1/tickets/unassigned', {
      params: {
        page,
        limit,
        priority, // Only priority is allowed as a filter here
        sort_by,
        search,
      },
    });

    // Zod Validation
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

export default unassignedTickets;