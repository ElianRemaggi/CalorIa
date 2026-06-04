import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

export type MealReminderType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const NOTIF_ID_KEYS: Record<MealReminderType, string> = {
  breakfast: 'caloria_notif_id_breakfast',
  lunch: 'caloria_notif_id_lunch',
  dinner: 'caloria_notif_id_dinner',
  snack: 'caloria_notif_id_snack',
};

const MEAL_BODIES: Record<MealReminderType, string> = {
  breakfast: '¡Hora de registrar tu desayuno!',
  lunch: '¡Hora de registrar tu almuerzo!',
  dinner: '¡Hora de registrar tu cena!',
  snack: '¡Hora de registrar tu merienda!',
};

export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const scheduleReminder = async (
  type: MealReminderType,
  hour: number,
  minute: number
): Promise<boolean> => {
  await cancelReminder(type);
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'CalorIa',
        body: MEAL_BODIES[type],
        sound: true,
      },
      trigger: { type: 'daily', hour, minute } as any,
    });
    await SecureStore.setItemAsync(NOTIF_ID_KEYS[type], id);
    return true;
  } catch {
    return false;
  }
};

export const cancelReminder = async (type: MealReminderType): Promise<void> => {
  const id = await SecureStore.getItemAsync(NOTIF_ID_KEYS[type]);
  if (id) {
    try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
    await SecureStore.deleteItemAsync(NOTIF_ID_KEYS[type]);
  }
};

export const parseTime = (hhmm: string): { hour: number; minute: number } => {
  const [h, m] = hhmm.split(':').map(Number);
  return { hour: h, minute: m };
};
