import client from './client';
import { DailySummary } from '@/types';

export const getDailyHistory = async (date: string): Promise<DailySummary> => {
  const { data } = await client.get<DailySummary>('/history/daily', { params: { date } });
  return data;
};

export const getWeeklyHistory = async (weekStart: string): Promise<DailySummary[]> => {
  const { data } = await client.get<DailySummary[]>('/history/weekly', { params: { weekStart } });
  return data;
};

export const getMonthlyHistory = async (year: number, month: number): Promise<DailySummary[]> => {
  const { data } = await client.get<DailySummary[]>('/history/monthly', { params: { year, month } });
  return data;
};
