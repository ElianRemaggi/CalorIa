import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '@/api/dashboard';
import { format } from 'date-fns';

export const useDashboard = (date: Date = new Date()) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  return useQuery({
    queryKey: ['dashboard', dateStr],
    queryFn: () => getDashboard(dateStr),
    staleTime: 30_000,
  });
};
