import axiosInstance from '../axiosInstance';
import axios from 'axios';
import { RoleUsersResponseT, roleUsersResponseSchema } from '@/schema/admin/roleUsersSchema';

export interface IRoleUsersParams {
  roleId: string;
  page?: number;
  limit?: number;
}

const getRoleUsers = async ({
  roleId,
  page = 1,
  limit = 10,
}: IRoleUsersParams): Promise<RoleUsersResponseT> => {
  try {
    const response = await axiosInstance.get(`/api/v1/roles/${roleId}/users`, {
      params: { page, limit },
    });
    return roleUsersResponseSchema.parse(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw error;
  }
};

export default getRoleUsers;
