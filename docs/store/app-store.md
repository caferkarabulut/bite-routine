# App Store Connect

Türkçe ana mağaza dili `tr-TR`, İngilizce yerelleştirme `en-US`. Yayın alanı Türkiye'dir. Sınırlı alan sayımları aşağıdaki gibi verilmiştir; Apple keywords için sınır UTF-8 baytıdır. Sayaçlar alan içeriğini kapsar, tırnak işaretlerini kapsamaz.

## Ürün sayfası alanları

### tr-TR

- **Name** — `Bite Routine` (12/30 karakter)
- **Subtitle** — `Kalori ve öğün günlüğü` (22/30 karakter)
- **Promotional Text** — `Türk yemekleri, temel gıdalar ve paketli ürünlerle öğünlerini gram veya ev ölçüsüyle kaydet.` (92/170 karakter)
- **Description** (1,770/4.000 karakter):

```text
Bite Routine, Türk mutfağına göre hazırlanmış ücretsiz bir kalori ve öğün günlüğüdür. Hesap açmadan günlük öğünlerini, su ve kilo kayıtlarını takip et.

• Profil bilgilerine göre günlük kalori ve protein hedefi oluştur; hedefi istersen düzenle.
• Bugün ekranında kalori, protein, karbonhidrat, yağ, öğün ve su toplamlarını gör.
• Türk yemekleri, temel gıdalar ve Türkiye'deki paketli ürünler arasında Türkçe ara. Barkod tarama yoktur.
• Yediklerini gramla veya kepçe, tabak ve adet gibi ev ölçüleriyle kaydet.
• Kendi yiyeceklerini ekle; favorilerini ve son 7 günün özetini görüntüle.
• Kilo kayıtlarını grafikte izle ve yerel hatırlatıcılar kur.
• Verilerini bir dosyaya aktar, sistem paylaşım menüsünden istediğin yere kaydet veya dosya seçerek geri yükle.
• Arayüz dilini Türkçe ve İngilizce arasında değiştir. Ayarlardan cihazındaki tüm uygulama verilerini silebilirsin.

Gizlilik
Hesap, sunucu, reklam, abonelik, analiz veya takip SDK'sı yoktur. Profilin, günlüğün, su ve kilo kayıtların, favorilerin ve kendi eklediğin yiyecekler cihazındaki SQLite veritabanında kalır. Yedek dosyası yalnızca sen dışa aktarmayı başlatıp paylaşım menüsünde bir hedef seçtiğinde paylaşılır; uygulama dosyayı kendi başına bir sunucuya yüklemez.

Besin kaynakları ve sağlık bilgisi
Türk yemeklerinin yaklaşık besin değerleri standart ev tariflerindeki malzemeler kullanılarak USDA FoodData Central (CC0) verisinden programla hesaplanır. Paketli ürün bilgileri Open Food Facts katkıcılarından gelir ve Open Database License (ODbL) kapsamındadır. © Open Food Facts katkıcıları.

Besin değerleri yaklaşıktır ve tıbbi tavsiye değildir. Gerçek değerler malzemeye, tarife ve porsiyona göre değişebilir. Sağlık, beslenme veya kilo hedefleriyle ilgili kararlar için bir sağlık uzmanına danış.
```

- **Keywords** — `kalori,öğün,günlük,beslenme,yemek,protein,su,kilo,tarif,porsiyon,yiyecek,makro` (83 UTF-8 bayt/100 bayt)

### en-US

- **Name** — `Bite Routine` (12/30 characters)
- **Subtitle** — `Calorie & meal diary` (20/30 characters)
- **Promotional Text** — `Log Turkish dishes, basic foods and packaged products by gram or household portion.` (83/170 characters)
- **Description** (1,746/4,000 characters):

