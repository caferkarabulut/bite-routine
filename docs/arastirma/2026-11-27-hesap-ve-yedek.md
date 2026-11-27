# Hesap mı, hesapsız yedek mi? (2026-11-27)

Soru: Kullanıcı telefon değiştirince ya da uygulamayı silip yükleyince verisi ne olur? Bite Routine'e hesap gerekir mi?

Kaynaklar web araması; mağaza sayfaları geliştiricinin kendi beyanıdır. "Doğrulanmadı" yazan şey denenmedi.

## Piyasa

| Uygulama | Hesap | Not |
|---|---|---|
| MyFitnessPal | Zorunlu | Abonelik, sunucu tarafı özellikler |
| Cronometer | Zorunlu (ücretsiz sürümde de) | Forum yanıtı, Cronometer çalışanı |
| Lose It! | Zorunlu görünüyor | İkincil kaynak |
| Yazio | Başlamak için gerekmiyor | Mağaza: "no sign-up required"; sonra hesap öneriyor |
| MyNetDiary | Ücretsiz katmanda gerekmiyor | Mağaza: "no account required" |
| FatSecret | İsteğe bağlı görünüyor | Apple/Facebook ile giriş var |
| Diyetkolik (TR) | Kayıt istiyor | Mağaza metni |
| Calory (iOS) | Yok | Veriler kullanıcının iCloud'unda |
| Calorie & Macro Counter + (iOS) | Yok | Yalnız kullanıcının iCloud'u ile eşitleme |
| NE1 Calorie Counter (iOS) | Yok | Yerel, JSON yedek dosyası |
| Counted, TruCal, Calorie Keeper (iOS) | Yok | Yerel SQLite, sunucu yok |
| BiteDiary (Android) | Yok | "No account, no sign-in, no cloud" |
| OpenNutriTracker (açık kaynak) | Yok | Yerel şifreli veri, JSON/CSV dışa aktarma |

Gözlem: hesap isteyenler abonelik, reklam, sunucuda yapay zekâ ya da sosyal özellik satan büyük uygulamalar. Hesap orada iş modelinin parçası. Gizliliği öne çıkaran küçük uygulamaların çoğu hesapsız. Bunlar ya yerel dosya yedeği ya da kullanıcının kendi iCloud hesabını kullanıyor.

## Kullanıcı davranışı

- Bir rakibin (Nutrola) yayımladığı veriye göre kullanıcıların ~%60'ı ilk 14 günde, ~%65'i 90 günde kalori uygulamasını bırakıyor. Kaynak bağımsız değil; sayılar yalnız yön gösterir.
- Sağlık-fitness uygulamalarında 30. gün tutma oranı %3–8 (AppsFlyer, Adjust).
- Sonuç: sil-yükle ile verisini kaybeden kişilerin çoğu zaten bırakmak üzere olanlar. Uzun süre kullanan az sayıdaki kullanıcı ise asıl değerli kesim ve en çok telefon değiştirme anında veri kaybediyor. Bu kesim için yedeğin sağlam olması gerekiyor.

## Teknik seçenekler (sunucumuz olmadan)

- **Android otomatik yedek:** Varsayılan olarak açık (`allowBackup="true"`). Uygulamanın iç dosyalarını kullanıcının Google Drive'ındaki gizli klasöre yazıyor (uygulama başına 25 MB, Drive kotasından düşmüyor). Hem yeni telefon kurulurken hem de Play'den yeniden yüklemede geri yükleniyor. SQLite dosyamızın içeride olduğu **doğrulanmadı**; `adb shell bmgr` ile denenmeli.
- **iOS:** Uygulama silinince verisi de silinir. Veri yalnız bütün telefon iCloud yedeğinden ya da Hızlı Başlangıç ile taşınırsa gelir (doğrulanmadı). Sil-yükle durumunu çözmek için uygulamanın kendi iCloud klasörüne otomatik yedek dosyası yazılabilir. Kullanıcı giriş yapmaz; telefondaki Apple kimliği kullanılır. Expo için iki kütüphane var: `react-native-cloud-storage` (iCloud + Google Drive, config plugin) ve `@oleg_svetlichnyi/expo-icloud-storage` (yalnız iOS, SQLite yedek tarifi var). Apple Developer hesabında iCloud kapsayıcısı açmak gerekiyor.
- **iCloud anahtar-değer deposu:** 1 MB sınırı var. Sil-yükle sonrası kalıp kalmadığı konusunda kaynaklar çelişiyor; ana yedek olarak kullanılmamalı.
- **Kullanıcının iCloud ve Google hesabı arasında gerçek eşitleme:** Expo'da hazır bir yol bulunamadı; iki ayrı yerel modül gerekiyor.

## Hesap açılırsa ne gelir

