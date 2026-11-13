# Bite Routine — devir notu

> Yeni oturum (bu makine, başka makine, Codex, ikinci hesap) **önce bunu okur**, sonra [`AGENTS.md`](../AGENTS.md)'ye uyar. Durum değişen her turun sonunda bir kez güncellenir. Geçmiş: [`DEVIR-gunluk.md`](DEVIR-gunluk.md). Kapsam ve fazlar: [`PROJECT_STATUS.md`](PROJECT_STATUS.md).

**Son güncelleme:** 2026-11-13 22:47 (Europe/Istanbul) — Claude Opus 5.5 (yönetici), ana hesap, bu Mac

## ▶ BURADAN DEVAM ET

> Yalnız şu anki durum yazılır; en çok ~25 satır, her seferinde üstüne yazılır. Biten iş günlüğe taşınır.

- **Şu an:** Faz 2 kodu ve otomatik testleri tamam; Faz 5 hazırlığının repo tarafı bitti. Yedi PR merge bekliyor, hepsi test edildi.
- **Git:** `main` = `b9e525f`. Açık PR'lar ve merge sırası: #37 (`fix/ux-polish`) → #41 (`fix/android-insets-back`, #37'nin üstünde) → #42 (`feat/unsaved-form-guard`, #41'in üstünde) → #40 (`fix/turkish-portion-names`) → #38 (`chore/release-config`) → #39 (`chore/store-listing`) → #36 (`chore/agent-setup`, bu not). Birbirine dokunmuyorlar; yalnız #37 → #41 → #42 zinciri sıralı.
- **Sıradaki adım:** Kullanıcı PR'ları yukarıdaki sırayla merge eder; ardından GitHub Pages açılır (Settings → Pages → `main` `/docs`).
- **Çalışan işçiler:** yok. Android emülatörü (`bite-routine-pixel`) ve iOS Simulator (iPhone Duo) açık kalabilir.
- **Kullanıcıdan beklenen:** PR merge'leri; GitHub Pages; eski stash'in silinmesi (`git stash drop`, "iPhone kabul notları 24 Ekim"); Google Play destek e-postası.
- **Dikkat:** Otomatik onay PR merge, stash silme ve başka oturumun süreçlerini durdurmayı engelliyor; bunlar kullanıcıda. `.claude/worktrees/` altında altı iş worktree'si duruyor (dalları push'lu); PR'lar merge edilince kaldırılabilir.

## Sıradaki işler (öncelik sırasıyla)

1. PR'ları sırayla merge etmek ve GitHub Pages'i açmak (kullanıcı).
2. Fiziksel cihaz testi: iPhone ve Android telefona kurup elle deneme (Faz 4).
3. Faz 3 görsel tasarım turu; ardından mağaza ekran görüntüleri.
4. Hesap işleri: `eas login` / `eas init`, App Store Connect ve Play Console kayıtları, 12 kişilik kapalı test (`mobile/docs/RELEASE.md`, `docs/store/`).

## Kullanıcı tercihleri (onaylı — yeniden sorma)

- Opus yönetici; kodu ağırlıklı olarak Sonnet yazar, Codex de kullanılır; görev dağılımı yöneticide (2026-11-13). Ayrıntı: AGENTS.md "Yürütme düzeni".
- Commit, PR ve dosyalarda yapay zekâ imzası yok (2026-11-13).
- Ajan düzeni dosyaları (CLAUDE.md, DEVIR, KARARLAR) repoya commit edilir (2026-11-13).

## Geçici (kaybolabilir)

- yok
