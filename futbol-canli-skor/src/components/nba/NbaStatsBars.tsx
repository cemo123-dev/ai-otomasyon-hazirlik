import { StyleSheet, Text, View } from 'react-native';
import { getNbaStats, isLive, type Match, type NbaTeamBox } from '@/lib/types';
import { colors, space } from '@/theme';
import { CompareBar } from '../match/StatsBars';
import { Card, CardTitle } from '../ui';

const pct = (made: number, att: number) => (att > 0 ? (made / att) * 100 : 0);
const ts = (t: NbaTeamBox) => {
  const d = 2 * (t.fga + 0.44 * t.fta);
  return d > 0 ? (t.points / d) * 100 : 0;
};
const f1 = (v: number) => `%${v.toFixed(1)}`;

/** NBA İstatistik sekmesi: FG%, 3P%, TS%, ribaund, asist, top kaybı, boyalı alan */
export function NbaStatsBars({ match }: { match: Match }) {
  const s = getNbaStats(match);
  if (!s) {
    return (
      <Card>
        <Text style={{ color: colors.textMuted }}>
          {isLive(match.status_short)
            ? 'Detaylı basketbol istatistikleri maç bitince yüklenir. Canlı skor ve çeyrekler Özet sekmesinde.'
            : 'İstatistikler maç bittiğinde görünecek.'}
        </Text>
      </Card>
    );
  }
  const { home: h, away: a } = s;
  const paint = h.points_in_paint != null && a.points_in_paint != null;

  return (
    <View style={{ gap: space(3) }}>
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: colors.home }]}>● {match.home_team}</Text>
        <Text style={[styles.legendText, { color: colors.away }]}>{match.away_team} ●</Text>
      </View>

      <Card>
        <CardTitle kicker="ŞUT VERİMLİLİĞİ" title="İsabet & TS%" />
        <CompareBar label="Saha içi (FG%)" home={pct(h.fgm, h.fga)} away={pct(a.fgm, a.fga)} fmt={f1} />
        <CompareBar label="Üçlük (3P%)" home={pct(h.tpm, h.tpa)} away={pct(a.tpm, a.tpa)} fmt={f1} />
        <CompareBar label="Gerçek şut (TS%)" home={ts(h)} away={ts(a)} fmt={f1} />
        <CompareBar label="Üçlük denemesi" home={h.tpa} away={a.tpa} />
      </Card>

      <Card>
        <CardTitle kicker="TOP MÜCADELESİ" title="Ribaund, Asist, Kayıp" />
        <CompareBar label="Toplam ribaund" home={h.tot_reb} away={a.tot_reb} />
        <CompareBar label="Hücum ribaundu" home={h.off_reb} away={a.off_reb} />
        <CompareBar label="Asist" home={h.assists} away={a.assists} />
        <CompareBar label="Top kaybı" home={h.turnovers} away={a.turnovers} />
      </Card>

      {paint ? (
        <Card>
          <CardTitle kicker="SAYI KAYNAKLARI" title="Boyalı Alan & Geçiş" />
          <CompareBar label="Boyalı alan sayısı" home={h.points_in_paint!} away={a.points_in_paint!} />
          {h.points_off_turnovers != null && a.points_off_turnovers != null ? (
            <CompareBar label="Top kaybından sayı" home={h.points_off_turnovers} away={a.points_off_turnovers} />
          ) : null}
          {h.second_chance_points != null && a.second_chance_points != null ? (
            <CompareBar label="İkinci şans sayısı" home={h.second_chance_points} away={a.second_chance_points} />
          ) : null}
        </Card>
      ) : (
        <Text style={styles.note}>Boyalı alan ve top kaybından gelen sayı verisi bu maç için sağlanmıyor.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space(1) },
  legendText: { fontSize: 12, fontWeight: '700' },
  note: { color: colors.textDim, fontSize: 12, textAlign: 'center' },
});
