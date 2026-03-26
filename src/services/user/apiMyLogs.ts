import axiosInstance from '../axiosInstance';
import axios from 'axios';
import { MyLogsResponseT, myLogsResponseSchema } from '@/schema/user/myLogsSchema';

export interface IMyLogsParams {
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'action_type';
  search?: string | null;
}

const getMyLogs = async ({
  page = 1,
  limit = 10,
  sort_by = 'created_at',
  search,
}: IMyLogsParams): Promise<MyLogsResponseT> => {
  try {
    const response = await axiosInstance.get('/api/v1/users/me/logs', {
      params: { page, limit, sort_by, search: search || undefined },
    });
    return myLogsResponseSchema.parse(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw error;
  }
};

export default getMyLogs;
