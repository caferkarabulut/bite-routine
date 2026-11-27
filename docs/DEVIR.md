# Bite Routine — devir notu

> Yeni oturum (bu makine, başka makine, Codex, ikinci hesap) **önce bunu okur**, sonra [`AGENTS.md`](../AGENTS.md)'ye uyar. Durum değişen her turun sonunda bir kez güncellenir. Geçmiş: [`DEVIR-gunluk.md`](DEVIR-gunluk.md). Kapsam ve fazlar: [`PROJECT_STATUS.md`](PROJECT_STATUS.md).

**Son güncelleme:** 2026-11-27 14:05 (Europe/Istanbul) — Claude Opus 5.5 (yönetici), ana hesap, bu Mac

## ▶ BURADAN DEVAM ET

> Yalnız şu anki durum yazılır; en çok ~25 satır, her seferinde üstüne yazılır. Biten iş günlüğe taşınır.

- **Şu an:** Faz 3.3 son tur. Tüm ekran maketleri onaylı (tuval "komur"). Kod dalları hazır, doğrulama sürüyor.
- **Git:** `main` = `be852b5` (#48, #49 merge). #50 yanlışlıkla `feat/today-redesign`'a merge edildi → aynı dal PR #51 ile `main`'e açıldı (kullanıcı merge etmeli).
- **Dallar (hepsi `feat/today-add-button` üstünde, o da `feat/catalog-redesign` üstünde):**
  - `feat/today-add-button` `299729c`+bu not: Bugün "Ekle" düğmesi, 24 px başlık, "Senin eklediğin" etiketi (Codex Sol). iOS: 518 test, 9 akış, design-tour PASS. Android: koşuyor.
  - `feat/history-redesign` `dcba3b9`: Geçmiş + Kilo (Codex Sol). Birim 521 test PASS; iOS/Android doğrulanmadı.
  - `feat/settings-redesign` `f6183e2`: Ayarlar + Profil (Güncelle) + Onboarding (Codex Sol). Birim 523 test PASS; iOS/Android doğrulanmadı.
  - `feat/product-form` `b8a0e80`: Katalog sırası, son eklenenler, genişletilmiş ürün formu, ekleyen migration (marka, tür) (Codex Sol, R2). Birim 549 test PASS; **R2 review (sonnet-worker-high) bekliyor**, kota sıfırlanınca (15:10); iOS/Android doğrulanmadı. Sözleşme: scratchpad `review-product/CONTRACT.md` (dal mesajında da özet).
- **Sıradaki adım:** today-add Android sonucu → PR (#51 merge edilince taban `main`). Sonra sırayla history, settings, product-form: `mobile/docs/DOGRULAMA.md` ile iOS + Android, design-tour seçicilerini güncelle (işçilere yasaktı), PR. product-form PR'ı R2 review ACCEPT olmadan açılmaz.
- **Kota:** `get_usage`. 14:00'te 5 saatlik %81 (15:10 sıfırlanır), haftalık %35. Kod işleri Codex Sol'da.
- **Tasarım tuvali:** https://claude.ai/artifact/Qw7AjeWyQT9SW7QadBahM5 (sürüm 10).
- **Kullanıcıdan beklenen:** #51 merge; sonraki PR'lar.
- **Dikkat:** Üst üste PR tuzağı (AGENTS). Aynı anda tek derleme/Maestro. Boşta simülatör/emülatör kapat. `mobil-dogrula` skill'i.

## Sıradaki işler (öncelik sırasıyla)

1. Yukarıdaki dalların doğrulaması ve PR'ları; product-form R2 review.
2. Faz 3.4: uygulama ikonu ve açılış ekranı.
3. Faz 3.5: erişilebilirlik/kontrast/büyük metin; katalog listesinin sanallaştırılması; design-tour "sonra" görüntüleri.
4. Fiziksel cihaz testi (Faz 4) — ertelendi.
5. Hesap işleri: EAS, App Store Connect, Play Console, kapalı test.

## Kullanıcı tercihleri (onaylı — yeniden sorma)

- Opus yönetici; kodu ağırlıklı olarak Sonnet yazar, Codex de kullanılır; görev dağılımı yöneticide (2026-11-13). Ayrıntı: AGENTS.md "Yürütme düzeni".
- Commit, PR ve dosyalarda yapay zekâ imzası yok (2026-11-13).
- Ajan düzeni dosyaları (CLAUDE.md, DEVIR, KARARLAR) repoya commit edilir (2026-11-13).
- İşler en yüksek verimle, paralel ajanlarla yürütülür (2026-11-26).
- Tasarım doğrulaması Duo değil standart iPhone simülatöründe (2026-11-27).
- Destek e-postası biteroutine0@gmail.com (2026-11-27).

## Geçici (kaybolabilir)

- yok
