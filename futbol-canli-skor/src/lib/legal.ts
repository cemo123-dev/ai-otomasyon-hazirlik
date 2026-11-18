/**
 * Gizlilik Politikası ve KVKK Aydınlatma Metni — ŞABLON
 * Köşeli parantezli alanlar yayından önce doldurulmalı ve metin bir hukukçuya
 * kontrol ettirilmelidir. Metin, uygulamanın bugün gerçekten işlediği verileri listeler;
 * yeni bir veri işleme (ör. Google ile giriş, ödeme) eklendiğinde güncellenmelidir.
 */

export const LEGAL_PLACEHOLDERS = {
  controller: '[VERİ SORUMLUSU ADI / ŞİRKET UNVANI]',
  email: '[İLETİŞİM E-POSTASI]',
  address: '[ADRES]',
  updated: '[YAYIN TARİHİ]',
};

const P = LEGAL_PLACEHOLDERS;

export type LegalDoc = { title: string; sections: { h: string; p: string }[] };

export const PRIVACY: LegalDoc = {
  title: 'Gizlilik Politikası',
  sections: [
    {
      h: 'Kapsam',
      p: `Bu politika, ${P.controller} ("biz") tarafından sunulan Skor+ mobil uygulamasında kişisel verilerin nasıl işlendiğini açıklar. Son güncelleme: ${P.updated}.`,
    },
    {
      h: 'Topladığımız veriler',
      p:
        '• Hesap kimliği: Uygulama ilk açılışta size rastgele, isimsiz bir hesap kimliği oluşturur. Ad, telefon veya e-posta istemeyiz.\n' +
        '• Abonelik durumu: Pro üyeliğinizin aktif olup olmadığı ve bitiş tarihi.\n' +
        '• Tercihler: Takip ettiğiniz maçlar ve takımlar, bildirim ayarlarınız.\n' +
        '• Bildirim kimliği: Bildirim gönderebilmek için cihazınızın push bildirim anahtarı (izin verirseniz).\n' +
        '• Taktik Asistan soruları: Asistana yazdığınız sorular ve verilen yanıtlar.\n' +
        // F3/F4 (0017) — ⚠ hukuki dayanak (meşru menfaat) hukukçu kontrolünden geçmeli (GELISTIRMELER 3.32)
        '• Kullanım günleri: Uygulamayı hangi günlerde açtığınız (yalnız tarih; saat, ekran veya konum yok). Kaç kişinin uygulamaya geri döndüğünü ölçmek için.\n' +
        '• Davet bilgisi: Size ait rastgele davet kodu; bir davet kodu girdiyseniz sizi davet eden hesabın isimsiz kimliği ve kodu girdiğiniz an. Sizi davet eden kişi yalnız "aktif davetli" sayısında sayıldığınızı görebilir; bu sayı, davetiyle en az 3 kişi gelmeden gösterilmez. Kullanım günleriniz ve hesap kimliğiniz ona gösterilmez.\n' +
        'Konum, rehber, fotoğraf, reklam kimliği veya cihaz içeriği toplamayız.',
    },
    {
      h: 'Verileri neden işliyoruz',
      p: 'Canlı skor ve analiz hizmetini sunmak, takip ettiğiniz maçlar için bildirim göndermek, Pro aboneliğinizi doğrulamak ve asistan sorularınızı yanıtlamak için. Verilerinizi satmayız ve reklam amacıyla kullanmayız.',
    },
    {
      h: 'Hizmet sağlayıcılar',
      p:
        '• Supabase: veritabanı ve sunucu altyapısı.\n' +
        '• Google (Gemini API): AI analizleri ve Taktik Asistan yanıtları. Asistana yazdığınız soru, maç verisiyle birlikte yanıt üretmek için Google\'a iletilir; hesap kimliğiniz iletilmez.\n' +
        '• Expo ve Google Firebase Cloud Messaging: push bildirimlerinin cihazınıza ulaştırılması.\n' +
        'Bu sağlayıcıların sunucuları yurt dışında bulunabilir.',
    },
    {
      h: 'Saklama süresi',
      p: 'Hesap verileriniz hesabınız silinene kadar saklanır. Maç takipleri ve alarmlar maçtan 30 gün sonra, başarısız asistan soruları 7 gün sonra otomatik silinir. Kullanım günleri 120 gün sonra otomatik silinir. Davet bilgisi hesabınız silinene kadar saklanır.',
    },
    {
      h: 'Haklarınız ve hesap silme',
      p: `Ayarlar > Hesabımı sil ile hesabınızı ve size bağlı tüm verileri kalıcı olarak silebilirsiniz. Bildirimleri Ayarlar'dan veya cihaz ayarlarından kapatabilirsiniz. Sorularınız için: ${P.email}.`,
    },
    {
      h: 'Çocuklar',
      p: 'Uygulama 13 yaşından küçük çocuklara yönelik değildir.',
    },
  ],
};

