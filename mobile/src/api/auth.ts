import client from './client';
import { AuthResponse } from '@/types';

export const googleAuth = async (idToken: string): Promise<AuthResponse> => {
  const { data } = await client.post<AuthResponse>('/auth/google', { idToken });
  return data;
};
