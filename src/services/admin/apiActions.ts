import axiosInstance from '../axiosInstance';
import axios from 'axios';
import {
  ActionListResponseT, ActionFullT, BackupInfoT, BackupCompareT, BackupContentT,
  actionListResponseSchema, actionFullSchema, actionMutationResponseSchema,
  actionToggleResponseSchema, actionValidateResponseSchema, actionTypesResponseSchema,
  backupListResponseSchema, backupContentResponseSchema, backupRestoreResponseSchema,
  backupDeleteResponseSchema, backupDeleteAllResponseSchema, backupCompareResponseSchema,
} from '@/schema/admin/actionsSchema';

const BASE = '/api/v1/actions';

const handleError = (error: unknown): never => {
  if (axios.isAxiosError(error) && error.response?.data?.detail) {
    throw new Error(error.response.data.detail);
  }
  throw error;
};

// ─── List & Filter ────────────────────────────────────────────────────────────
export interface IListActionsParams {
  type?: string | null;
  active?: boolean | null;
  search?: string | null;
}

export const listActions = async (params: IListActionsParams): Promise<ActionListResponseT> => {
  try {
    const response = await axiosInstance.get(BASE, {
      params: {
        type: params.type || undefined,
        active: params.active !== null ? params.active : undefined,
        search: params.search || undefined,
      },
    });
    return actionListResponseSchema.parse(response.data);
  } catch (e) { return handleError(e); }
};

// ─── Get Single ───────────────────────────────────────────────────────────────
export const getAction = async (id: string): Promise<ActionFullT> => {
  try {
    const response = await axiosInstance.get(`${BASE}/${id}`);
    return actionFullSchema.parse(response.data);
  } catch (e) { return handleError(e); }
};

// ─── Create ───────────────────────────────────────────────────────────────────
export const createAction = async (data: Record<string, unknown>) => {
  try {
    const response = await axiosInstance.post(BASE, data);
    return actionMutationResponseSchema.parse(response.data);
  } catch (e) { return handleError(e); }
};

// ─── Update ───────────────────────────────────────────────────────────────────
export const updateAction = async (id: string, data: Record<string, unknown>) => {
  try {
    const response = await axiosInstance.put(`${BASE}/${id}`, data);
    return actionMutationResponseSchema.parse(response.data);
  } catch (e) { return handleError(e); }
};

// ─── Delete ───────────────────────────────────────────────────────────────────
export const deleteAction = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`${BASE}/${id}`);
    return actionMutationResponseSchema.parse(response.data);
  } catch (e) { return handleError(e); }
};

// ─── Toggle ───────────────────────────────────────────────────────────────────
export const toggleAction = async (id: string) => {
  try {
    const response = await axiosInstance.patch(`${BASE}/${id}/toggle`);
    return actionToggleResponseSchema.parse(response.data);
  } catch (e) { return handleError(e); }
};

// ─── Validate ─────────────────────────────────────────────────────────────────
export const validateAction = async (data: Record<string, unknown>) => {
  try {
    const response = await axiosInstance.post(`${BASE}/validate`, data);
    return actionValidateResponseSchema.parse(response.data);
  } catch (e) { return handleError(e); }
};

// ─── Types info ───────────────────────────────────────────────────────────────
export const getActionTypes = async () => {
  try {
    const response = await axiosInstance.get(`${BASE}/types`);
    return actionTypesResponseSchema.parse(response.data);
  } catch (e) { return handleError(e); }
};

// ─── Backups: List ────────────────────────────────────────────────────────────
export const listBackups = async (): Promise<{ total: number; backups: BackupInfoT[] }> => {
  try {
    const response = await axiosInstance.get(`${BASE}/backups`);
    return backupListResponseSchema.parse(response.data);
  } catch (e) { return handleError(e); }
};

// ─── Backups: Get Content ─────────────────────────────────────────────────────
export const getBackupContent = async (filename: string): Promise<BackupContentT> => {
  try {
    const response = await axiosInstance.get(`${BASE}/backups/${encodeURIComponent(filename)}`);
    return backupContentResponseSchema.parse(response.data);
  } catch (e) { return handleError(e); }
};

// ─── Backups: Compare ─────────────────────────────────────────────────────────
export const compareBackup = async (filename: string): Promise<BackupCompareT> => {
  try {
    const response = await axiosInstance.get(`${BASE}/backups/${encodeURIComponent(filename)}/compare`);
    return backupCompareResponseSchema.parse(response.data);
  } catch (e) { return handleError(e); }
};

// ─── Backups: Restore ─────────────────────────────────────────────────────────
export const restoreBackup = async (filename: string) => {
  try {
    const response = await axiosInstance.post(`${BASE}/backups/${encodeURIComponent(filename)}/restore`);
    return backupRestoreResponseSchema.parse(response.data);
  } catch (e) { return handleError(e); }
};

// ─── Backups: Delete One ──────────────────────────────────────────────────────
export const deleteBackup = async (filename: string) => {
  try {
    const response = await axiosInstance.delete(`${BASE}/backups/${encodeURIComponent(filename)}`);
    return backupDeleteResponseSchema.parse(response.data);
  } catch (e) { return handleError(e); }
};

// ─── Backups: Delete All ──────────────────────────────────────────────────────
export const deleteAllBackups = async () => {
  try {
    const response = await axiosInstance.delete(`${BASE}/backups`);
    return backupDeleteAllResponseSchema.parse(response.data);
  } catch (e) { return handleError(e); }
};
