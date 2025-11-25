import {
  updateProfileRequestT,
  updateProfileResponseSchema,
  updateProfileResponseT,
} from '@/schema/admin/updateProfileSchema';
import axiosInstance from '@/services/axiosInstance'; // Adjust path to your instance
import axios from 'axios';

const updateProfile = async (
  data: updateProfileRequestT
): Promise<updateProfileResponseT> => {
  try {
    const response = await axiosInstance.patch('/api/v1/users/me', data);
    
    // Validate the response structure against the Zod schema
    const validateResponse = updateProfileResponseSchema.parse(response.data);
    
    return validateResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios Error', error.message);
      // We re-throw the original error here so the Form component 
      // can access 'error.response.data.errors' to show field-level validation.
      throw error; 
    } else {
      console.error(error);
      throw error;
    }
  }
};

export default updateProfile;