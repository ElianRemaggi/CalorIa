import client from './client';
import { DashboardSummary } from '@/types';

export const getDashboard = async (date: string): Promise<DashboardSummary> => {
  const { data } = await client.get<DashboardSummary>('/dashboard', { params: { date } });
  return data;
};
