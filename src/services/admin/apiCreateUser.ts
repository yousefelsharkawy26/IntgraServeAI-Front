import {
  createUserRequestT,
  createUserResponseSchema,
  createUserResponseT,
} from '@/schema/admin/createUserSchema';
import axios from 'axios';
import axiosInstance from '../axiosInstance';

const createUser = async (
  data: createUserRequestT,
): Promise<createUserResponseT> => {
  try {
    const response = await axiosInstance.post('/api/v1/users', data);
    const validateResponse = createUserResponseSchema.parse(response.data);
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

export default createUser;