```text
Bite Routine is a free calorie and meal diary built around Turkish cuisine. Track meals, water and weight without creating an account.

• Get a daily calorie and protein goal based on your profile, and edit the goal if you want.
• See calories, protein, carbohydrates, fat, meals and water on the Today screen.
• Search Turkish dishes, basic foods and packaged products from Türkiye. There is no barcode scanning.
• Log food by gram or household portions such as a ladle, plate or piece.
• Add custom foods, save favorites and review a 7-day summary.
• View weight entries in a chart and set local reminders.
• Export your data to a file, save it where you choose through the system share sheet, or restore a file you select.
• Switch the interface between Turkish and English. Delete all app data on your device in Settings.

Privacy
There is no account, server, advertising, subscription, analytics or tracking SDK. Your profile, diary, water and weight entries, favorites and custom foods stay in the local SQLite database on your device. A backup file is shared only after you start an export and choose a destination in the system share sheet; the app does not upload it to a server by itself.

Nutrition sources and health information
Approximate nutrition values for Turkish dishes are calculated by the app from standard home-recipe ingredients using USDA FoodData Central data (CC0). Packaged product information comes from Open Food Facts contributors under the Open Database License (ODbL). © Open Food Facts contributors.

Nutrition values are approximate and are not medical advice. Actual values vary with ingredients, recipes and portions. Consult a health professional about decisions concerning your health, diet or weight goals.
```

- **Keywords** — `calorie,meal,diary,food,turkish,protein,water,weight,recipe,portion,nutrition` (77 UTF-8 bytes/100 bytes)

## URL alanları

- **Support URL:** `https://caferkarabulut.github.io/bite-routine/support/`
- **Privacy Policy URL:** `https://caferkarabulut.github.io/bite-routine/privacy/`
- **Marketing URL (optional):** `https://github.com/caferkarabulut/bite-routine`

Apple'ın destek URL'si açıklaması URL'nin kullanıcıların iletişim kurabileceği gerçek iletişim bilgilerine yönelmesini bekliyor. Mevcut destek sayfası GitHub Issues'a yönlendiriyor; gönderim öncesi Apple gereksinimini karşıladığını uygulama sahibi doğrulasın.

## App Privacy

**Önerilen yanıt:** “No, we do not collect data from this app.” Uygulama ve bütünleşik SDK'lar son derlemede de kullanıcı verisini cihaz dışına göndermiyorsa bu yanıtı seçin. Apple'a göre yalnız cihazda işlenen ve uygulama dışına aktarılmayan veri için veri türü beyanı yapılmaz.

| App Store Connect veri türü | Toplanıyor mu? | Gerekçe |
| --- | --- | --- |
| Contact Info (iletişim bilgileri) | Hayır | Uygulama hesap veya iletişim bilgisi istemez; sunucuya veri göndermez. |
| Health & Fitness (sağlık ve fitness) | Hayır | Profil, kalori/öğün günlüğü, su ve kilo kayıtları yalnız cihazdaki SQLite'ta kalır. |
| Financial Info (finansal bilgiler) | Hayır | Ödeme, finans veya abonelik yoktur. |
| Location (konum) | Hayır | Konum alınmaz. |
| Sensitive Info (hassas bilgiler) | Hayır | Uygulama hassas bilgi toplamaz veya göndermez. |
| Contacts (kişiler) | Hayır | Kişi listesine erişilmez. |
| User Content (kullanıcı içeriği) | Hayır | Günlük kayıtları, favoriler ve özel yiyecekler cihazda kalır; geliştiriciye gönderilmez. |
| Browsing History (tarama geçmişi) | Hayır | Uygulama içi web taraması yoktur. Kaynak bağlantıları harici tarayıcıda açılır. |
| Search History (arama geçmişi) | Hayır | Katalog aramaları cihazda işlenir ve gönderilmez. |
| Identifiers (tanımlayıcılar) | Hayır | Reklam/takip kimliği veya kullanıcı hesabı kullanılmaz. |
| Purchases (satın almalar) | Hayır | Satın alma veya abonelik yoktur. |
| Usage Data (kullanım verisi) | Hayır | Analiz veya kullanım izleme SDK'sı yoktur. |
| Diagnostics (tanılama) | Hayır | Çökme raporlama veya tanılama SDK'sı yoktur. |
| Other Data (diğer veriler) | Hayır | Ayarlar ve hatırlatıcılar cihazda kalır; uygulama dışına iletilmez. |
| Kullanıcının dışa aktardığı yedek dosyası | Uygulama tarafından toplanmıyor/paylaşılmıyor | Kullanıcı dışa aktarmayı başlatır ve iOS paylaşım menüsünde hedefi seçer. Hedef uygulama veya hizmete aktarım kullanıcının seçtiği sistem işlemiyle olur; Bite Routine bunu kendiliğinden iletmez. |

