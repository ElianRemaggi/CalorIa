import client from './client';
import { UserProfile, ProfileRequest } from '@/types';

export const getProfile = async (): Promise<UserProfile> => {
  const { data } = await client.get<UserProfile>('/profile/me');
  return data;
};

export const upsertProfile = async (payload: ProfileRequest): Promise<UserProfile> => {
  const { data } = await client.put<UserProfile>('/profile/me', payload);
  return data;
};
