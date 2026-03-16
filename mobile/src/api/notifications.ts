import client from './client';
import { NotificationPreferences } from '@/types';

export const getNotificationSettings = async (): Promise<NotificationPreferences> => {
  const { data } = await client.get<NotificationPreferences>('/notification-settings');
  return data;
};

export const updateNotificationSettings = async (
  payload: NotificationPreferences
): Promise<NotificationPreferences> => {
  const { data } = await client.put<NotificationPreferences>('/notification-settings', payload);
  return data;
};
