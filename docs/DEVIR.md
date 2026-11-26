# Bite Routine — devir notu

> Yeni oturum (bu makine, başka makine, Codex, ikinci hesap) **önce bunu okur**, sonra [`AGENTS.md`](../AGENTS.md)'ye uyar. Durum değişen her turun sonunda bir kez güncellenir. Geçmiş: [`DEVIR-gunluk.md`](DEVIR-gunluk.md). Kapsam ve fazlar: [`PROJECT_STATUS.md`](PROJECT_STATUS.md).

**Son güncelleme:** 2026-11-26 23:30 (Europe/Istanbul) — Claude Opus 5.5 (yönetici), ana hesap, bu Mac

## ▶ BURADAN DEVAM ET

> Yalnız şu anki durum yazılır; en çok ~25 satır, her seferinde üstüne yazılır. Biten iş günlüğe taşınır.

- **Şu an (2026-11-27 02:13):** Faz 3.2 (tasarım temeli) kodu bitti, doğrulaması yarım. Seçilen tasarım: Yön A düzeni + "Kömür ve adaçayı" paleti + Nunito (KARARLAR'da).
- **Açık PR'lar:** #43 `chore/design-baseline` (Maestro tasarım turu + bu not), #44 `fix/packaged-name-case` (927 paketli ürün adı/markası normalleştirildi, değerler aynı; Sol iki tur review), #45 `docs/support-email` (biteroutine0@gmail.com), #46 `feat/design-foundation` (taslak; tasarım temeli). #43–#45'te CI yalnız `check:deps` (Expo yama kayması) yüzünden kırmızı; #46 bunu düzeltir.
- **#46 durumu:** check:deps, typecheck, lint, npm test (463) geçti. iOS Maestro iPhone Duo'da koşuldu, son tam geçiş kesin doğrulanmadı. Android release derlemesi ~2 saat sonra 0 CPU'da takıldı (worktree `.claude/worktrees/agent-abcfeedd175bd895d`, gradlew pid 53035); Android doğrulanmadı.
- **Sıradaki adım:** (1) takılı Gradle'ı durdur (`cd .claude/worktrees/agent-abcfeedd175bd895d/mobile/android && ./gradlew --stop`), (2) standart iPhone simülatörü hazır: "iPhone 17 Pro (TR)", UDID `93B134AD-5280-4931-AAD5-857B26EEDF3C`, iOS 27.2, dil tr-TR, (3) #46'yı iOS + Android release + Maestro + design-tour ekran görüntüleriyle doğrula, taslaktan çıkar, (4) 3.3 Bugün ekranı pilotu → kullanıcı onayı → diğer ekranlar paralel (katalog+detay, geçmiş+kilo, ayarlar+profil, onboarding).
- **Tasarım tuvali:** https://claude.ai/artifact/Qw7AjeWyQT9SW7QadBahM5 (sayfa "komur" = onaylı maketler: Bugün, Katalog, Yemek detayı).
- **Palet:** bg #f4f1ea, yüzey #fbf9f4, birincil/metin #1f1f1c, kum #e8e2d3, adaçayı #9db39a (yalnız süs, 2.1:1), yeşil metin #4a6647, soluk metin #5c584f, su #5a7f99.
- **Çalışan işçiler:** yok (tasarım temeli işçisi bitti). iOS 27.2 runtime kuruldu.
- **Kullanıcıdan beklenen:** #43, #44, #45'i merge etmek (sıra önemsiz; CI kırmızısı yalnız Expo yaması). #46 doğrulanınca merge. Eski stash'i silmek (`git stash list` → `git stash drop stash@{N}`).
- **Dikkat:** iOS 27.1 runtime yalnız iPhone Duo destekler. RN `textTransform: uppercase` Türkçe değil; `toLocaleUpperCase('tr-TR')`. Paralel iOS derlemesi + emülatör Android'de ANR penceresi açabilir.

## Sıradaki işler (öncelik sırasıyla)

1. #46 doğrulaması ve merge; 3.3 Bugün pilotu; ardından diğer ekranlar.
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
