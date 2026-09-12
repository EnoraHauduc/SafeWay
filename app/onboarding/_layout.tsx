import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
      <Stack.Screen name="route-feel" />
      <Stack.Screen name="night-comfort" />
      <Stack.Screen name="lighting" />
      <Stack.Screen name="extras" />
      <Stack.Screen name="summary" />
    </Stack>
  );
}