Geliştirici/SDK davranışı değişirse App Privacy yanıtı yeniden değerlendirilmelidir. Gizlilik politikası bağlantısı zorunludur.

## Yaş derecelendirmesi anketi

Apple yanıtları anketten hesaplar; aşağıdakiler mevcut içerik ve özelliklere göre önerilen yanıtlardır, puan garantisi değildir.

| Konu / özellik | Önerilen yanıt |
| --- | --- |
| Şiddet, korku, cinsellik/çıplaklık, küfür, uyuşturucu, kumar, yarışma/şans, kullanıcı içeriği ve sosyal özellikler | Yok / Never |
| Sınırsız web erişimi | Yok. Uygulama içindeki kaynak bağlantıları harici tarayıcıyı açar. |
| Ebeveyn denetimi veya yaş doğrulama | Yok |
| Tıbbi veya tedavi bilgisi | Yok. Uygulama tanı/tedavi sunmaz; beslenme ve kalori takibi yapar. Açıklamadaki sağlık uyarısını koruyun. |
| Made for Kids | Hayır. Uygulama 13 yaş altına yönelik değildir. |
| Beklenen sonuç | Anket sonucu atanır; düşük içerik derecesi beklenebilir ancak kesin yaş etiketi doğrulanamaz. |

## Kategori önerisi

- **Primary:** Health & Fitness — temel kullanım kalori, öğün, su ve kilo günlüğüdür.
- **Secondary:** Food & Drink — Türk mutfağı ve gıda kataloğu ikincil işlevdir.

## Export compliance / şifreleme

**Yanıt: muaf / standart dışı şifreleme yok.** Uygulama hiçbir ağ çağrısı yapmaz ve kendi şifreleme kodunu içermez; yalnız işletim sisteminin sağladığı muaf şifrelemeyi kullanabilir. Bu yüzden `mobile/app.json` içinde `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` ayarlıdır ve App Store Connect her derlemede şifreleme sorusunu ayrıca sormaz. Şifreleme kullanan yeni bir bağımlılık (ör. özel kripto kütüphanesi ya da ağ istemcisi) eklenirse bu yanıt ve ayar yeniden değerlendirilir.

## Apple inceleme notları

```text
No login or account is required. The app works offline and stores profile, diary, water, weight, favorites and custom foods locally on the device in SQLite.

To review: complete the profile setup, open Today, search the food catalog, add a food by grams or household portion, and view the 7-day history and weight chart. Settings contains local reminders, language selection, backup/export, restore and Delete All Data. A restore can be tested with a JSON backup created from the app using the share sheet.

Nutrition values are approximate and are not medical advice. Dish values are calculated from standard home recipes using USDA FoodData Central (CC0). Packaged product data is from Open Food Facts contributors (ODbL); attribution is included in the app and listing.
```

## Resmi kaynaklar

Erişim tarihi: 13 Kasım 2026.

- [App information: name, subtitle, privacy URL](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information/)
- [Product page: promotional text, description, keywords](https://developer.apple.com/app-store/product-page/)
- [Platform version information: description and 100-byte keyword limit](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information)
- [Manage app privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/)
- [Set an app age rating](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating)
- [Age rating values and definitions](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions)
- [Overview of export compliance](https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance/)
- [App Store categories](https://developer.apple.com/app-store/categories/)
