import client from './client';
import { MealEntry, ManualMealPayload, PhotoMealPayload } from '@/types';

export const getMealsForDay = async (date: string): Promise<MealEntry[]> => {
  const { data } = await client.get<MealEntry[]>('/meals', { params: { date } });
  return data;
};

export const createManualMeal = async (payload: ManualMealPayload): Promise<MealEntry> => {
  const { data } = await client.post<MealEntry>('/meals/manual', payload);
  return data;
};

export const createPhotoMeal = async (payload: PhotoMealPayload): Promise<MealEntry> => {
  const { data } = await client.post<MealEntry>('/meals/photo', payload);
  return data;
};

export const updateMeal = async (
  mealId: string,
  payload: Partial<ManualMealPayload>
): Promise<MealEntry> => {
  const { data } = await client.put<MealEntry>(`/meals/${mealId}`, payload);
  return data;
};

export const deleteMeal = async (mealId: string): Promise<void> => {
  await client.delete(`/meals/${mealId}`);
};
