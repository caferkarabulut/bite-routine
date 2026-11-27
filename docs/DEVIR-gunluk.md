# Bite Routine — devir günlüğü

En yeni girdi en üstte. [`DEVIR.md`](DEVIR.md)'den taşınan ayrıntı buraya gelir. Her girdi şunları yazar: ne yapıldı (dosyalar, commit'ler), kim yaptı (model, hesap), kararlar, doğrulama (komut ve sonucu), açık kalanlar. Girdiler sonradan düzeltilmez; yanlış bir girdi yeni bir girdiyle düzeltilir.

## 2026-11-27 14:05 — Kullanıcı istekleri: ürün ekleme, Ekle düğmesi, başlıklar, profil; kalan ekranlar

- Kullanıcı #48, #49'u merge etti; #50 ölü dala gitti → PR #51.
- Kullanıcı istekleri ve kararlar KARARLAR'da (7 satır). Yönetici tuvali güncelledi (sürüm 9–10): Bugün/Geçmiş/Katalog ortalı 24 px başlık, Bugün "Ekle", Katalog sırası + "Kendi ürününü ekle" kartı, kısa Profil/Onboarding, hatırlatıcı bildirim notu, yeni `U-UrunEkle` (zorunlu alanlar, ipucu kartı, içecek notu).
- Codex `gpt-6.1-sol` (dört çağrı, `olcum run`): today-add (high), history (medium), settings (high), product-form (high, R2). Yönetici her birinde son mesajı, `git status`'u ve dosya kapsamını kontrol edip commit etti (kanca kontrolü ile).
- today-add iOS Release iPhone 17: 518 test, 9 akış, design-tour PASS; ekran görüntüsü yöneticide kontrol edildi.
- Not: `mealSlotForTime` aynı saat kuralını kullanıyor (akşam 22:00'ye kadar; 05:00 öncesi atıştırmalık).

## 2026-11-27 13:15 — Katalog + detay, kalan maketler, doğrulama runbook'u

- `sonnet-worker-high` → `feat/catalog-redesign` (`092ba67`..`bce7ad3`, taban `6f3a5a9`): `CatalogScreen.tsx`, `FoodDetailScreen.tsx`, `foodView.ts`, `amountStep.ts` (adım: porsiyon 0,5 / gram 10), `Screen` `footer` prop'u, SearchBar/SegmentedControl/Chip düzeltmeleri, Maestro seçicileri. npm test 491 (performance zaman testi derleme yükünde 2 kez kaldı, tekrarlarda geçti). iOS 9 akış + design-tour, Android 10 akış PASS. Yönetici commit mesajlarını kancayla, katalog ve detay ekran görüntülerini kontrol etti. PR #50 (#49'un üstüne).
- Codex `gpt-6.1-sol` medium (iki çağrı, `olcum run`): Geçmiş, Kilo, Ayarlar, Profil, Onboarding maketleri (scratchpad'de; repo değişmedi). Yönetici dosyaları ve biçimi kontrol edip tuvale ekledi (sürüm 7 ve 8).
- Kullanıcı isteğiyle: `mobile/docs/DOGRULAMA.md` (iOS + Android Release + Maestro runbook'u, AGENTS.md'den bağlantılı; PR #48), yerel `.claude/skills/mobil-dogrula/SKILL.md`, hafızaya "işçi raporunu kontrol et, boşta cihazları kapat".
- Simülatörler, emülatör, Gradle daemon kapatıldı.

## 2026-11-27 12:12 — Bugün ekranı (3.3 pilotu), kota okuması

- Kullanıcı #46 ve #47'yi merge etti.
- Kota: `rate-limit-status.json` 13 Kasım'dan beri yazılmıyordu (masaüstü uygulaması statusLine çalıştırmıyor). opus-orchestration SKILL.md (yerel `~/Developer/claude_skills`, commit edilmedi; uzak depo başka hesapta) ve AGENTS.md artık kotayı `get_usage` aracından okuyor; PR #48.
- `sonnet-worker-high` → `feat/today-redesign` `9f80a24`, `5023fa1`: `CalorieCard`, `WaterCard`, `MealsCard`, `entryAmount.ts`, `water.ts`, `dayTitle.ts`, Today sekmesinde `headerShown: false`, i18n anahtarları, Maestro seçicileri. iOS iPhone 17: 9 akış + design-tour PASS. Yönetici Android release'i doğruladı: 9 akış + android-back PASS (yeni worktree'de ilk derleme `ANDROID_HOME` eksikliğinden kaldı).
- Kullanıcı ekranı onayladı; başlık ve tarihin ortalanmasını, okların iki yana ayrılmasını istedi; ileri gezinmenin korunmasını onayladı.
- `sonnet-worker` → `bb51910`: `Screen`'e isteğe bağlı `centerHeader`/`headerLeft`/`headerBelow`, 7 gün ileri, "Yarın", "Bugüne dön" (`today.goToToday` metni "Bugüne git" → "Bugüne dön"; `DayNavigator` da aynı metni kullanır). npm test 476; iOS 9 + design-tour, Android 10 akış PASS.
- Yönetici: KARARLAR'a iki satır (`6f3a5a9`), `feat/today-redesign` push, PR #49.
- `sonnet-worker-high` başlatıldı: Katalog + yemek detayı (`feat/catalog-redesign`, taban `6f3a5a9`).

## 2026-11-27 04:05 — #46 doğrulaması

- Kullanıcı #37–#45'in hepsini merge etmiş; GitHub Pages yayında (`main` `/docs`).
- Yönetici (Claude Opus 5.5) takılı Gradle'ı durdurdu (daemon + pid 53035), güncel `main`'i `feat/design-foundation`'a birleştirdi (`b282b21`, çakışmasız).
- Önceki oturum (pid 14099, DEVIR'de "çalışan yok" görünüyordu) aynı worktree'de Duo'ya derleme ve Maestro koşuyordu; iki koşu çakıştı. Kullanıcı eski oturumu durdurdu. O oturumun son commit'i `dea9e4d` (Android'de Nunito yüksekliği yüzünden metin kutularının kaydırmayı yutması; `mobile/src/ui/components.tsx`, `controls.tsx`) tutuldu.
- `sonnet-worker-high` → `b2559d6`: kök neden Maestro zamanlaması, uygulama değil. iPhone 17'de `scroll` Bugün'ü sona kaydırıp `add-breakfast`'ı başlığın arkasına itiyordu; su kartında "Son eklemeyi geri al" sekme çubuğunun altında kalıyordu. `subflows/add-lentil-soup.yaml`, `water.yaml` → `scrollUntilVisible` + `centerElement: true`; README tuzak satırı.
- Doğrulama: check:deps, typecheck, lint, npm test (28 suite, 463 test) HEAD'de geçti. iOS Release iPhone 17 (iOS 27.2, tr-TR): 9 akış PASS (işçi koşusu). Design-tour düzeltmeden önce PASS (35 görüntü; yönetici Bugün, yemek detayı, geçmiş görüntülerine baktı). Android Release `bite-routine-pixel`: 9 akış + android-back PASS; edit-delete-entry ilk koşuda katalog dokunuşu detayı açmadı, iki tekrarda PASS (kararsız).
- GitHub: `feat/design-foundation` push edildi, #46 açıklaması güncellendi ve taslaktan çıkarıldı. Bu not #47'ye (`docs/handoff-simulator`) yazıldı.
- Temizlik: merge edilmiş 5 temiz worktree kaldırıldı (design-baseline, packaged-name-case, agent-setup, release-config, store-listing; dallar duruyor).
- Açık: #46/#47 merge, 3.3 pilot.

## 2026-11-27 02:13 — Faz 3.1 seçim, katalog ad normalleştirme, destek e-postası, 3.2 temel

- Kullanıcı Yön A düzenini seçti, paleti beğenmedi; başka uygulamanın "Kömür ve adaçayı" paleti + Nunito + büyük köşeler istendi. Yönetici (Claude Opus 5.5) tuvalde palet karşılaştırması ve "komur" sayfasını yaptı; kullanıcı onayladı. Kontrast: adaçayı 2.1:1 → yalnız süs, yeşil metin #4a6647.
- `sonnet-worker-high` → PR #44: `catalog/packaged/filter-off.mjs` (foldKey, titleTr, normalizeDisplay, veri sözlüğüyle ASCII I çözümü, marka takma adları BİM/ŞOK/A101/Anadolu Çiftliği), 57 test, `off-tr.json`, `catalog/dist/catalog.json`, `mobile/assets/catalog.json` yeniden üretildi. 927 kayıtta yalnız ad/marka değişti, besin değerleri aynı. Codex Sol (high) iki tur review: tur 1 ve tur 2 bulguları (İ'li kelimede ASCII I, tek yanlış yazımın çoğunluğu bastırması) düzeltildi; yönetici doğruladı.
- Yönetici → PR #45: destek/gizlilik sayfalarına biteroutine0@gmail.com, `docs/store/google-play.md`, `docs/store/app-store.md`, KARARLAR'a 3 satır.
- `opus-worker` → PR #46 (taslak, `feat/design-foundation`, 8 commit eb18866..af105e9): paketler (expo-symbols, react-native-svg, expo-haptics, datetimepicker, Nunito), Expo yama güncellemesi, `theme.ts` paleti/yazı ölçeği/gölgeler, `Icon` + sekme ikonları, ortak bileşenler, yan güvenli alanlar, lisans satırı, Maestro düzeltmesi. Yönetici doğrulaması: check:deps, typecheck, lint, npm test (28 suite, 463 test) geçti. iOS Maestro (Duo) koşuldu, son tam geçiş kesin doğrulanmadı; Android release derlemesi takıldı, doğrulanmadı.
- iOS 27.2 simülatör runtime indirmesi kullanıcı onayıyla başladı (yavaş, ~0,4–1 MB/s).
- Açık: #46 doğrulaması, standart iPhone simülatörü, 3.3 pilot.

## 2026-11-26 23:30 — Faz 3.0 hazırlık ve 3.1 maketleri

- Kullanıcı 13 Kasım PR'larının hepsini merge etti, GitHub Pages'i açtı (`/privacy/`, `/support/` 200). Elle cihaz testi şimdilik ertelendi.
- Yönetici (Claude Opus 5.5) "çift başlık hatası"nı inceledi: hata değil; ikinci satır Bugün ekranının tarih seçicisi, iOS'ta › oku Duo'nun adası altında kalıyordu.
- `sonnet-worker` → PR #43: `mobile/.maestro/design-tour.yaml` (35 numaralı görüntü), `subflows/back-from-push.yaml`, README satırı. `run.sh` varsayılan listesine eklenmedi. iOS (Duo, main release derlemesi) 3 koşu PASS; Android (Pixel 8 API 35, main release) soğuk yeniden başlatmadan sonra PASS — önceki iki koşu host yükünden çıkan sistem ANR penceresinde kaldı.
- Codex `gpt-6-luna` high (araştırma, salt okunur): SDK 58 paket önerileri (DEVIR.md'de özet).
- `opus-worker`: iki tasarım yönü (A "Sofra", B "Net") × üç ekran (Bugün, Katalog, Yemek detayı) maketi; tüm kcal değerleri `mobile/assets/catalog.json`'dan. İşçinin notları: kalan kcal 2.415 (çorba + bisküvi), Eti Form kaydında porsiyon yok (gram ile), RN'de Türkçe büyük harf için `toLocaleUpperCase('tr-TR')`, Android gölgeleri, sekme çubuğundaki "Ekle" eylemi.
- Açık: yön seçimi, standart iPhone runtime kararı, katalog marka normalleştirmesi, Duo ada çakışması.

## 2026-11-13 22:47 — kaydedilmemiş form uyarısı (T5)

- Kullanıcı kararı: kaydedilmemiş formdan çıkarken uyarı eklensin. `sonnet-worker` yazdı, yönetici iki platformda doğruladı.
- PR #42 (#41'e bağlı): `useUnsavedChangesGuard` (expo-router `usePreventRemove`); özel yemek, profil düzenleme, kayıt düzenleme ve kilo formunda değer açılıştakinden farklıysa "Kaydedilmemiş değişiklikler — Düzenlemeye devam et / Çık". Kaydet/sil sonrası yönlendirme engellenmez; onboarding'e eklenmedi. Birim testleri 329/329.
- Maestro: yeni `unsaved-changes.yaml`. İlk iOS koşusunda iki hata: işçinin iOS geri butonu tahmini yanlıştı (özel yemek iOS'ta modal, geri butonu yok; aşağı kaydırma ile düzeltildi) ve `settings.yaml` "Tüm verileri sil"e sekme çubuğunun altından dokunuyordu (`centerElement` ile düzeltildi). Son durum: Android 9/9 + android-back, iOS 9/9.

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