export const KVKK: LegalDoc = {
  title: 'KVKK Aydınlatma Metni',
  sections: [
    {
      h: 'Veri sorumlusu',
      p: `6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu ${P.controller}, ${P.address}. İletişim: ${P.email}.`,
    },
    {
      h: 'İşlenen kişisel veriler',
      p: 'İşlem güvenliği verisi (rastgele hesap kimliği, push bildirim anahtarı), müşteri işlem verisi (abonelik durumu, takip edilen maç/takımlar, bildirim tercihleri, Taktik Asistan soru ve yanıtları), kullanım verisi (uygulamayı açtığınız günler; yalnız tarih, saat, ekran veya konum yok) ve davet bilgisi (size ait rastgele davet kodu; bir davet kodu girdiyseniz sizi davet eden hesabın isimsiz kimliği, kodu girdiğiniz an ve "aktif davetli" işareti). Bir davet kodu girdiyseniz, sizi davet eden kişi yalnız "aktif davetli" sayısında sayıldığınızı görebilir; bu sayı, davetiyle en az 3 kişi gelmeden gösterilmez.',
    },
    {
      h: 'İşleme amaçları ve hukuki sebepler',
      p: 'Hizmetin sunulması ve abonelik sözleşmesinin ifası (KVKK m.5/2-c), bilgi güvenliğinin sağlanması ve hizmetin iyileştirilmesi için meşru menfaat (m.5/2-f). Bildirim gönderimi cihaz izniniz ve uygulama içi tercihlerinizle yapılır.',
    },
    {
      h: 'Aktarım',
      p: 'Kişisel verileriniz, hizmetin sunulması amacıyla altyapı ve yapay zekâ hizmet sağlayıcılarımıza (Supabase, Google, Expo) aktarılır. Bu sağlayıcıların sunucuları yurt dışında bulunabileceğinden aktarım KVKK m.9 hükümlerine uygun olarak gerçekleştirilir.',
    },
    {
      h: 'Saklama süresi',
      p: 'Hesap verileri hesabınız silinene kadar saklanır. Kullanım günleri 120 gün sonra otomatik silinir. Davet bilgisi hesabınız silinene kadar saklanır.',
    },
    {
      h: 'Toplama yöntemi',
      p: 'Veriler, uygulamayı kullanmanız sırasında elektronik ortamda otomatik yollarla toplanır.',
    },
    {
      h: 'Haklarınız (KVKK m.11)',
      p: `Verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltilmesini veya silinmesini isteme, aktarıldığı üçüncü kişileri bilme ve itiraz etme haklarına sahipsiniz. Başvurularınızı ${P.email} adresine iletebilirsiniz. Hesabınızı Ayarlar > Hesabımı sil ile doğrudan silebilirsiniz.`,
    },
  ],
};

export const LEGAL_DOCS = { privacy: PRIVACY, kvkk: KVKK } as const;
export type LegalKey = keyof typeof LEGAL_DOCS;
