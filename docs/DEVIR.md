# Bite Routine — devir notu

> Yeni oturum (bu makine, başka makine, Codex, ikinci hesap) **önce bunu okur**, sonra [`AGENTS.md`](../AGENTS.md)'ye uyar. Durum değişen her turun sonunda bir kez güncellenir. Geçmiş: [`DEVIR-gunluk.md`](DEVIR-gunluk.md). Kapsam ve fazlar: [`PROJECT_STATUS.md`](PROJECT_STATUS.md).

**Son güncelleme:** 2026-11-13 20:53 (Europe/Istanbul) — Claude Opus 5.5, ana hesap, bu Mac

## ▶ BURADAN DEVAM ET

> Yalnız şu anki durum yazılır; en çok ~25 satır, her seferinde üstüne yazılır. Biten iş günlüğe taşınır.

- **Şu an:** Faz 2 (uygulama) kodu tamam; klavye/miktar metni düzeltmeleri ve Maestro E2E akışları yazıldı. Ajan düzeni (devir, kararlar, yürütme düzeni) `chore/agent-setup` dalında kuruldu.
- **Git:** `main` = `b9e525f`. `fix/ux-polish` (`560ed45`) ve `feat/mobile-local` `main`'den 3 commit önde: `28bc1a0`, `cd00495`, `560ed45`. `chore/agent-setup` push edilmedi.
- **Sıradaki adım:** `fix/ux-polish` → `main` PR'ını açıp UX ve E2E commit'lerini `main`'e almak (kullanıcı onayıyla).
- **Çalışan işçiler:** yok
- **Kullanıcıdan beklenen:** `chore/agent-setup` için push/PR onayı; `fix/ux-polish` → `main` PR kararı.
- **Dikkat:** PR #35 yanlış tabana (`feat/mobile-local`) merge edildi; UX düzeltmeleri `main`'de yok. `.claude/worktrees/` altında 10 eski ajan worktree'si, `~/.codex/worktrees/` altında 2 Codex worktree'si var; durumları doğrulanmadı, silmeden önce bakılır.

## Sıradaki işler (öncelik sırasıyla)

1. `fix/ux-polish` → `main` PR'ını açıp UX ve E2E commit'lerini `main`'e almak (kullanıcı onayıyla).
2. Faz 2: uçtan uca elle test (iOS Simulator ve Android).
3. Faz 3: görsel tasarım turu.

## Kullanıcı tercihleri (onaylı — yeniden sorma)

- Opus yönetici; kodu ağırlıklı olarak Sonnet yazar, Codex de kullanılır; görev dağılımı yöneticide (2026-11-13). Ayrıntı: AGENTS.md "Yürütme düzeni".
- Commit, PR ve dosyalarda yapay zekâ imzası yok (2026-11-13).
- Ajan düzeni dosyaları (CLAUDE.md, DEVIR, KARARLAR) repoya commit edilir (2026-11-13).

## Geçici (kaybolabilir)

- yok
