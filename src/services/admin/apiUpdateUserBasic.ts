import {
  updateUserBasicRequestT,
  updateUserBasicResponseSchema,
  updateUserBasicResponseT,
} from '@/schema/admin/updateUserBasicSchema';
import axiosInstance from '../axiosInstance';
import axios from 'axios';

const updateUserBasic = async (
  userId: string,
  data: updateUserBasicRequestT,
): Promise<updateUserBasicResponseT> => {
  try {
    const response = await axiosInstance.patch(`/api/v1/users/${userId}`, data);
    const validateResponse = updateUserBasicResponseSchema.parse(response.data);
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

export default updateUserBasic;
