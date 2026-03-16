import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) return <LoadingScreen message="Cargando..." />;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  if (!user?.onboardingCompleted) return <Redirect href="/(onboarding)" />;
  return <Redirect href="/(tabs)/dashboard" />;
}
