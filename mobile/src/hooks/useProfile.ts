import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProfile, upsertProfile } from '@/api/profile';
import { ProfileRequest } from '@/types';

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProfileRequest) => upsertProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
