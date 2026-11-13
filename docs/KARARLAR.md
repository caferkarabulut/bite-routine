# Bite Routine — kararlar

Mimari ve ürün kararları, en yeni karar en üstte. Eski karar silinmez: karar değişince yeni satır eklenir, eskisinin sonuna "(yerine geçti: YYYY-MM-DD)" yazılır.

| Tarih | Karar | Neden | Ayrıntı |
|---|---|---|---|
| 2026-11-13 | Profil: standart (`proje-kur`, uyarla modu) | — | Kapsam: `docs/PROJECT_STATUS.md` (SPEC açılmadı); devir: `docs/DEVIR.md` + `docs/DEVIR-gunluk.md` |
| 2026-11-13 | Orkestrasyon: `opus-orchestration`; Opus yönetici, kodu ağırlıklı olarak Sonnet yazar, Codex de kullanılır | Kullanıcı tercihi | AGENTS.md "Yürütme düzeni" |
| 2026-11-13 | Risk seviyeleri: varsayılan R0–R3, projeye eşlemesi AGENTS.md'de | — | AGENTS.md "Yürütme düzeni" |
| 2026-11-13 | Ölçüm: ajan-olcum, proje adı `bite-routine` | — | `olcum run --proje bite-routine` |
| 2026-11-13 | Commit ve PR'da yapay zekâ imzası yok; `.githooks/commit-msg` ile zorlanır | Repo kullanıcının kendi CV projesi | `git config core.hooksPath .githooks` |
| 2026-11-13 | Ajan düzeni dosyaları (CLAUDE.md, DEVIR, KARARLAR) repoya commit edilir | — | — |
| 2026-11-13 | Yayın: yalnız App Store ve Google Play Türkiye; sunucu yok | — | `docs/PROJECT_STATUS.md` "Karar" |
| 2026-11-13 | Ürün: ücretsiz, hesapsız, yalnız cihazda çalışan kalori ve öğün günlüğü; eski backend ve web kodu kaldırıldı | — | `docs/PROJECT_STATUS.md` "Karar" |

## Açık sorular

Bu soruların cevabı varsayılmaz; kullanıcıya sorulur. Cevaplanan soru buradan silinir ve yukarıdaki tabloya karar olarak yazılır. "Neyi etkiler" sütununa sorunun beklettiği iş ya da karar yazılır. "Kime" sütununun varsayılanı kullanıcıdır; soru başkasına (ekip, müşteri) sorulacaksa o yazılır.

| Açıldığı tarih | Soru | Neyi etkiler | Kime |
|---|---|---|---|
| — | (henüz yok) | — | — |
