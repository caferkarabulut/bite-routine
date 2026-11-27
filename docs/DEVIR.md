# Bite Routine — devir notu

> Yeni oturum (bu makine, başka makine, Codex, ikinci hesap) **önce bunu okur**, sonra [`AGENTS.md`](../AGENTS.md)'ye uyar. Durum değişen her turun sonunda bir kez güncellenir. Geçmiş: [`DEVIR-gunluk.md`](DEVIR-gunluk.md). Kapsam ve fazlar: [`PROJECT_STATUS.md`](PROJECT_STATUS.md).

**Son güncelleme:** 2026-11-27 04:05 (Europe/Istanbul) — Claude Opus 5.5 (yönetici), ana hesap, bu Mac

## ▶ BURADAN DEVAM ET

> Yalnız şu anki durum yazılır; en çok ~25 satır, her seferinde üstüne yazılır. Biten iş günlüğe taşınır.

- **Şu an:** Faz 3.2 (tasarım temeli) doğrulandı; PR #46 taslaktan çıktı, merge bekliyor. Seçilen tasarım: Yön A düzeni + "Kömür ve adaçayı" paleti + Nunito (KARARLAR'da).
- **Git:** `main` = `8a43782`. Açık PR'lar: #46 `feat/design-foundation` (HEAD `b2559d6`, güncel main birleştirildi), #47 `docs/handoff-simulator` (yalnız bu not ve AGENTS tuzak satırı). Sıra önemsiz.
- **#46 doğrulaması:** check:deps, typecheck, lint, npm test (463) geçti. iOS Release iPhone 17 (tr-TR): 9 Maestro akışı geçti. Android Release Pixel emülatörü: 9 akış + android-back geçti; edit-delete-entry bir kez kaldı, iki tekrarda geçti (kararsız).
- **Sıradaki adım:** Kullanıcı #46 ve #47'yi merge eder. Ardından 3.3 Bugün ekranı pilotu → kullanıcı onayı → diğer ekranlar paralel (katalog+detay, geçmiş+kilo, ayarlar+profil, onboarding).
- **Simülatörler:** "iPhone 17" UDID `2B9ADD03-24A3-45F1-B184-D5B641679907` (iOS 27.2, tr-TR; #46 bunda doğrulandı) ve "iPhone 17 Pro (TR)" UDID `93B134AD-5280-4931-AAD5-857B26EEDF3C`. Android: AVD `bite-routine-pixel` (`emulator-5554`, tr-TR).
- **Tasarım tuvali:** https://claude.ai/artifact/Qw7AjeWyQT9SW7QadBahM5 (sayfa "komur" = onaylı maketler: Bugün, Katalog, Yemek detayı).
- **Palet:** bg #f4f1ea, yüzey #fbf9f4, birincil/metin #1f1f1c, kum #e8e2d3, adaçayı #9db39a (yalnız süs, 2.1:1), yeşil metin #4a6647, soluk metin #5c584f, su #5a7f99.
- **Çalışan işçiler:** yok. Önceki oturum (pid 14099) kullanıcı tarafından durduruldu; Claude süreci boşta açık kalabilir.
- **Kullanıcıdan beklenen:** #46 ve #47 merge.
- **Dikkat:** iOS 27.1 runtime yalnız iPhone Duo destekler. RN `textTransform: uppercase` Türkçe değil; `toLocaleUpperCase('tr-TR')`. Paralel iOS derlemesi + emülatör Android'de ANR penceresi açabilir. Uzun iOS ekranında Maestro kaydırma sonrası hedefi `centerElement: true` ile ortalamalı (README). `.claude/worktrees/` altında 3 eski worktree yalnız işçi `PROGRESS-T*.md` notlarıyla duruyor (agent-a47c…, agent-a732…, agent-aaec…); PR'ları merge edildi, notlar gözden geçirilince kaldırılabilir.

## Sıradaki işler (öncelik sırasıyla)

1. #46 merge; 3.3 Bugün pilotu; ardından diğer ekranlar. Bugün'de üst başlık ve gün gezgini ikisi de "Bugün" yazıyor; 3.3'te ele alınmalı.
2. Faz 3.4: uygulama ikonu ve açılış ekranı (şu an Expo'nun şablon ikonu; mağazaya gönderilemez).
3. Faz 3.5: erişilebilirlik/kontrast/büyük metin kontrolleri; design-tour ile "sonra" görüntüleri.
4. Fiziksel cihaz testi (Faz 4) — kullanıcı şimdilik erteledi.
5. Hesap işleri: `eas login` / `eas init`, App Store Connect ve Play Console kayıtları, 12 kişilik kapalı test (`mobile/docs/RELEASE.md`, `docs/store/`).

## Kullanıcı tercihleri (onaylı — yeniden sorma)

- Opus yönetici; kodu ağırlıklı olarak Sonnet yazar, Codex de kullanılır; görev dağılımı yöneticide (2026-11-13). Ayrıntı: AGENTS.md "Yürütme düzeni".
- Commit, PR ve dosyalarda yapay zekâ imzası yok (2026-11-13).
- Ajan düzeni dosyaları (CLAUDE.md, DEVIR, KARARLAR) repoya commit edilir (2026-11-13).
- İşler en yüksek verimle, paralel ajanlarla yürütülür (2026-11-26).
- Tasarım doğrulaması Duo değil standart iPhone simülatöründe (2026-11-27).
- Destek e-postası biteroutine0@gmail.com (2026-11-27).

## Geçici (kaybolabilir)

- yok
