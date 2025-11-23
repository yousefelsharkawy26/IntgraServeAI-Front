import {
  activateAndDeactivateRequestT,
  activateAndDeactivateResponseSchema,
  activateAndDeactivateResponseT,
} from '@/schema/admin/activateAndDeactivateSchema';
import axios from 'axios';
import axiosInstance from '../axiosInstance';

export interface IParamsActivateAndDeactivate {
  activeType: 'activate' | 'deactivate';
  data: activateAndDeactivateRequestT;
}

const activateAndDeactivate = async ({
  activeType,
  data,
}: IParamsActivateAndDeactivate): Promise<activateAndDeactivateResponseT> => {
  try {
    const response = await axiosInstance.patch(
      `/api/v1/users/bulk/${activeType}`,
      data,
    );
    const validateResponse = activateAndDeactivateResponseSchema.parse(
      response.data,
    );
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

export default activateAndDeactivate;
