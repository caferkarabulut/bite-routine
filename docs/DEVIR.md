# Bite Routine — devir notu

> Yeni oturum (bu makine, başka makine, Codex, ikinci hesap) **önce bunu okur**, sonra [`AGENTS.md`](../AGENTS.md)'ye uyar. Durum değişen her turun sonunda bir kez güncellenir. Geçmiş: [`DEVIR-gunluk.md`](DEVIR-gunluk.md). Kapsam ve fazlar: [`PROJECT_STATUS.md`](PROJECT_STATUS.md).

**Son güncelleme:** 2026-11-27 13:15 (Europe/Istanbul) — Claude Opus 5.5 (yönetici), ana hesap, bu Mac

## ▶ BURADAN DEVAM ET

> Yalnız şu anki durum yazılır; en çok ~25 satır, her seferinde üstüne yazılır. Biten iş günlüğe taşınır.

- **Şu an:** Faz 3.3. Bugün (PR #49) ile Katalog + yemek detayı (PR #50) ekranları bitti ve doğrulandı. Kalan ekranların maketleri tuvalde, kullanıcı onayını bekliyor.
- **Git:** `main` = `5acd274`. Açık PR'lar: #48 `chore/quota-check` (yalnız belge: kota okuma, `mobile/docs/DOGRULAMA.md`, bu not), #49 `feat/today-redesign`, #50 `feat/catalog-redesign` (#49'un üstünde; #49 merge edilince tabanı `main`'e çevrilir).
- **Onay bekleyen maketler** (tuval "komur" sayfası, satır 2–3): Geçmiş, Kilo, Ayarlar (+ tümünü sil penceresi), Profil, Onboarding. Codex Sol yazdı, yönetici dosyaları kontrol etti; görsel olarak kullanıcı görmedi.
- **Sıradaki adım:** Kullanıcı maketleri onaylar/düzeltir → ekranlar sırayla kodlanır (önce Geçmiş + Kilo, sonra Ayarlar + Profil, sonra Onboarding), her biri #50'nin üstüne ya da merge sonrası `main`'e. Doğrulama: `mobile/docs/DOGRULAMA.md` (yerel skill `mobil-dogrula`).
- **Çalışan işçi:** yok. Simülatörler, emülatör ve Gradle daemon kapalı.
- **Kota:** masaüstü uygulamasında `mcp__ccd_session_mgmt__get_usage`. 13:10'da 5 saatlik %65 (15:10'da sıfırlanır), haftalık %33. %60 üstünde yeni kod işi Codex Sol'a gider.
- **Tasarım tuvali:** https://claude.ai/artifact/Qw7AjeWyQT9SW7QadBahM5
- **Palet:** bg #f4f1ea, yüzey #fbf9f4, birincil/metin #1f1f1c, kum #e8e2d3, adaçayı #9db39a (yalnız süs, 2.1:1), yeşil metin #4a6647, soluk metin #5c584f, su #5a7f99.
- **Kullanıcıdan beklenen:** maket onayı; #48, #49, #50 merge (sıra: #48 bağımsız; #49 sonra #50).
- **Dikkat:** #50 açık konular: kategori 300 satır sanallaştırılmamış liste (gerçek cihazda hız ölçülmedi); detayda 100 g makro satırları kaldırıldı (maket gereği, yalnız "100 g için N kcal" kaldı). `.claude/worktrees/` altında iş worktree'leri: `agent-abcfeedd…` (#46, merge edildi), `agent-a41fe8029…` (#49), `agent-a453e6e44…` (#50); eski 3 worktree yalnız `PROGRESS-T*.md` notlu.

## Sıradaki işler (öncelik sırasıyla)

1. Maket onayı → Geçmiş+Kilo, Ayarlar+Profil, Onboarding kodu.
2. Faz 3.4: uygulama ikonu ve açılış ekranı (şu an Expo'nun şablon ikonu; mağazaya gönderilemez).
3. Faz 3.5: erişilebilirlik/kontrast/büyük metin kontrolleri; katalog listesinin sanallaştırılması ve cihazda hız ölçümü; design-tour "sonra" görüntüleri.
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
