import {
  userProfileResponseSchema,
  userProfileResponseT,
} from '@/schema/admin/userProfileSchema';
import axiosInstance from '@/services/axiosInstance'; // Adjust path to your instance
import axios from 'axios';
import { z } from 'zod';

const getUserProfile = async (): Promise<userProfileResponseT> => {
  try {
    const response = await axiosInstance.get('/api/v1/users/me');

    // Validate the response structure against the Zod schema
    const validateResponse = userProfileResponseSchema.parse(response.data);

    return validateResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios Error:', error.message);
      throw error;
    } else if (error instanceof z.ZodError) {
      console.error('Validation Error:', error);
      throw new Error('API response validation failed');
    } else {
      console.error(error);
      throw error;
    }
  }
};

export default getUserProfile;