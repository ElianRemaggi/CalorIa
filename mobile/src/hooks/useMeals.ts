import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMealsForDay, createManualMeal, createPhotoMeal, deleteMeal } from '@/api/meals';
import { ManualMealPayload, PhotoMealPayload } from '@/types';
import { format } from 'date-fns';

export const useMeals = (date: Date = new Date()) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  return useQuery({
    queryKey: ['meals', dateStr],
    queryFn: () => getMealsForDay(dateStr),
    staleTime: 15_000,
  });
};

export const useCreateManualMeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ManualMealPayload) => createManualMeal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useCreatePhotoMeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PhotoMealPayload) => createPhotoMeal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteMeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mealId: string) => deleteMeal(mealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
