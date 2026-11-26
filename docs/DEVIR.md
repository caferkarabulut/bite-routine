# Bite Routine — devir notu

> Yeni oturum (bu makine, başka makine, Codex, ikinci hesap) **önce bunu okur**, sonra [`AGENTS.md`](../AGENTS.md)'ye uyar. Durum değişen her turun sonunda bir kez güncellenir. Geçmiş: [`DEVIR-gunluk.md`](DEVIR-gunluk.md). Kapsam ve fazlar: [`PROJECT_STATUS.md`](PROJECT_STATUS.md).

**Son güncelleme:** 2026-11-26 23:30 (Europe/Istanbul) — Claude Opus 5.5 (yönetici), ana hesap, bu Mac

## ▶ BURADAN DEVAM ET

> Yalnız şu anki durum yazılır; en çok ~25 satır, her seferinde üstüne yazılır. Biten iş günlüğe taşınır.

- **Şu an:** Faz 3 (görsel tasarım) başladı. 3.0 hazırlık bitti; 3.1'de iki tasarım yönü maketlendi, kullanıcı seçimini bekliyor.
- **Git:** `main` = `58f96e4` (13 Kasım PR'larının hepsi merge edildi). Açık PR: #43 (`chore/design-baseline`, Maestro tasarım turu + bu not).
- **"Önce" görüntüleri:** `.design-baseline/2026-11-26/{ios,android}/` (35+35 PNG, git dışında). Yeniden çekmek: `mobile/` içinde `.maestro/run.sh <cihaz> design-tour`.
- **Tasarım maketleri:** claude.ai Design tuvali "Bite Routine — tasarım yönleri" (Yön A "Sofra": sıcak, koyu yeşil + kalori halkası; Yön B "Net": beyaz, mavi vurgu, yoğun liste). Dosyalar yalnız oturumun geçici klasöründe; tuval kalıcı kopya.
- **Paket araştırması (Codex Luna, SDK 58):** ekle `expo-symbols`, `react-native-svg`, `expo-haptics`; saat seçici için `@react-native-community/datetimepicker` ya da `@expo/ui` (yalnız biri); `@expo/vector-icons` artık önerilmiyor; porsiyon seçimi için Expo Router `formSheet` yeterli.
- **Sıradaki adım:** Kullanıcı yön seçer → 3.2 temel (tasarım değerleri, ikonlar, ortak bileşenler; tek işçi, önce merge) → 3.3 Bugün pilotu → onaydan sonra ekranlar paralel.
- **Çalışan işçiler:** yok. Android emülatörü (`bite-routine-pixel`) ve iOS Simulator (iPhone Duo, kapalı/dış ekran) açık.
- **Kullanıcıdan beklenen:** tasarım yönü seçimi; standart iPhone simülatörü için ek iOS runtime indirme kararı; Google Play destek e-postası (ayrı Gmail önerildi); eski stash'i silmek.
- **Dikkat:** Bu Mac'teki iOS 27.1 runtime yalnız iPhone Duo'yu destekliyor. Duo'nun dış ekranında sağ üstteki saat/kamera adası içeriğin üstüne biniyor (güvenli alan yalnız üst/alt kenarda uygulanıyor) — tasarım fazında ele alınacak. "Bugün" başlığı ile tarih seçicinin "‹ Bugün ›" yazısı tekrar ediyor; bu yönlendirme hatası değil, tasarım sorunu.

## Sıradaki işler (öncelik sırasıyla)

1. Faz 3.1: tasarım yönü seçimi (kullanıcı), ardından 3.2 temel bileşenler ve 3.3 ekranlar.
2. Faz 3.4: uygulama ikonu ve açılış ekranı (şu an Expo'nun şablon ikonu; mağazaya gönderilemez).
3. Katalog: paketli ürün ad/marka yazımı tutarsız ("ETİ", "ETI", "eti lif"); katalog hattında normalleştirme (R2).
4. Fiziksel cihaz testi (Faz 4) — kullanıcı şimdilik erteledi.
5. Hesap işleri: `eas login` / `eas init`, App Store Connect ve Play Console kayıtları, 12 kişilik kapalı test (`mobile/docs/RELEASE.md`, `docs/store/`).

## Kullanıcı tercihleri (onaylı — yeniden sorma)

- Opus yönetici; kodu ağırlıklı olarak Sonnet yazar, Codex de kullanılır; görev dağılımı yöneticide (2026-11-13). Ayrıntı: AGENTS.md "Yürütme düzeni".
- Commit, PR ve dosyalarda yapay zekâ imzası yok (2026-11-13).
- Ajan düzeni dosyaları (CLAUDE.md, DEVIR, KARARLAR) repoya commit edilir (2026-11-13).

## Geçici (kaybolabilir)

- yok
