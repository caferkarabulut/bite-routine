# Bite Routine — devir notu

> Yeni oturum (bu makine, başka makine, Codex, ikinci hesap) **önce bunu okur**, sonra [`AGENTS.md`](../AGENTS.md)'ye uyar. Durum değişen her turun sonunda bir kez güncellenir. Geçmiş: [`DEVIR-gunluk.md`](DEVIR-gunluk.md). Kapsam ve fazlar: [`PROJECT_STATUS.md`](PROJECT_STATUS.md).

**Son güncelleme:** 2026-11-27 12:12 (Europe/Istanbul) — Claude Opus 5.5 (yönetici), ana hesap, bu Mac

## ▶ BURADAN DEVAM ET

> Yalnız şu anki durum yazılır; en çok ~25 satır, her seferinde üstüne yazılır. Biten iş günlüğe taşınır.

- **Şu an:** Faz 3.3. Bugün ekranı bitti ve kullanıcı onayladı (PR #49). Katalog + yemek detayı işçisi çalışıyor.
- **Git:** `main` = `5acd274`. Açık PR'lar: #48 `chore/quota-check` (kota kuralı + bu not, yalnız belge), #49 `feat/today-redesign` (Bugün ekranı, HEAD `6f3a5a9`). Sıra önemsiz.
- **Çalışan işçi:** `sonnet-worker-high` → Katalog + yemek detayı, dal `feat/catalog-redesign` (#49'un üstünde, taban `6f3a5a9`), kendi worktree'si `.claude/worktrees/agent-a453e6e44bc10b471`. Maketler: tuval "komur" sayfası `K-Katalog`, `K-Detay`. Yeni özellik yok: maketteki "Son eklenenler" ve satırdan hızlı ekleme yoksa yapılmaz, raporlanır. iOS + Android Maestro ve ekran görüntülerini kendisi alır.
- **Sıradaki adım:** İşçi raporu → yönetici ekran görüntülerine bakar → push + PR (#49'un üstüne) → kullanıcı onayı. Sonra maketi olmayan ekranlar (geçmiş+kilo, ayarlar+profil, onboarding): önce tuvalde maket, kullanıcı onayı, sonra kod.
- **Kota:** masaüstü uygulamasında `mcp__ccd_session_mgmt__get_usage` (12:10'da 5 saatlik %46, haftalık %31). `rate-limit-status.json` burada güncellenmez.
- **Simülatörler:** "iPhone 17" UDID `2B9ADD03-24A3-45F1-B184-D5B641679907` (iOS 27.2, tr-TR) ve "iPhone 17 Pro (TR)" UDID `93B134AD-5280-4931-AAD5-857B26EEDF3C`. Android: AVD `bite-routine-pixel` (`emulator-5554`, tr-TR). Yeni worktree'de Android derlemesi `ANDROID_HOME=$HOME/Library/Android/sdk` ister.
- **Tasarım tuvali:** https://claude.ai/artifact/Qw7AjeWyQT9SW7QadBahM5 (sayfa "komur" = onaylı maketler: Bugün, Katalog, Yemek detayı).
- **Palet:** bg #f4f1ea, yüzey #fbf9f4, birincil/metin #1f1f1c, kum #e8e2d3, adaçayı #9db39a (yalnız süs, 2.1:1), yeşil metin #4a6647, soluk metin #5c584f, su #5a7f99.
- **Kullanıcıdan beklenen:** #48 ve #49 merge; Katalog/detay ekran görüntülerine onay.
- **Dikkat:** Aynı anda tek iOS/Android derlemesi ve tek Maestro koşusu (ANR ve akış çakışması). Uzun iOS ekranında Maestro'da kaydırma sonrası `centerElement: true`. `.claude/worktrees/` altında eski 3 worktree yalnız `PROGRESS-T*.md` notlarıyla duruyor; `agent-abcfeedd…` (#46) ve `agent-a41fe8029…` (#49) iş worktree'leri.

## Sıradaki işler (öncelik sırasıyla)

1. Katalog + detay PR'ı; ardından geçmiş+kilo, ayarlar+profil, onboarding (önce maket ve onay).
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
