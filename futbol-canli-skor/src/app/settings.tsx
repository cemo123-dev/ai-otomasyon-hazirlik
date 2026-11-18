import { requireOptionalNativeModule } from 'expo';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { FollowErrorNotice } from '@/components/FollowErrorNotice';
import { InviteCard } from '@/components/InviteCard';
import { TeamLogo } from '@/components/TeamLogo';
import { Card, CardTitle, InfoStrip } from '@/components/ui';
import { useApiPaid } from '@/hooks/useApiPaid';
import { useFollows } from '@/hooks/useFollows';
import { resetInviteCache } from '@/hooks/useInvite';
import { usePremium } from '@/hooks/usePremium';
import { dataSource } from '@/lib/data';
import { friendlyError } from '@/lib/errors';
import { DEFAULT_PREFS, type NotificationPrefs, type Sport } from '@/lib/types';
import { colors, hit, radius, space } from '@/theme';

/**
 * paidOnly: akıllı alarmlar canlı istatistik + dakikalık senkron ister; yalnız O SPORUN API planı ücretliyse
 * üretilir (0018: futbol Pro'ya geçer, NBA ücretsiz kalır → NBA seri alarmı "yakında" kalır).
 */
const ITEMS: { key: keyof NotificationPrefs; title: string; desc: string; paidOnly?: Sport }[] = [
  { key: 'kickoff', title: '⚽ Maç Başladı', desc: 'Takip ettiğin maç veya takımın maçı başlayınca.' },
  { key: 'halftime', title: '⏸ Devre Arası AI Raporu', desc: 'İlk yarı bitince "İkinci yarıda ne olmalı?" özeti (yalnız futbol).' },
  { key: 'pressure', title: '🚨 Baskı Alarmı', desc: 'Bir takım son 10 dakikada net pozisyonlar bulup golü zorladığında.', paidOnly: 'football' },
  { key: 'red_card', title: '⚡ Kırmızı Kart Kırılması', desc: 'Kırmızı kart sonrası dengeler değişince, canlı taktik analizle.', paidOnly: 'football' },
  { key: 'nba_run', title: '🔥 NBA Seri Alarmı', desc: 'Rakip sayı bulamadan 12+ sayılık seri yakalandığında.', paidOnly: 'nba' },
];

/** Ücretsiz planda çalışmayan alarm açılıp kapanabilir gibi görünmesin */
const SOON = 'Yakında: canlı veri altyapısı genişleyince açılacak.';

