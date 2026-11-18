import { router, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FollowsProvider } from '@/hooks/useFollows';
import { PremiumProvider } from '@/hooks/usePremium';
import { useNotificationOpen } from '@/lib/notifications';
import { startActivityTracking } from '@/lib/growth';
import { applyUpdateOnLaunch, markUserNavigated } from '@/lib/updates';
import { colors } from '@/theme';

/** Bildirime dokununca (soğuk açılış dahil) maç ekranı açılır. Yalnız native'de render edilir. */
function NotificationOpener() {
  useNotificationOpen((id) => {
    markUserNavigated(); // OTA güncellemesi bu ekranı sıfırlamasın
    router.push(`/match/${id}`);
  });
  return null;
}

export default function RootLayout() {
  // OTA: kullanıcı ana ekrandan ayrıldıysa güncelleme anında değil sonraki açılışta uygulanır
  const pathname = usePathname();
  useEffect(() => {
    if (pathname && pathname !== '/') markUserNavigated();
  }, [pathname]);

  // Yeni OTA güncellemesi açılıştan hemen sonra indiyse uygula (bkz. lib/updates.ts)
  useEffect(() => {
    applyUpdateOnLaunch();
  }, []);

  // F4: aktif gün ölçümü (saatte en fazla 1 RPC; 0017 yoksa / hata olursa akış durmaz)
  useEffect(() => startActivityTracking(), []);

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
        {/* Stack'ten sonra: yönlendirme kök gezgin bağlandıktan sonra çalışsın */}
        {Platform.OS !== 'web' ? <NotificationOpener /> : null}
        </FollowsProvider>
      </PremiumProvider>
    </SafeAreaProvider>
  );
}
