import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FollowsProvider } from '@/hooks/useFollows';
import { PremiumProvider } from '@/hooks/usePremium';
import { onNotificationOpen } from '@/lib/notifications';
import { colors } from '@/theme';

export default function RootLayout() {
  // Devre arası bildirimine dokununca maç ekranı açılır
  useEffect(() => onNotificationOpen((id) => router.push(`/match/${id}`)), []);

  return (
    <SafeAreaProvider>
      <PremiumProvider>
        <FollowsProvider>
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
          <Stack.Screen name="settings" options={{ title: 'Ayarlar' }} />
          <Stack.Screen name="legal/[doc]" options={{ title: '' }} />
        </Stack>
        </FollowsProvider>
      </PremiumProvider>
    </SafeAreaProvider>
  );
}
