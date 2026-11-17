/**
 * Takım adlarının Türkçe karşılıkları (API İngilizce verir).
 * Yalnız gösterimde uygulanır: veritabanı ve sunucu tarafı (form geçmişi eşleşmesi,
 * AI girdileri) API adlarını kullanmaya devam eder.
 * Kulüp adları çoğunlukla özgün haliyle kalır; burada milli takımlar ve
 * Türkçede yerleşik farklı adı olan kulüpler var.
 */
const TR: Record<string, string> = {
  // Milli takımlar — Avrupa
  Turkey: 'Türkiye', Türkiye: 'Türkiye', Germany: 'Almanya', France: 'Fransa', Spain: 'İspanya', Italy: 'İtalya',
  England: 'İngiltere', Portugal: 'Portekiz', Netherlands: 'Hollanda', Belgium: 'Belçika', Croatia: 'Hırvatistan',
  Switzerland: 'İsviçre', Austria: 'Avusturya', Denmark: 'Danimarka', Sweden: 'İsveç', Norway: 'Norveç',
  Finland: 'Finlandiya', Iceland: 'İzlanda', Poland: 'Polonya', 'Czech Republic': 'Çekya', Czechia: 'Çekya',
  Slovakia: 'Slovakya', Hungary: 'Macaristan', Romania: 'Romanya', Bulgaria: 'Bulgaristan', Greece: 'Yunanistan',
  Serbia: 'Sırbistan', Montenegro: 'Karadağ', 'Bosnia & Herzegovina': 'Bosna-Hersek', 'Bosnia and Herzegovina': 'Bosna-Hersek',
  Slovenia: 'Slovenya', Albania: 'Arnavutluk', Kosovo: 'Kosova', 'FYR Macedonia': 'Kuzey Makedonya',
  'North Macedonia': 'Kuzey Makedonya', Scotland: 'İskoçya', Wales: 'Galler', 'Northern Ireland': 'Kuzey İrlanda',
  Ireland: 'İrlanda', 'Republic of Ireland': 'İrlanda', Ukraine: 'Ukrayna', Russia: 'Rusya', Belarus: 'Belarus',
  Georgia: 'Gürcistan', Armenia: 'Ermenistan', Azerbaijan: 'Azerbaycan', Kazakhstan: 'Kazakistan', Israel: 'İsrail',
  Cyprus: 'Kıbrıs', Malta: 'Malta', Luxembourg: 'Lüksemburg', Liechtenstein: 'Lihtenştayn', Andorra: 'Andorra',
  'San Marino': 'San Marino', Gibraltar: 'Cebelitarık', 'Faroe Islands': 'Faroe Adaları', Estonia: 'Estonya',
  Latvia: 'Letonya', Lithuania: 'Litvanya', Moldova: 'Moldova',
  // Milli takımlar — diğer
  Brazil: 'Brezilya', Argentina: 'Arjantin', Uruguay: 'Uruguay', Colombia: 'Kolombiya', Chile: 'Şili', Peru: 'Peru',
  Mexico: 'Meksika', USA: 'ABD', 'United States': 'ABD', Canada: 'Kanada', Japan: 'Japonya', 'South Korea': 'Güney Kore',
  'Korea Republic': 'Güney Kore', Australia: 'Avustralya', Morocco: 'Fas', Senegal: 'Senegal', Egypt: 'Mısır',
  Nigeria: 'Nijerya', Ghana: 'Gana', Tunisia: 'Tunus', Algeria: 'Cezayir', Cameroon: 'Kamerun', 'Saudi Arabia': 'Suudi Arabistan',
  Iran: 'İran', Qatar: 'Katar',
  // Türkçede yerleşik farklı adı olan kulüpler
  'Bayern München': 'Bayern Münih', 'Bayern Munich': 'Bayern Münih', 'Inter': 'Inter', 'AC Milan': 'Milan',
  'Sporting CP': 'Sporting Lizbon', 'Benfica': 'Benfica',
};

export const trTeam = (name: string | null | undefined): string => (name ? (TR[name] ?? name) : '');

/** Maç satırındaki takım adlarını gösterim için çevirir (diğer alanlar korunur) */
export function localizeTeams<T extends { home_team?: string; away_team?: string }>(m: T): T {
  return {
    ...m,
    ...(m.home_team !== undefined ? { home_team: trTeam(m.home_team) } : {}),
    ...(m.away_team !== undefined ? { away_team: trTeam(m.away_team) } : {}),
  };
}
