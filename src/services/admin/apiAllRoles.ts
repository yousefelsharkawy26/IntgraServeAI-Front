import {
  allRolesResponseSchema,
  allRolesResponseT,
} from '@/schema/admin/allRolesSchema';
import axios from 'axios';
import axiosInstance from '../axiosInstance';

const allRoles = async (): Promise<allRolesResponseT> => {
  try {
    const response = await axiosInstance.get('/api/v1/roles');
    const validateResponse = allRolesResponseSchema.parse(response.data);
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

export default allRoles;
