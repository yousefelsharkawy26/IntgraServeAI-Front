import axios from 'axios';
import axiosInstance from '../axiosInstance';
import { ticketsStatisticsSchema } from '@/schema/admin/ticketsStatisticsSchema';

const ticketsStatistics = async () => {
  try {
    const response = await axiosInstance.get(
      '/api/v1/tickets/admin/statistics',
    );
    const validateResponse = ticketsStatisticsSchema.parse(response.data);
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

export default ticketsStatistics;
