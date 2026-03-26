import axiosInstance from '../axiosInstance';
import axios from 'axios';
import {
  ResetPasswordResponseT,
  resetPasswordResponseSchema,
} from '@/schema/shared/authSchema';

const resetPassword = async (
  token: string,
  new_password: string,
): Promise<ResetPasswordResponseT> => {
  try {
    const response = await axiosInstance.post(
      `/api/v1/auth/reset-password?token=${encodeURIComponent(token)}`,
      { new_password },
    );
    return resetPasswordResponseSchema.parse(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw error;
  }
};

export default resetPassword;
