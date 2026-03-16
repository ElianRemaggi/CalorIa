import client from './client';
import { WeightLogEntry } from '@/types';

export const getWeightLogs = async (): Promise<WeightLogEntry[]> => {
  const { data } = await client.get<WeightLogEntry[]>('/weight-logs');
  return data;
};

export const createWeightLog = async (weightKg: number, loggedAt: string): Promise<WeightLogEntry> => {
  const { data } = await client.post<WeightLogEntry>('/weight-logs', { weightKg, loggedAt });
  return data;
};
