# Bite Routine — devir günlüğü

En yeni girdi en üstte. [`DEVIR.md`](DEVIR.md)'den taşınan ayrıntı buraya gelir. Her girdi şunları yazar: ne yapıldı (dosyalar, commit'ler), kim yaptı (model, hesap), kararlar, doğrulama (komut ve sonucu), açık kalanlar. Girdiler sonradan düzeltilmez; yanlış bir girdi yeni bir girdiyle düzeltilir.

## 2026-11-13 22:05 — dal temizliği ve gece işleri (T1–T4)

- Kim: Claude Opus 5.5 yönetici; işçiler `sonnet-worker` (T1, T2), Codex `gpt-6-luna` high (T3), `gpt-6.1-sol` medium (T4) ve review `gpt-6.1-sol` high/medium. Hepsi ajan-olcum'a kaydedildi (`olcum` proje `bite-routine`).
- Temizlik: 34 uzak ve 17 yerel dal silindi (main'e girmiş olanlar ve Ekim sunucu dönemi dalları; commit'leri PR #25/#26/#29 kayıtlarında duruyor), 14 eski worktree ve 2 bayat SDK bekleme döngüsü kaldırıldı.
- PR #37: PR #35 yanlış tabana merge edildiği için UX düzeltmeleri `main`'e yeniden açıldı. CI yeşil.
- T1 → PR #40: 69 temel gıda porsiyonunun USDA adı Türkçeleşti ("1 büyük bardak (240 ml)", "1 çay kaşığı", "Orta boy", "1 porsiyon (~28 g)"). Kaynakta düzeltildi, dist yeniden üretildi; yabancı ölçü adı için strict derleme kontrolü eklendi. Değer karşılaştırması: 2.635 öğe, 1.294 porsiyon, yalnız 69 `nameTr` farklı. Katalog testleri 45/45, mobil 306/306. Sol review: tur 1 REVISE (P2 "parça" → "porsiyon", P3 yumurta boyu), tur 2 ACCEPT; korumayı kaldırınca 2 test kırıldı. Yönetici spec hatası: tsp önce "tatlı kaşığı" yazılmıştı, "çay kaşığı" yapıldı.
- T2 → PR #41 (#37'ye bağlı): `Screen` alt güvenli alanı içerik boşluğu olarak uyguluyor ("Başla" artık hareket çubuğuna yaslanmıyor, emülatör ekran görüntüsüyle bakıldı); Tabs `backBehavior="history"`; yeni `android-back.yaml`; `custom-food.yaml` akşam saatinde kaydı ekran altında aradığı için kalıyordu, kaydırarak aranıyor. Release derlemeleri: Android 8/8 + android-back, iOS 8/8. Birim testleri 312/312.
- T3 → PR #39: `docs/store/` App Store ve Google Play metinleri (TR/EN), gizlilik "veri toplanmaz", yaş, IARC, hedef kitle, sağlık beyanı, kapalı test planı; tüm alanlar karakter sınırında. Export compliance yanıtı yönetici tarafından T4 ile tutarlı yapıldı.
- T4 → PR #38: `mobile/eas.json` (development/preview/production), `app.json`: iPad desteği kapalı, `ITSAppUsesNonExemptEncryption: false`, eski depolama izinleri engelli; `mobile/docs/RELEASE.md`. Testler 306/306, `expo config` temiz.
- Kararlar (yönetici, iki yönlü): iPad desteği v1'de kapalı; USDA cup "büyük bardak (240 ml)" olarak adlandırılır (su bardağı ~200 ml olduğu için).
- Açık: PR merge'leri, GitHub Pages, stash silme, kaydedilmemiş form uyarısı kararı, fiziksel cihaz testi.

## 2026-11-13 20:53 — proje düzeni kuruldu

- `proje-kur` skill'i (standart profil, uyarla modu), Claude Opus 5.5, ana hesap, bu Mac: `AGENTS.md`'ye oturum başı, devir, kararlar, bilinen tuzaklar ve yürütme düzeni bölümleri eklendi; `CLAUDE.md`, `docs/DEVIR.md`, `docs/DEVIR-gunluk.md`, `docs/KARARLAR.md`, `docs/arastirma/README.md`, `.githooks/commit-msg` açıldı; `.gitignore`'a üç satır eklendi.
- Kapsam belgesi olarak mevcut `docs/PROJECT_STATUS.md` kullanılır; `docs/SPEC.md` açılmadı.
- `chore/agent-setup` dalında, `origin/main` (`b9e525f`) tabanından; push edilmedi.
