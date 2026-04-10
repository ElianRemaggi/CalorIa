import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useMeals, useCreateManualMeal, useDeleteMeal } from '../useMeals';
import { MealEntry, ManualMealPayload } from '@/types';

jest.mock('@/api/meals', () => ({
  getMealsForDay: jest.fn(),
  createManualMeal: jest.fn(),
  createPhotoMeal: jest.fn(),
  deleteMeal: jest.fn(),
}));

import { getMealsForDay, createManualMeal, deleteMeal } from '@/api/meals';

const mockMeals: MealEntry[] = [
  {
    id: 'meal-1',
    sourceType: 'manual',
    title: 'Desayuno',
    mealDatetime: '2026-04-09T08:00:00Z',
    finalCalories: 300,
    finalProteinG: 15,
    finalCarbsG: 40,
    finalFatG: 8,
    createdAt: '2026-04-09T08:00:00Z',
  },
];

const manualPayload: ManualMealPayload = {
  title: 'Almuerzo',
  mealDateTime: '2026-04-09T13:00:00Z',
  finalCalories: 500,
  finalProteinG: 30,
  finalCarbsG: 60,
  finalFatG: 12,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useMeals', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns meals for the given date', async () => {
    (getMealsForDay as jest.Mock).mockResolvedValueOnce(mockMeals);
    // Use local noon to avoid UTC/local timezone offset shifting the date
    const { result } = renderHook(() => useMeals(new Date('2026-04-09T12:00:00')), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockMeals);
    expect(getMealsForDay).toHaveBeenCalledWith('2026-04-09');
  });

  it('returns empty array when no meals exist', async () => {
    (getMealsForDay as jest.Mock).mockResolvedValueOnce([]);
    const { result } = renderHook(() => useMeals(new Date('2026-04-09T12:00:00')), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('sets isError when fetch fails', async () => {
    (getMealsForDay as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useMeals(new Date('2026-04-09T12:00:00')), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateManualMeal', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls createManualMeal with correct payload', async () => {
    const newMeal = { ...mockMeals[0], id: 'meal-2', title: 'Almuerzo' };
    (createManualMeal as jest.Mock).mockResolvedValueOnce(newMeal);

    const { result } = renderHook(() => useCreateManualMeal(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(manualPayload);
    });

    expect(createManualMeal).toHaveBeenCalledWith(manualPayload);
  });

  it('exposes error when mutation fails', async () => {
    (createManualMeal as jest.Mock).mockRejectedValueOnce(new Error('Server error'));

    const { result } = renderHook(() => useCreateManualMeal(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync(manualPayload);
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useDeleteMeal', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls deleteMeal with the correct meal ID', async () => {
    (deleteMeal as jest.Mock).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useDeleteMeal(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync('meal-1');
    });

    expect(deleteMeal).toHaveBeenCalledWith('meal-1');
  });
});
