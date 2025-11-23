import {
  usersStatisticsSchema,
  usersStatisticsT,
} from '@/schema/admin/usersStatisticsSchema';
import axiosInstance from '../axiosInstance';
import axios from 'axios';

const usersStatistics = async (): Promise<usersStatisticsT> => {
  try {
    const response = await axiosInstance.get('/api/v1/users/statistics');
    const validateResponse = usersStatisticsSchema.parse(response.data);
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

export default usersStatistics;
