export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  onboardingCompleted: boolean;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserSession;
}

export interface UserProfile {
  userId: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  heightCm: number;
  weightKg: number;
  goalType: 'lose' | 'maintain' | 'gain';
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  onboardingCompleted: boolean;
}

export interface DashboardSummary {
  date: string;
  targetCalories: number;
  consumedCalories: number;
  remainingCalories: number;
  targetProteinG: number;
  consumedProteinG: number;
  remainingProteinG: number;
  targetCarbsG: number;
  consumedCarbsG: number;
  remainingCarbsG: number;
  targetFatG: number;
  consumedFatG: number;
  remainingFatG: number;
}

export interface MealEntry {
  id: string;
  sourceType: 'manual' | 'photo';
  title: string;
  description?: string;
  mealDatetime: string;
  estimatedCalories?: number;
  estimatedProteinG?: number;
  estimatedCarbsG?: number;
  estimatedFatG?: number;
  finalCalories: number;
  finalProteinG: number;
  finalCarbsG: number;
  finalFatG: number;
  aiProvider?: string;
  createdAt: string;
}

export interface ManualMealPayload {
  title: string;
  description?: string;
  mealDateTime: string;
  finalCalories: number;
  finalProteinG: number;
  finalCarbsG: number;
  finalFatG: number;
}

export interface PhotoMealPayload extends ManualMealPayload {
  estimatedCalories: number;
  estimatedProteinG: number;
  estimatedCarbsG: number;
  estimatedFatG: number;
  aiProvider: string;
  aiDebug: {
    promptText: string;
    rawResponse: string;
    parsedResponse: object;
  };
}

export interface AIAnalysisResult {
  title: string;
  description: string;
  estimatedCalories: number;
  estimatedProteinG: number;
  estimatedCarbsG: number;
  estimatedFatG: number;
  confidence?: number;
  warnings?: string[];
  provider: AIProvider;
  rawResponse: string;
  promptText: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  breakfastReminderEnabled: boolean;
  lunchReminderEnabled: boolean;
  dinnerReminderEnabled: boolean;
  snackReminderEnabled: boolean;
  maxNotificationsPerDay: number;
}

export type AIProvider = 'openai' | 'gemini' | 'claude';

export interface DailySummary {
  date: string;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  meals: MealEntry[];
}

export interface WeightLogEntry {
  id: string;
  weightKg: number;
  loggedAt: string;
}

export interface ProfileRequest {
  gender: 'male' | 'female' | 'other';
  age: number;
  heightCm: number;
  weightKg: number;
  goalType: 'lose' | 'maintain' | 'gain';
}
