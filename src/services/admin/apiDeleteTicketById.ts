import axios from 'axios';
import axiosInstance from '../axiosInstance';
import {
  deleteTicketByIdResponseSchema,
  deleteTicketByIdT,
} from '@/schema/admin/deleteTicketByIdSchema';

export interface IDeleteTicketByIdParams {
  ticket_id: string;
}

const deleteTicketById = async ({
  ticket_id,
}: IDeleteTicketByIdParams): Promise<deleteTicketByIdT> => {
  try {
    const response = await axiosInstance.delete(
      `/api/v1/tickets/admin/${ticket_id}`,
    );
    const validateResponse = deleteTicketByIdResponseSchema.parse(
      response.data,
    );
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

export default deleteTicketById;
