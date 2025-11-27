import {
  userLogsResponseSchema,
  userLogsResponseT,
} from '@/schema/admin/userLogsByIdShema';
import axiosInstance from '@/services/axiosInstance'; // Adjust path to your instance
import axios from 'axios';
import z from 'zod';

export interface IUserLogsParams {
  userId: string | null;
  page: number;
  limit: number;
  sort_by?: 'last_login' | 'created_at';
  search?: string | null;
}

const getUserLogs = async ({
  limit,
  page,
  search,
  sort_by,
  userId,
}: IUserLogsParams): Promise<userLogsResponseT> => {
  try {
    const response = await axiosInstance.get(`/api/v1/users/${userId}/logs`, {
      params: {
        page,
        limit,
        sort_by,
        search,
      },
    });

    // Validate the response structure against the Zod schema
    // This throws an error if the API returns unexpected data
    const validateResponse = userLogsResponseSchema.parse(response.data);

    return validateResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios Error:', error.message);
      throw new Error(`Axios Error: ${error.message}`);
    } else if (error instanceof z.ZodError) {
      console.error('Validation Error:', error);
      throw new Error('API response validation failed');
    } else {
      console.error(error);
      throw error;
    }
  }
};

export default getUserLogs;
