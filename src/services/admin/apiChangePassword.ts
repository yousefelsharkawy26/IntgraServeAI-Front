import {
  changePasswordRequestT,
  changePasswordResponseSchema,
  changePasswordResponseT,
} from '@/schema/admin/changePasswordSchema';
import axiosInstance from '@/services/axiosInstance'; 
import axios from 'axios';

const changePassword = async (
  data: changePasswordRequestT
): Promise<changePasswordResponseT> => {
  try {
    console.log(data);
    
    const response = await axiosInstance.patch('/api/v1/users/me/password', data);

    const validateResponse = changePasswordResponseSchema.parse(response.data);
    
    return validateResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios Error', error.message);
      throw error;
    } else {
      console.error(error);
      throw error;
    }
  }
};

export default changePassword;