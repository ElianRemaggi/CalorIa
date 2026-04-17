import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useProfile, useUpdateProfile } from '../useProfile';
import { UserProfile, ProfileRequest } from '@/types';

jest.mock('@/api/profile', () => ({
  getProfile: jest.fn(),
  upsertProfile: jest.fn(),
}));

import { getProfile, upsertProfile } from '@/api/profile';

const mockProfile: UserProfile = {
  userId: 'user-123',
  gender: 'male',
  age: 28,
  heightCm: 175,
  weightKg: 75,
  goalType: 'maintain',
  targetCalories: 2200,
  targetProteinG: 165,
  targetCarbsG: 220,
  targetFatG: 73,
  onboardingCompleted: true,
};

const mockRequest: ProfileRequest = {
  gender: 'male',
  age: 30,
  heightCm: 175,
  weightKg: 78,
  goalType: 'lose',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches and returns the current user profile', async () => {
    (getProfile as jest.Mock).mockResolvedValueOnce(mockProfile);

    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getProfile).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockProfile);
  });

  it('exposes nutrition targets from the profile', async () => {
    (getProfile as jest.Mock).mockResolvedValueOnce(mockProfile);

    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const data = result.current.data!;
    expect(data.targetCalories).toBe(2200);
    expect(data.targetProteinG).toBe(165);
    expect(data.targetCarbsG).toBe(220);
    expect(data.targetFatG).toBe(73);
  });

  it('sets isError when fetch fails', async () => {
    (getProfile as jest.Mock).mockRejectedValueOnce(new Error('Not found'));

    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useUpdateProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls upsertProfile with the correct payload', async () => {
    const updatedProfile = { ...mockProfile, age: 30, weightKg: 78, goalType: 'lose' as const };
    (upsertProfile as jest.Mock).mockResolvedValueOnce(updatedProfile);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync(mockRequest);
    });

    expect(upsertProfile).toHaveBeenCalledWith(mockRequest);
  });

  it('returns updated profile data on success', async () => {
    const updatedProfile = { ...mockProfile, age: 30 };
    (upsertProfile as jest.Mock).mockResolvedValueOnce(updatedProfile);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

    let returned: typeof updatedProfile | undefined;
    await act(async () => {
      returned = await result.current.mutateAsync(mockRequest);
    });

    expect(returned).toEqual(updatedProfile);
  });

  it('exposes error when mutation fails', async () => {
    (upsertProfile as jest.Mock).mockRejectedValueOnce(new Error('Server error'));

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

    await act(async () => {
      try {
        await result.current.mutateAsync(mockRequest);
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
