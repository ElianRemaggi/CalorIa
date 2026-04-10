import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDashboard } from '../useDashboard';
import { DashboardSummary } from '@/types';

jest.mock('@/api/dashboard', () => ({
  getDashboard: jest.fn(),
}));

import { getDashboard } from '@/api/dashboard';

const mockDashboard: DashboardSummary = {
  date: '2026-04-09',
  targetCalories: 2000,
  consumedCalories: 850,
  remainingCalories: 1150,
  targetProteinG: 150,
  consumedProteinG: 60,
  remainingProteinG: 90,
  targetCarbsG: 200,
  consumedCarbsG: 90,
  remainingCarbsG: 110,
  targetFatG: 65,
  consumedFatG: 25,
  remainingFatG: 40,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useDashboard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches dashboard data for the given date', async () => {
    (getDashboard as jest.Mock).mockResolvedValueOnce(mockDashboard);

    // Use local noon to avoid UTC/local timezone offset shifting the date
    const { result } = renderHook(() => useDashboard(new Date('2026-04-09T12:00:00')), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getDashboard).toHaveBeenCalledWith('2026-04-09');
    expect(result.current.data).toEqual(mockDashboard);
  });

  it('uses today when no date is provided', async () => {
    (getDashboard as jest.Mock).mockResolvedValueOnce(mockDashboard);

    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getDashboard).toHaveBeenCalledTimes(1);
  });

  it('sets isError when fetch fails', async () => {
    (getDashboard as jest.Mock).mockRejectedValueOnce(new Error('Unauthorized'));

    const { result } = renderHook(() => useDashboard(new Date('2026-04-09T12:00:00')), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('returns correct remaining values', async () => {
    (getDashboard as jest.Mock).mockResolvedValueOnce(mockDashboard);

    const { result } = renderHook(() => useDashboard(new Date('2026-04-09T12:00:00')), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const data = result.current.data!;
    expect(data.remainingCalories).toBe(data.targetCalories - data.consumedCalories);
    expect(data.remainingProteinG).toBe(data.targetProteinG - data.consumedProteinG);
  });
});
