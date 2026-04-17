import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getWeightLogs, createWeightLog } from '@/api/weightLogs';

export const useWeightLogs = () => {
  return useQuery({
    queryKey: ['weight-logs'],
    queryFn: getWeightLogs,
  });
};

export const useCreateWeightLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ weightKg, loggedAt }: { weightKg: number; loggedAt: string }) =>
      createWeightLog(weightKg, loggedAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-logs'] });
    },
  });
};
