import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { TeamLogo } from '@/components/TeamLogo';
import { Card, CardTitle } from '@/components/ui';
import { useFollows } from '@/hooks/useFollows';
import { dataSource } from '@/lib/data';
import { DEFAULT_PREFS, type NotificationPrefs } from '@/lib/types';
import { colors, space } from '@/theme';

const ITEMS: { key: keyof NotificationPrefs; title: string; desc: string }[] = [
  { key: 'kickoff', title: '⚽ Maç Başladı', desc: 'Takip ettiğin maç veya takımın maçı başlayınca.' },
  { key: 'halftime', title: '⏸ Devre Arası AI Raporu', desc: 'İlk yarı bitince "İkinci yarıda ne olmalı?" özeti.' },
  { key: 'pressure', title: '🚨 Baskı Alarmı', desc: 'Bir takım son 10 dakikada net pozisyonlar bulup golü zorladığında.' },
  { key: 'red_card', title: '⚡ Kırmızı Kart Kırılması', desc: 'Kırmızı kart sonrası dengeler değişince, canlı taktik analizle.' },
  { key: 'nba_run', title: '🔥 NBA Seri Alarmı', desc: 'Rakip sayı bulamadan 12+ sayılık seri yakalandığında.' },
];

/** Bildirim ayarları: alarmlar yalnız takip edilen (🔔) maçlar için ve yalnız açık türlerde gelir */
export default function SettingsScreen() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dataSource
      .getNotificationPrefs()
      .then(setPrefs)
      .catch(() => setPrefs(DEFAULT_PREFS));
  }, []);

  const toggle = async (key: keyof NotificationPrefs, value: boolean) => {
    if (!prefs) return;
    const prev = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next); // iyimser güncelleme
    try {
      await dataSource.setNotificationPrefs(next);
      setError(null);
    } catch (e) {
      setPrefs(prev);
      setError((e as { message?: string } | null)?.message ?? 'Ayar kaydedilemedi');
    }
  };

  if (!prefs) return <ActivityIndicator color={colors.live} style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        Skor+ her kornerde değil, yalnız maçın kırıldığı anlarda bildirim gönderir. Bildirimler yalnız 🔔 ile takip ettiğin maçlar için gelir.
      </Text>
      <Card>
        {ITEMS.map((it, i) => (
          <View key={it.key} style={[styles.row, i > 0 && styles.divider]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.title}>{it.title}</Text>
              <Text style={styles.desc}>{it.desc}</Text>
            </View>
            <Switch
              accessibilityLabel={it.title}
              value={prefs[it.key]}
              onValueChange={(v) => toggle(it.key, v)}
              trackColor={{ true: colors.live, false: colors.border }}
            />
          </View>
        ))}
      </Card>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FollowedTeams />
    </ScrollView>
  );
}

/** Takip edilen takımlar: maçları otomatik takibe alınır, "maç başladı" bildirimi gelir */
function FollowedTeams() {
  const { teams, toggleTeam } = useFollows();
  const list = [...teams.values()];
  return (
    <Card>
      <CardTitle kicker="Takımlarım" title="Takip ettiğin takımlar" />
      {list.length ? (
        list.map((t, i) => (
          <View key={`${t.sport_type}:${t.team_id}`} style={[styles.row, i > 0 && styles.divider]}>
            <TeamLogo uri={t.team_logo} name={t.team_name} size={28} />
            <Text style={[styles.title, { flex: 1 }]}>
              {t.team_name} <Text style={styles.desc}>{t.sport_type === 'nba' ? 'NBA' : 'Futbol'}</Text>
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`${t.team_name} takibini bırak`} onPress={() => toggleTeam(t).catch(() => {})}>
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
  remove: { color: colors.danger, fontWeight: '800', fontSize: 13 },
  content: { padding: space(4), gap: space(4), width: '100%', maxWidth: 720, alignSelf: 'center' },
  intro: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space(3), paddingVertical: space(3) },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  title: { color: colors.text, fontWeight: '800', fontSize: 15 },
  desc: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  error: { color: colors.danger, fontSize: 12, textAlign: 'center' },
});
