import {
  updateUserPasswordRequestT,
  updateUserPasswordResponseSchema,
  updateUserPasswordResponseT,
} from '@/schema/admin/updateUserPasswordSchema';
import axiosInstance from '../axiosInstance';
import axios from 'axios';

const updateUserPassword = async (
  userId: string,
  data: updateUserPasswordRequestT,
): Promise<updateUserPasswordResponseT> => {
  try {
    const response = await axiosInstance.patch(
      `/api/v1/users/${userId}/password`,
      data,
    );
    const validateResponse = updateUserPasswordResponseSchema.parse(
      response.data,
    );
    return validateResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios Error', error.message);
      throw new Error(`Axios Error: ${error.message}`);
    } else {
      console.error(error);
      throw error;
    }
  }
};

export default updateUserPassword;
