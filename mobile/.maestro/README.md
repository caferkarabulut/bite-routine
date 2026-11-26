# Maestro UI testleri

Bite Routine'in uçtan uca iOS akışları. Her akış bağımsızdır: `launchApp` + `clearState` ile boş uygulamayla başlar,
gerekirse `subflows/onboarding.yaml` ile profil oluşturur. Seçiciler Türkçe metne ve birkaç `testID`'ye dayanır,
bu yüzden cihaz dili Türkçe olmalıdır (`settings.yaml` dili geçici olarak İngilizceye çevirip geri alır).

## Hazırlık

1. Maestro 2.x ve Java 17+ (`brew install maestro`).
2. Simülatörde **Release** derlemesi kurulu olmalı (JS gömülü, Metro gerekmez):

   ```sh
   cd mobile
   export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
   npx expo run:ios -d <UDID> --configuration Release --no-bundler < /dev/null
   ```

   Uygulama kodu (testID dahil) değişirse yeniden derle ve kur.
3. Simülatör Türkçe dilde açık olmalı.

## Çalıştırma

```sh
# Hepsi (mobile/ klasöründen). Ekran görüntüleri ve günlükler .maestro/screenshots/<zaman>/ altına yazılır.
.maestro/run.sh <UDID>
.maestro/run.sh <UDID> add-food water      # yalnız seçilenler

# Doğrudan Maestro ile
maestro test --device <UDID> .maestro                       # klasördeki tüm akışlar (config.yaml)
maestro test --device <UDID> --test-output-dir .maestro/screenshots .maestro/water.yaml
```

Aynı cihaza aynı anda iki Maestro çalıştırma; akışlar birbirinin durumunu bozar.

## Akışlar

| Dosya | Ne doğrular |
| --- | --- |
| `onboarding.yaml` | Profil formu (1996, Erkek, 178, 78,5), canlı hedef önizlemesi, Başla, Bugün sekmesi |
| `add-food.yaml` | Kahvaltıya 1,5 kepçe Mercimek çorbası ekler; kcal toplamı ve öğün satırı |
| `android-back.yaml` | Yalnız Android geri tuşu: onboarding, Bugün kökü, katalog/detay/özel yemek, silme penceresi. iOS'ta adımlar atlanır; `run.sh` varsayılan listesinde yok (`.maestro/run.sh <UDID> android-back`) |
| `search-turkish.yaml` | `kisir` → Kısır, `cay` → iki çay, `içim` / `eti` → paketli ürün |
| `edit-delete-entry.yaml` | Kaydın miktarını değiştirir, doğrular, onayla siler |
| `custom-food.yaml` | Kendi yemeğini (makro + porsiyon) oluşturur, "Yemeklerim"de bulup günlüğe ekler |
| `unsaved-changes.yaml` | Kendi yemeği formunda yazılmış metinle geri: "Kaydedilmemiş değişiklikler" sorusu; "Düzenlemeye devam et" formda bırakır, "Çık" kataloğa döner; boş formdan sorusuz çıkış. Android'de `pressKey: back`, iOS'ta başlıktaki geri düğmesi (`subflows/go-back.yaml`) |
| `water.yaml` | +200 ml, +500 ml, toplam, son eklemeyi geri alma |
| `history-weight.yaml` | Geçmiş'te günün kcal'i, Kilo ekranında 78,0 kaydı |
| `settings.yaml` | Dil TR/EN/TR, su hedefi, "SİL" ile tüm verileri silip onboarding'e dönüş |

Yedekle/Geri yükle (paylaşım ve dosya seçici) ve bildirim izni akışları kapsam dışıdır; sistem diyaloglarına bağlıdırlar.

## Bilinen tuzaklar (akışlar bunlara göre yazıldı)

- **Sayı tuşu takımı**: ondalık/sayı klavyesinde return tuşu yoktur; `hideKeyboard` çalışmaz ve dışarı dokunmak
  klavyeyi kapatmaz. Klavye açıkken ekranın alt yarısını kaplar ve oradaki dokunuşlar tuşlara gider
  (örn. "Günlüğe ekle" yerine "0" yazılır). `subflows/dismiss-keyboard.yaml` Enter basar ve klavyenin
  kaybolmasını bekler. Klavyenin altında kalan bir hedefe dokunmadan önce bunu çağır.
- **Sekme çubuğu**: sekmelerin erişilebilirlik adı `Katalog, tab, 2 of 4` biçimindedir; `"Katalog, tab.*"` kullan.
- **Alttaki içerik**: Bugün'de öğün kartları ve su kartı sekme çubuğunun altında başlar. Dokunmadan önce
  `scroll` / `scrollUntilVisible` kullan, yoksa dokunuş bir sekmeye gider. `scrollUntilVisible` ekran sınırında
  olan ama klavyenin altında kalan öğeyi "görünür" sayar.
- **Kaydırma konumu**: Bugün'e dönüşte kaydırma konumu korunur; üstteki toplamlar için önce
  `scrollUntilVisible: Kalori, direction: UP`.
- Porsiyon adları sayı içerir (`1 kepçe`), Bugün satırı bu yüzden `1,5 1 kepçe` okunur.
- Maestro 2.12'de `takeScreenshot` yolu çıktı klasörüne göre çözülür; `--test-output-dir` verilmezse
  görüntüler `~/.maestro/tests/<zaman>/<akış>/takeScreenshot/` altına gider.

## testID listesi

`onboarding-birth-year`, `onboarding-height`, `onboarding-weight`, `add-breakfast|lunch|dinner|snack`,
`catalog-search`, `amount-input`, `add-to-diary`, `custom-name`, `custom-kcal`, `custom-protein`, `custom-carbs`,
`custom-fat`, `custom-portion-name-N`, `custom-portion-grams-N`, `weight-input`, `water-goal-input`, `delete-all-input`.
