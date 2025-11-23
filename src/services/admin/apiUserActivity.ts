import {
  userActivityErrorResponseSchema,
  userActivityResponseT,
  userActivitySuccessResponseSchema,
} from '@/schema/admin/userActivitySchema';
import axios from 'axios';
import axiosInstance from '../axiosInstance';

export interface IUserActivityParams {
  page?: number;
  limit?: number;
  sort_by?: 'last_login' | 'created_at';
}

const userActivity = async ({
  limit,
  page,
  sort_by,
}: IUserActivityParams): Promise<userActivityResponseT> => {
  try {
    const response = await axiosInstance.get('/api/v1/users/activity', {
      params: { page, limit, sort_by },
    });
    const validateResponse = userActivitySuccessResponseSchema.parse(
      response.data,
    );
    return validateResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.data) {
        const validateErrorResponse = userActivityErrorResponseSchema.parse(
          error.response.data,
        );
        throw new Error(validateErrorResponse.detail);
      }
      console.error('Axios Error', error);
      throw new Error(`Axios Error: ${error}`);
    } else {
      console.error(error);
      throw error;
    }
  }
};

export default userActivity;
