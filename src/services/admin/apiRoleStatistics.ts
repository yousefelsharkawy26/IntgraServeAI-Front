import axiosInstance from '../axiosInstance';
import axios from 'axios';
import { RoleStatisticsT, roleStatisticsSchema } from '@/schema/admin/roleStatisticsSchema';

const getRoleStatistics = async (): Promise<RoleStatisticsT> => {
  try {
    const response = await axiosInstance.get('/api/v1/roles/statistics');
    return roleStatisticsSchema.parse(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw error;
  }
};

export default getRoleStatistics;
