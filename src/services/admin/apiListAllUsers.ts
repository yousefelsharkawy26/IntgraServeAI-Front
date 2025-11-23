import axios from 'axios';
import axiosInstance from '../axiosInstance';
import {
  listAllUsersErrorResponseSchema,
  //   listAllUsersResponseSchema,
  listAllUsersResponseT,
  listAllUsersSuccessResponseSchema,
} from '@/schema/admin/listAllUsersSchema';

const listAllUsers = async (
  page: number = 1,
  limit: number = 10,
): Promise<listAllUsersResponseT> => {
  try {
    const response = await axiosInstance.get('/api/v1/users', {
      params: { page, limit },
    });
    const validateResponse = listAllUsersSuccessResponseSchema.parse(
      response.data,
    );
    return validateResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.data) {
        const validateErrorResponse = listAllUsersErrorResponseSchema.parse(
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

export default listAllUsers;