- **Giriş:** Google ile giriş eklenirse App Store kuralı 4.8 eşdeğer gizlilikte bir giriş seçeneği daha istiyor; pratikte Apple ile giriş.
- **Hesap silme:** Kural 5.1.1(v) uygulama içinden hesap silmeyi zorunlu tutuyor. Apple ile girişte jeton iptali (REST API) de gerekiyor.
- **KVKK:** Sağlık verisi özel nitelikli kişisel veri; genel kural açık rıza. Kilo ve beslenme kaydının sağlık verisi sayılma ihtimali yüksek (doğrulanmadı). Aydınlatma metni, açık rıza ekranı ve VERBİS yükümlülüğü için bir hukukçuya sorulmalı.
- **Mağaza:** Gizlilik etiketleri "veri toplanmıyor"dan "sağlık ve kimlik verisi toplanıyor"a döner.
- **En basit kurulum:** Apple ve Google ile giriş + Firebase Auth ya da Supabase. Önce yalnız "hesaba yedek" (aynı JSON yedeği sunucuda saklamak), gerçek eşitleme sonra. Kaba tahmin: hesaba yedek 1–2 hafta, eşitleme 3–5 hafta; hukuki metinler buna dahil değil.

## Karar ve gerekçe

Kullanıcı kararı yöneticiye bıraktı. Karar: **v1 hesapsız çıkar, yedek sağlamlaştırılır.**

1. Android otomatik yedeğinin veritabanını kapsadığı doğrulanır (gerekirse `fullBackupContent`/`dataExtractionRules` ile açıkça eklenir). Böylece Android'de hem yeni telefon hem sil-yükle kendiliğinden çözülür.
2. iOS'ta günlük otomatik yedek kullanıcının iCloud'una yazılır. Uygulama ilk açılışta iCloud'da yedek bulursa "Yedeğin bulundu, geri yüklensin mi?" diye sorar. Giriş ekranı yoktur.
3. Elle JSON yedek kalır. Ayarlar'da "Son yedek: …" bilgisi gösterilir.
4. Veri modeli ileride hesap eklenebilecek şekilde tutulur.

Gerekçe:
- Hesap istemeyen ve gizliliği öne çıkaran uygulamalar piyasada var ve bu konum Türkiye'de boş.
- Telefon değiştirme ve sil-yükle durumu, kullanıcının kendi Google/Apple hesabıyla, giriş ekranı olmadan çözülebiliyor.
- Hesap açmak KVKK, hesap silme ve sunucu yükü getiriyor. Bunlar şu an kullanıcıya bir şey kazandırmıyor.

Hesap ileride (`FUTURE`) şu durumlarda yeniden değerlendirilir: birden çok cihaz ya da web isteği gelirse, ücretli bir özellik planlanırsa, ya da mağaza yorumlarında veri kaybı şikâyeti görülürse.

## Kaynaklar

- Hesapsız uygulamalar: [BiteDiary](https://play.google.com/store/apps/details?id=com.bitediary.app), [Calorie Counter & Macros NE1](https://apps.apple.com/app/id443935935), [Counted](https://apps.apple.com/app/id6776391904), [TruCal](https://apps.apple.com/app/id6758171656), [Calorie & Macro Counter +](https://apps.apple.com/app/id6755650863), [Calory](https://apps.apple.com/us/app/calory-calorie-counter-macros/id1441252752), [OpenNutriTracker](https://apps.apple.com/app/id6451490901), [MyNetDiary](https://apps.apple.com/us/app/-/id287529757)
- Hesaplı uygulamalar: [MyFitnessPal](https://apple.co/3HN51G0), [FatSecret](https://apps.apple.com/us/app/-/id347184248), [Cronometer forumu](https://forums.cronometer.com/discussion/3792/account-free-seemed-to-have-been-deleted), [Yazio](https://apps.apple.com/py/app/yazio-ai-calorie-tracker/id946099227?l=en-GB), [Diyetkolik](https://apps.apple.com/us/app/-/id558076089), [Lose It! (ikincil)](https://alternativeto.net/software/lose-it/)
- Tutma oranı: [Nutrola 90 gün raporu](https://nutrola.app/en/blog/120k-first-app-churn-90-day-data-report-2026), [Nutrola bırakma eğrisi](https://nutrola.app/en/blog/calorie-tracking-dropout-curve-when-and-why-users-quit-data-study), [Business of Apps sağlık-fitness](https://businessofapps.com/data/health-fitness-app-benchmarks)
- Android: [Auto Backup](https://developer.android.com/identity/data/autobackup?hl=en)
- iOS: [iCloud anahtar-değer tasarımı](https://developer.apple.com/library/content/documentation/General/Conceptual/iCloudDesignGuide/Chapters/DesigningForKey-ValueDataIniCloud.html), [sil-yükle sonrası kalıcılık tartışması](https://developer.apple.com/forums/thread/767388), [react-native-cloud-storage](https://react-native-cloud-storage.oss.kuatsu.de/docs/installation/expo), [expo-icloud-storage](https://o-svetlichnyi.github.io/expo-icloud-storage/getting-started), [Expo iCloud isteği](https://expo.canny.io/feature-requests/p/icloud-sync)
- Apple kuralları: [5.1.1(v) hesap silme](https://developer.apple.com/support/offering-account-deletion-in-your-app), [4.8 forum](https://developer.apple.com/forums/thread/760302)
- KVKK: [Özel nitelikli verilerin işlenme şartları](https://www.kvkk.gov.tr/Icerik/8364/Ozel-Nitelikli-Kisisel-Verilerin-Islenme-Sartlari)
- GitHub Pages: [Pages sınırları](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
