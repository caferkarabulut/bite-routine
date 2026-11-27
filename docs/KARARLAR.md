# Bite Routine — kararlar

Mimari ve ürün kararları, en yeni karar en üstte. Eski karar silinmez: karar değişince yeni satır eklenir, eskisinin sonuna "(yerine geçti: YYYY-MM-DD)" yazılır.

| Tarih | Karar | Neden | Ayrıntı |
|---|---|---|---|
| 2026-11-27 | Destek ve gizlilik sayfaları ayrı public repoda yayımlanır (`caferkarabulut/bite-routine-site`, adres `caferkarabulut.github.io/bite-routine-site/`); kod reposu private olur. Destek kanalı yalnız e-posta; sayfalardan açık kaynak ve GitHub Issues bağlantıları çıkarıldı; Ayarlar > Gizlilik'teki GitHub düğmesi gizlilik politikası bağlantısı oldu; App Store Marketing URL boş | Kullanıcı kararı (GitHub Pro yerine ücretsiz, aboneliğe bağlı olmayan yol) | `docs/store/`, `mobile/src/features/settings/PrivacyScreen.tsx` |
| 2026-11-27 | v1 hesapsız çıkar; yedek sağlamlaştırılır: Android otomatik yedeğinin veritabanını kapsadığı doğrulanır, iOS'ta kullanıcının iCloud'una günlük otomatik yedek ve ilk açılışta "yedeğin bulundu" geri yükleme, elle JSON yedek kalır, Ayarlar'da "son yedek" gösterilir. Hesap (Apple + Google ile giriş) FUTURE | Kullanıcı kararı yöneticiye bıraktı; piyasada gizlilik odaklı hesapsız uygulamalar var, telefon değişimi kullanıcının kendi hesabıyla giriş ekranı olmadan çözülüyor, hesap KVKK/hesap silme/sunucu yükü getiriyor | [`docs/arastirma/2026-11-27-hesap-ve-yedek.md`](arastirma/2026-11-27-hesap-ve-yedek.md) |
| 2026-11-27 | Açılış: önce yerel açılış ekranı açık yeşil (#7E9C78) zeminde F6 çizimiyle; ardından uygulama içinde beyaz zeminde logo ve "Bite Routine" adı. Geçiş animasyonu sonraya bırakıldı | Kullanıcı kararı | Tuval "Marka" sayfası, Açılış 1–2 |
| 2026-11-27 | Mağaza görselleri Yön 2: koyu yeşil (#4A6647) zemin, krem başlık, ekran alttan taşar; App Store 1320×2868, Play 9:16 | Kullanıcı kararı | Tuval "Marka" sayfası |
| 2026-11-27 | Tanıtım ve mağaza metinlerinde katalogdaki yemek/ürün sayısı yazılmaz | Kullanıcı kararı; katalog büyüyecek, sayı eskir | `docs/marka/gen_marka2.py` metinleri |
| 2026-11-27 | Uygulama ikonu F6 "Yeşil sofra": açık yeşil (#7E9C78) zemin, krem tabakta ısırılmış susamlı simit, solda siyah kaşık, sağda siyah çatal | Kullanıcı kararı; yeşil zemin istendi, fitness uygulamasına benzememesi için yemek takımı; siyah çatal-kaşık koyu yeşilde küçük boyutta okunmadığı için açık yeşil | Tuval "Marka" sayfası; geometri `docs/marka/gen_marka.py` (`g_f4`, `LEAF`) |
| 2026-11-27 | Kullanıcı kendi ürününü (yiyecek/içecek) paket etiketinden girebilir; listede ve detayda "Senin eklediğin", değerler "resmi olarak doğrulanmadı" diye belirtilir; yalnız o telefonda saklanır | Kullanıcı kararı; ürün çeşitliliği (yalnız o kullanıcı için; sunucu yok) | `CustomFoodScreen.tsx`, maket `U-UrunEkle` |
| 2026-11-27 | Kendi ürününde ad, kcal, protein, karbonhidrat, yağ zorunlu; marka ve porsiyon isteğe bağlı; değerler 100 g ya da porsiyon için girilebilir (100 g'a çevrilir) | Kullanıcı kararı ("bazı değerler zorunlu") | `nutritionBasis.ts` |
| 2026-11-27 | İçecekler 100 ml için girilir, hesapta 1 ml = 1 g sayılır | Kullanıcı yöneticinin önerisini onayladı | — |
| 2026-11-27 | Katalog boş aramada sıra: Kategoriler → "Kendi ürününü ekle" kartı → Son eklenenler (son 8 farklı ürün) | Kullanıcı kararı | `CatalogScreen.tsx` |
| 2026-11-27 | Bugün'de sağ altta "Ekle" düğmesi Katalog'u açar; öğün saate göre seçilir (05–11 kahvaltı, 11–16 öğle, 16–22 akşam, diğer atıştırmalık) | Kullanıcı kararı | `domain/meals.ts` |
| 2026-11-27 | Tüm ekranlarda başlık ortada 24 px; sol ok hep solda, sağ ok sağda; gerek yoksa yer boş tutulur | Kullanıcı kararı | `CenteredHeader` |
| 2026-11-27 | Profil kısa tek ekran: aktivite ve amaç açılır seçim, tek "Güncelle" her şeyi kaydeder; hatırlatıcılarda bildirim gönderileceği yazılır | Kullanıcı kararı | maket `S-Profil`, `S-Ayarlar` |
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
