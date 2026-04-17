import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDailyHistory, useWeeklyHistory, useMonthlyHistory } from '../useHistory';
import { DailySummary } from '@/types';

jest.mock('@/api/history', () => ({
  getDailyHistory: jest.fn(),
  getWeeklyHistory: jest.fn(),
  getMonthlyHistory: jest.fn(),
}));

import { getDailyHistory, getWeeklyHistory, getMonthlyHistory } from '@/api/history';

const mockMeal = {
  id: 'meal-1',
  sourceType: 'manual' as const,
  title: 'Almuerzo',
  mealDatetime: '2026-04-09T12:00:00Z',
  finalCalories: 500,
  finalProteinG: 30,
  finalCarbsG: 60,
  finalFatG: 12,
  createdAt: '2026-04-09T12:00:00Z',
};

const mockDailySummary: DailySummary = {
  date: '2026-04-09',
  totalCalories: 1200,
  totalProteinG: 80,
  totalCarbsG: 150,
  totalFatG: 40,
  meals: [mockMeal],
};

const mockWeeklySummary: DailySummary[] = [
  { ...mockDailySummary, date: '2026-04-07' },
  { ...mockDailySummary, date: '2026-04-08', totalCalories: 1500 },
  { ...mockDailySummary, date: '2026-04-09', totalCalories: 1200 },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useDailyHistory', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches daily summary for the given date', async () => {
    (getDailyHistory as jest.Mock).mockResolvedValueOnce(mockDailySummary);

    const { result } = renderHook(
      () => useDailyHistory(new Date('2026-04-09T12:00:00')),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getDailyHistory).toHaveBeenCalledWith('2026-04-09');
    expect(result.current.data).toEqual(mockDailySummary);
  });

  it('exposes meals inside the daily summary', async () => {
    (getDailyHistory as jest.Mock).mockResolvedValueOnce(mockDailySummary);

    const { result } = renderHook(
      () => useDailyHistory(new Date('2026-04-09T12:00:00')),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.meals).toHaveLength(1);
    expect(result.current.data!.meals[0].title).toBe('Almuerzo');
  });

  it('sets isError when fetch fails', async () => {
    (getDailyHistory as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(
      () => useDailyHistory(new Date('2026-04-09T12:00:00')),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useWeeklyHistory', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches weekly history starting from the given date', async () => {
    (getWeeklyHistory as jest.Mock).mockResolvedValueOnce(mockWeeklySummary);

    const { result } = renderHook(
      () => useWeeklyHistory(new Date('2026-04-07T12:00:00')),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getWeeklyHistory).toHaveBeenCalledWith('2026-04-07');
    expect(result.current.data).toHaveLength(3);
  });

  it('returns empty array when no data for the week', async () => {
    (getWeeklyHistory as jest.Mock).mockResolvedValueOnce([]);

    const { result } = renderHook(
      () => useWeeklyHistory(new Date('2026-04-07T12:00:00')),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('sets isError when fetch fails', async () => {
    (getWeeklyHistory as jest.Mock).mockRejectedValueOnce(new Error('Server error'));

    const { result } = renderHook(
      () => useWeeklyHistory(new Date('2026-04-07T12:00:00')),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useMonthlyHistory', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches monthly history for the given year and month', async () => {
    (getMonthlyHistory as jest.Mock).mockResolvedValueOnce(mockWeeklySummary);

    const { result } = renderHook(
      () => useMonthlyHistory(2026, 4),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getMonthlyHistory).toHaveBeenCalledWith(2026, 4);
    expect(result.current.data).toHaveLength(3);
  });

  it('sets isError when fetch fails', async () => {
    (getMonthlyHistory as jest.Mock).mockRejectedValueOnce(new Error('Unauthorized'));

    const { result } = renderHook(
      () => useMonthlyHistory(2026, 4),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
