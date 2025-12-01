import axios from 'axios';
import axiosInstance from '../axiosInstance';
import {
  ticketDetailsByIdSchema,
  ticketDetailsByIdT,
} from '@/schema/admin/ticketDetailsByIdSchema';

export interface ITicketDetailsByIdParams {
  ticket_id: string;
}

const ticketDetailsById = async ({
  ticket_id,
}: ITicketDetailsByIdParams): Promise<ticketDetailsByIdT> => {
  try {
    const response = await axiosInstance.get(
      `/api/v1/tickets/admin/${ticket_id}`,
    );
    const validateResponse = ticketDetailsByIdSchema.parse(response.data);
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

export default ticketDetailsById;