/** Bildirim ayarları: alarmlar yalnız takip edilen (🔔) maçlar için ve yalnız açık türlerde gelir */
export default function SettingsScreen() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  // Tercihler okunamadıysa anahtarlar kilitli: varsayılanlarla kaydetmek kayıtlı tercihlerin üzerine yazardı
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const paidBySport: Record<Sport, boolean | null> = { football: useApiPaid('football'), nba: useApiPaid('nba') };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPrefs(await dataSource.getNotificationPrefs());
      setLoadError(null);
    } catch (e) {
      setLoadError(friendlyError(e, 'Ayarlar yüklenemedi.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  const toggle = async (key: keyof NotificationPrefs, value: boolean) => {
    if (!prefs || loadError) return;
    const prev = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next); // iyimser güncelleme
    try {
      await dataSource.setNotificationPrefs(next);
      setError(null);
    } catch (e) {
      setPrefs(prev);
      setError(friendlyError(e, 'Ayar kaydedilemedi. Tekrar dene.'));
    }
  };

  if (loading && !prefs && !loadError) return <ActivityIndicator color={colors.live} style={{ flex: 1, backgroundColor: colors.bg }} />;
  const locked = !prefs || !!loadError;
  const shown = prefs ?? DEFAULT_PREFS;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        Skor+ her kornerde değil, yalnız önemli anlarda bildirim gönderir. Bildirimler yalnız 🔔 ile takip ettiğin maçlar için gelir.
      </Text>
      <FollowErrorNotice />
      {loadError ? (
        // Tasarım tur 2 R-2: ana ekrandaki "Liste yenilenemedi" bandıyla aynı iskelet
        <InfoStrip
          title="Ayarlar yüklenemedi"
          body={loadError === 'Ayarlar yüklenemedi.' ? 'Bağlantını kontrol edip tekrar dene.' : loadError}
          action="Tekrar dene"
          actionLabel="Ayarları yeniden yükle"
          busy={loading}
          onAction={load}
        />
      ) : null}
      {/* Yüklenemeyen ayar "açık" görünmesin: hata varken bildirim kartı çizilmez (tasarım B-3) */}
      {loadError ? null : (
        <Card>
          {ITEMS.map((it, i) => {
            // paid === null (bilinmiyor): anahtar açık kalır, yalnız nötr not gösterilir
            const paid = it.paidOnly ? paidBySport[it.paidOnly] : null;
            const soon = !!it.paidOnly && paid === false;
            return (
              <View key={it.key} style={[styles.row, i > 0 && styles.divider]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.title, soon && styles.titleSoon]}>{it.title}</Text>
                  <Text style={styles.desc}>{it.desc}</Text>
                  {soon ? (
                    <Text style={styles.soon}>{SOON}</Text>
                  ) : it.paidOnly && paid === null ? (
                    <Text style={styles.desc}>Canlı veri kapsamına bağlı; her maçta üretilmeyebilir.</Text>
                  ) : null}
                </View>
                <Switch
                  accessibilityLabel={soon ? `${it.title} (yakında)` : it.title}
                  disabled={soon || locked}
                  value={soon ? false : shown[it.key]}
                  onValueChange={(v) => toggle(it.key, v)}
                  trackColor={{ true: colors.live, false: colors.trackOff }}
                  thumbColor={colors.text}
                  ios_backgroundColor={colors.trackOff}
                  // react-native-web açık durumdaki başparmak için ayrı prop kullanır (tipte yok)
                  {...(Platform.OS === 'web' ? ({ activeThumbColor: colors.text } as object) : null)}
                />
              </View>
            );
          })}
        </Card>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FollowedTeams />
      {/* F3: davet kartı ayrı veri kullanır; ayarlar yüklenemese de görünür (tasarım tur 2 §D-2) */}
      <InviteCard />
      <AccountCard />
    </ScrollView>
  );
}

/**
 * Sürüm/güncelleme bilgisi. expo-updates native modülü eski build'lerde (ör. önceki
 * development build) yoksa import hata fırlatır ve geliştirme modunda kırmızı hata ekranı
 * açılır (try/catch yakalasa bile). Bu yüzden önce hata fırlatmayan kontrol yapılır.
 */
function updateInfo(): string {
  if (!requireOptionalNativeModule('ExpoUpdates')) return '';
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- native modül olmayabilir
    const U = require('expo-updates') as typeof import('expo-updates');
    const when = U.isEmbeddedLaunch || !U.createdAt ? ' · uygulama içi sürüm' : ` · güncelleme ${U.createdAt.toLocaleDateString('tr-TR')}`;
    return `${U.channel ? ` · ${U.channel}` : ''}${when}`;
  } catch {
    return '';
  }
}

