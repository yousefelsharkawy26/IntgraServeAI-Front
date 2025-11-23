import {
  loginErrorResponseSchema,
  LoginFormT,
  loginResponseSchema,
  LoginResponseT,
} from '@/schema/loginSchema';
import axios from 'axios';
import axiosInstance from './axiosInstance';

const loginUser = async (data: LoginFormT): Promise<LoginResponseT> => {
  try {
    const response = await axiosInstance.post('/api/v1/auth/login', data);
    const validateResponse = loginResponseSchema.parse(response.data);
    return validateResponse;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      try {
        console.error('Axios Error', error);
        const parsedError = loginErrorResponseSchema.parse(error.response.data);
        console.error('parsed error response', parsedError);
        throw parsedError;
      } catch (validateError) {
        console.error('validateError', validateError);
        throw error;
      }
    }
    throw error;
  }
};

const logoutUser = async () => {
  try {
    const response = await axiosInstance.get('/api/v1/auth/logout');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios Error', error.message);
    } else {
      console.error('General Error', (error as Error).message);
    }
  }
};

export { loginUser, logoutUser };
