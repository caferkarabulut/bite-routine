# Bite Routine — kararlar

Mimari ve ürün kararları, en yeni karar en üstte. Eski karar silinmez: karar değişince yeni satır eklenir, eskisinin sonuna "(yerine geçti: YYYY-MM-DD)" yazılır.

| Tarih | Karar | Neden | Ayrıntı |
|---|---|---|---|
| 2026-11-27 | Bugün ekranı onaylandı (3.3 pilotu): halka kalori kartı, bardaklı su kartı (+200, +500, son eklemeyi geri al korunur), tek öğün kartı; başlık ve tarih ortada, önceki/sonraki gün okları iki yanda | Kullanıcı kararı (ekran görüntüleri onaylandı; başlığın ortalanmasını istedi) | `mobile/src/features/today/` |
| 2026-11-27 | Bugün'de ileri gezinme korunur: 7 gün ileriye kadar; bugün dışındaki günde "Bugüne dön" | Kullanıcı kararı; mevcut özellik kaybolmasın | `dayTitle.ts` `canGoForward` |
| 2026-11-26 | Destek e-postası `biteroutine0@gmail.com`; destek ve gizlilik sayfalarında, Google Play iletişim alanında | Kullanıcı kararı; mağazalar gerçek iletişim bilgisi ister | `docs/support/`, `docs/privacy/`, `docs/store/` |
| 2026-11-26 | Görsel tasarım: Yön A "Sofra" yerleşimi + "Kömür ve adaçayı" paleti (#F4F1EA zemin, #1F1F1C kömür, #9DB39A adaçayı, #E8E2D3 kum), Nunito yazı tipi, büyük köşeler | Kullanıcı kararı (maketler onaylandı) | Design tuvali "Bite Routine — tasarım yönleri"; `mobile/src/ui/theme.ts` |
| 2026-11-26 | Adaçayı (#9DB39A) yalnız dolgu (halka, çubuk); değer her zaman metinle de gösterilir; yeşil metin için #4A6647 | Adaçayı açık zeminde 2,1:1; metin kontrastı ≥4,5:1 kalsın | `theme.ts` kontrast testi |
| 2026-11-13 | Kaydedilmemiş formdan çıkarken onay sorulur (özel yemek, profil, kayıt düzenleme, kilo; onboarding hariç) | Kullanıcı kararı | PR #42 |
| 2026-11-13 | v1'de iPad desteği kapalı (`ios.supportsTablet: false`) | iPad ekran görüntüsü ve iPad düzen incelemesi gerekmesin | PR #38 |
| 2026-11-13 | USDA "cup" porsiyonu "1 büyük bardak (240 ml)", "tsp" "1 çay kaşığı" adını alır | Türk su bardağı ~200 ml; gramlar USDA'dan değişmeden gelir | PR #40 |
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