/** Onay: native'de Alert, web'de window.confirm */
function confirmAsync(title: string, message: string, ok: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(globalThis.confirm?.(`${title}

${message}`) ?? false);
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Vazgeç', style: 'cancel', onPress: () => resolve(false) },
      { text: ok, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

/** Hesap: kimlik, yasal metinler, hesap silme (Google Play şartı) */
function AccountCard() {
  const { refresh } = usePremium();
  const [accountId, setAccountId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    dataSource
      .getAccountId()
      .then(setAccountId)
      .catch(() => {});
  }, []);

  const remove = async () => {
    const ok = await confirmAsync(
      'Hesabın silinsin mi?',
      "Pro aboneliğin, takiplerin, bildirim ayarların, asistan soruların, davet kodun, davet bilgin ve kullanım günlerin kalıcı olarak silinir. Bu işlem geri alınamaz. Google Play aboneliğin varsa ayrıca Google Play'den iptal etmelisin.",
      'Hesabımı sil',
    );
    if (!ok) return;
    setDeleting(true);
    setMsg(null);
    try {
      await dataSource.deleteAccount();
      await refresh();
      resetInviteCache(); // yeni hesabın davet kodu / sayacı
      setAccountId(await dataSource.getAccountId());
      setMsg('Hesabın silindi. Uygulamayı yeni, boş bir hesapla kullanmaya devam edebilirsin.');
    } catch (e) {
      setMsg(friendlyError(e, 'Hesap silinemedi. Tekrar dene.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardTitle kicker="HESAP" title="Gizlilik ve hesap" />
      <Pressable accessibilityRole="link" onPress={() => router.push('/legal/privacy')} style={styles.linkRow}>
        <Text style={styles.title}>Gizlilik Politikası</Text>
        <Text style={styles.chev}>›</Text>
      </Pressable>
      <Pressable accessibilityRole="link" onPress={() => router.push('/legal/kvkk')} style={[styles.linkRow, styles.divider]}>
        <Text style={styles.title}>KVKK Aydınlatma Metni</Text>
        <Text style={styles.chev}>›</Text>
      </Pressable>
      {accountId ? (
        <Text style={[styles.desc, styles.divider, { paddingTop: space(3) }]} selectable>
          Hesap kimliği: {accountId}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        disabled={deleting}
        onPress={remove}
        style={({ pressed }) => [styles.deleteBtn, (pressed || deleting) && { opacity: 0.7 }]}
      >
        {deleting ? <ActivityIndicator color={colors.danger} /> : <Text style={styles.deleteText}>Hesabımı sil</Text>}
      </Pressable>
      {msg ? <Text style={styles.desc}>{msg}</Text> : null}
      <Text style={[styles.desc, styles.divider, { paddingTop: space(3) }]}>
        Sürüm {Constants.expoConfig?.version ?? '—'}
        {updateInfo()}
      </Text>
    </Card>
  );
}

/** Takip edilen takımlar: maçları otomatik takibe alınır, "maç başladı" bildirimi gelir */
function FollowedTeams() {
  const { teams, toggleTeam } = useFollows();
  const list = [...teams.values()];
  return (
    <Card>
      <CardTitle kicker="TAKIMLARIM" title="Takip ettiğin takımlar" />
      {list.length ? (
        list.map((t, i) => (
          <View key={`${t.sport_type}:${t.team_id}`} style={[styles.row, i > 0 && styles.divider]}>
            <TeamLogo uri={t.team_logo} name={t.team_name} size={28} />
            <Text style={[styles.title, { flex: 1 }]}>
              {t.team_name} <Text style={styles.desc}>{t.sport_type === 'nba' ? 'NBA' : 'Futbol'}</Text>
            </Text>
            {/* Hata ekranın üstündeki FollowErrorNotice ile gösterilir (useFollows) */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t.team_name} takibini bırak`}
              onPress={() => toggleTeam(t).catch(() => {})}
              style={styles.removeBtn}
            >
              <Text style={styles.remove}>Bırak</Text>
            </Pressable>
          </View>
        ))
      ) : (
        <Text style={styles.desc}>Henüz takım takip etmiyorsun. Maç ekranında takım logosunun altındaki ☆ Takip et ile ekleyebilirsin.</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, paddingVertical: space(3) },
  chev: { color: colors.textDim, fontSize: 22, fontWeight: '700' },
  deleteBtn: { marginTop: space(2), minHeight: 48, justifyContent: 'center', borderWidth: 1, borderColor: colors.danger, borderRadius: radius.md, paddingVertical: space(3), alignItems: 'center' },
  deleteText: { color: colors.danger, fontWeight: '800', fontSize: 14 },
  remove: { color: colors.danger, fontWeight: '800', fontSize: 13 },
  removeBtn: { minHeight: hit, minWidth: hit, alignItems: 'center', justifyContent: 'center' },
  content: { padding: space(4), gap: space(4), width: '100%', maxWidth: 720, alignSelf: 'center' },
  intro: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space(3), minHeight: 64, paddingVertical: space(3) },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  title: { color: colors.text, fontWeight: '800', fontSize: 15 },
  desc: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  titleSoon: { color: colors.textMuted },
  soon: { color: colors.warning, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 12, textAlign: 'center' },
});
