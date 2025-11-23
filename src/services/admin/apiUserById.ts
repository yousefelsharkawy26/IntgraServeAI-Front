import { userByIdSchema, userByIdT } from '@/schema/admin/userByIdSchema';
import axiosInstance from '../axiosInstance';
import axios from 'axios';

const userById = async (userId: string): Promise<userByIdT> => {
  try {
    const response = await axiosInstance.get(`/api/v1/users/${userId}`);
    const validateResponse = userByIdSchema.parse(response.data);
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

export default userById;
