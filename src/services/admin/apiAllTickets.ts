import {
  allTicketsResponseSchema,
  allTicketsResponseT,
  ticketPriorityEnumT,
  ticketSortByEnumT,
  ticketStatusEnumT,
  ticketTypeEnumT,
} from '@/schema/shared/allTicketsSchema';
import axiosInstance from '../axiosInstance';
import axios from 'axios';

export interface IAllTicketsParams {
  page?: number;
  limit?: number;
  status?: ticketStatusEnumT;
  priority?: ticketPriorityEnumT;
  ticket_type?: ticketTypeEnumT;
  is_closed?: boolean;
  assignee_id?: string | null;
  sort_by?: ticketSortByEnumT;
  search?: string | null;
}

const allTickets = async ({
  assignee_id,
  is_closed,
  limit,
  page,
  priority,
  search,
  sort_by,
  status,
  ticket_type,
}: IAllTicketsParams): Promise<allTicketsResponseT> => {
  try {
    const response = await axiosInstance.get('/api/v1/tickets/admin/all', {
      params: {
        page,
        limit,
        status,
        priority,
        ticket_type,
        is_closed,
        assignee_id,
        sort_by,
        search,
      },
    });

    const validateResponse = allTicketsResponseSchema.parse(response.data);
    return validateResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios Error', error.message);
      throw new Error(`Axios Error', ${error.message}`);
    } else {
      console.error(error);
      throw error;
    }
  }
};

export default allTickets;
