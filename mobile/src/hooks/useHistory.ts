import { useQuery } from '@tanstack/react-query';
import { getDailyHistory, getWeeklyHistory, getMonthlyHistory } from '@/api/history';
import { format } from 'date-fns';

export const useDailyHistory = (date: Date) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  return useQuery({
    queryKey: ['history', 'daily', dateStr],
    queryFn: () => getDailyHistory(dateStr),
  });
};

export const useWeeklyHistory = (weekStart: Date) => {
  const dateStr = format(weekStart, 'yyyy-MM-dd');
  return useQuery({
    queryKey: ['history', 'weekly', dateStr],
    queryFn: () => getWeeklyHistory(dateStr),
  });
};

export const useMonthlyHistory = (year: number, month: number) => {
  return useQuery({
    queryKey: ['history', 'monthly', year, month],
    queryFn: () => getMonthlyHistory(year, month),
  });
};
