import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useWeightLogs, useCreateWeightLog } from '../useWeight';
import { WeightLogEntry } from '@/types';

jest.mock('@/api/weightLogs', () => ({
  getWeightLogs: jest.fn(),
  createWeightLog: jest.fn(),
}));

import { getWeightLogs, createWeightLog } from '@/api/weightLogs';

const mockLogs: WeightLogEntry[] = [
  { id: 'log-1', weightKg: 75.5, loggedAt: '2026-04-10' },
  { id: 'log-2', weightKg: 76.0, loggedAt: '2026-04-08' },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useWeightLogs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches and returns weight logs', async () => {
    (getWeightLogs as jest.Mock).mockResolvedValueOnce(mockLogs);

    const { result } = renderHook(() => useWeightLogs(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getWeightLogs).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockLogs);
  });

  it('returns empty array when no logs exist', async () => {
    (getWeightLogs as jest.Mock).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useWeightLogs(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('first entry is the most recent log', async () => {
    (getWeightLogs as jest.Mock).mockResolvedValueOnce(mockLogs);

    const { result } = renderHook(() => useWeightLogs(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // API returns logs ordered by date desc — most recent first
    expect(result.current.data![0].loggedAt).toBe('2026-04-10');
  });

  it('sets isError when fetch fails', async () => {
    (getWeightLogs as jest.Mock).mockRejectedValueOnce(new Error('Unauthorized'));

    const { result } = renderHook(() => useWeightLogs(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateWeightLog', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls createWeightLog with the correct weightKg and loggedAt', async () => {
    const newLog: WeightLogEntry = { id: 'log-3', weightKg: 74.8, loggedAt: '2026-04-11' };
    (createWeightLog as jest.Mock).mockResolvedValueOnce(newLog);

    const { result } = renderHook(() => useCreateWeightLog(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({ weightKg: 74.8, loggedAt: '2026-04-11' });
    });

    expect(createWeightLog).toHaveBeenCalledWith(74.8, '2026-04-11');
  });

  it('returns the created entry on success', async () => {
    const newLog: WeightLogEntry = { id: 'log-3', weightKg: 74.8, loggedAt: '2026-04-11' };
    (createWeightLog as jest.Mock).mockResolvedValueOnce(newLog);

    const { result } = renderHook(() => useCreateWeightLog(), { wrapper: createWrapper() });

    let returned: WeightLogEntry | undefined;
    await act(async () => {
      returned = await result.current.mutateAsync({ weightKg: 74.8, loggedAt: '2026-04-11' });
    });

    expect(returned).toEqual(newLog);
  });

  it('exposes error when mutation fails', async () => {
    (createWeightLog as jest.Mock).mockRejectedValueOnce(new Error('Validation error'));

    const { result } = renderHook(() => useCreateWeightLog(), { wrapper: createWrapper() });

    await act(async () => {
      try {
        await result.current.mutateAsync({ weightKg: 10, loggedAt: '2026-04-11' });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
