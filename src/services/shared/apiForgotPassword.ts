import axiosInstance from '../axiosInstance';
import axios from 'axios';
import {
  ForgotPasswordResponseT,
  forgotPasswordResponseSchema,
} from '@/schema/shared/authSchema';

const forgotPassword = async (email: string): Promise<ForgotPasswordResponseT> => {
  try {
    const response = await axiosInstance.post('/api/v1/auth/forgot-password', { email });
    return forgotPasswordResponseSchema.parse(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw error;
  }
};

export default forgotPassword;
