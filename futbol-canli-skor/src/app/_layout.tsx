import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PremiumProvider } from '@/hooks/usePremium';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PremiumProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '800' },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="match/[id]" options={{ title: '' }} />
          <Stack.Screen name="paywall" options={{ presentation: 'modal', title: 'Skor+ Pro' }} />
        </Stack>
      </PremiumProvider>
    </SafeAreaProvider>
  );
}
