import {
  updateUserRolesRequestT,
  updateUserRolesResponseSchema,
  updateUserRolesResponseT,
} from '@/schema/admin/updateUserRolesSchema';
import axiosInstance from '../axiosInstance';
import axios from 'axios';

const updateUserRoles = async (
  userId: string,
  data: updateUserRolesRequestT,
): Promise<updateUserRolesResponseT> => {
  try {
    const response = await axiosInstance.patch(
      `/api/v1/users/${userId}/roles`,
      data,
    );
    const validateResponse = updateUserRolesResponseSchema.parse(response.data);
    return validateResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios Error', error.message);
      throw new Error(`Axios Error: ${error.message}`);
    } else {
      console.error(error);
      throw error;
    }
  }
};

export default updateUserRoles;
