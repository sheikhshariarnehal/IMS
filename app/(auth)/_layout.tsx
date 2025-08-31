import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
      animation: 'none',
      animationDuration: 0
    }}>
      <Stack.Screen name="login" options={{ animation: 'none' }} />
    </Stack>
  );
}