import {
  addMessageResponseSchema,
  addMessageResponseT,
} from '@/schema/user/addMessageSchema';
import axiosInstance from '../axiosInstance';
import { isAxiosError } from 'axios';

interface IAddMessageParams {
  ticketId: string;
  message_text?: string;
  is_internal_note: boolean;
  files?: File[];
}

const addMessage = async ({
  ticketId,
  message_text,
  is_internal_note,
  files,
}: IAddMessageParams): Promise<addMessageResponseT> => {
  try {
    const formData = new FormData();

    if (message_text) {
      formData.append('message_text', message_text);
    }

    formData.append('is_internal_note', String(is_internal_note));

    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('files', file);
      });
    }

    const response = await axiosInstance.post(
      `/api/v1/tickets/${ticketId}/messages`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    const validateResponse = addMessageResponseSchema.parse(response.data);
    return validateResponse;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      console.error('add message error', error);

      throw new Error(error.response.data.message || error.message);
    } else {
      throw error;
    }
  }
};

export default addMessage;
