import { userByTokenSchema, userByTokenT } from '@/schema/userByTokenSchema';
import axiosInstance from './axiosInstance';
import axios from 'axios';

const userByToken = async (): Promise<userByTokenT> => {
  try {
    const response = await axiosInstance.get('/api/v1/users/me');
    const validateResponse = userByTokenSchema.parse(response.data);
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

export default userByToken;
