# Katalog verisi nasıl üretildi

Bite Routine'in yemek kataloğu, birden fazla yapay zekâ ajanının paralel çalıştığı ve her sayının kaynak tablolardan hesaplandığı bir veri hattıyla üretildi. Bu belge süreci ve alınan önlemleri anlatır. Teknik formatlar: [catalog/README.md](../catalog/README.md).

## Temel ilke

Dil modelleri besin değeri uydurmaya yatkındır ve aynı soruya farklı sayılar verebilir. Bu yüzden iş ikiye ayrıldı:

- **Ajanlar yalnız tarif yazar:** malzeme ve gramı, pişmiş toplam ağırlık, kepçe/tabak/adet gram karşılıkları.
- **Sayıları program hesaplar:** her malzeme bir USDA FoodData Central kaydına (CC0) bağlanır; yemeğin 100 g ve porsiyon değerleri bu kayıtlardan toplanır. Tarif dosyalarında kalori veya makro alanı bulunursa derleme hata verir.

## Ajanlar ve dosya sahipliği

Ajanlar aynı anda çalıştı; çakışmayı önlemek için her ajana önceden yalnız kendi dosyaları atandı ve hiçbir dosyanın iki sahibi olmadı.

| Adım | Ajan | Çıktı |
| --- | --- | --- |
| 1 | Liste | `catalog/dishes.json`: 10 kategoride 100 yaygın Türk yemeği |
| 2 | 4 tarif ajanı (paralel) | `catalog/recipes/<kategori>.json`: her kategori tek ajanda |
| 2 | Hesap programı | `catalog/scripts/`: USDA toplu verisini indirme, arama, hesaplama, doğrulama, testler |
| 2 | Temel gıdalar | `catalog/base-foods.json`: 50 tek malzemeli gıda (ekmek, zeytin, peynirler, meyveler) |
| 2 | Paketli ürünler | `catalog/packaged/`: Open Food Facts Türkiye süzmesi; 4.448 indirilen üründen ad, dört temel besin, aralık ve enerji tutarlılığı kontrolünden geçen 2.455'i |
| 3 | Eşleştirme | `catalog/ingredients.json`: 99 malzeme anahtarı → USDA kaydı; yaklaşık eşleşmeler gerekçeli |
| 4 | Bağımsız denetim | Farklı bir sağlayıcının modeli tarifleri ve hesaplanan değerleri yalnız okuma izniyle denetledi |
| 5 | Koordinatör | Bulguları doğruladı, düzeltmeleri uyguladı, testleri ve katı derlemeyi çalıştırdı |

## Doğrulama

- Derleme; bilinmeyen kategori, eksik tarif, eşleşmemiş malzeme, sıfır/negatif gram, gerçek dışı pişme verimi (çiğ ağırlığa oranı 0,3–2,5 dışı), 0–900 kcal dışı değer ve tariflerde besin alanı gibi durumlarda hata verir; enerji ile makrolar uyuşmazsa (Atwater 4/4/9 kontrolü) uyarır.
- Bağımsız denetim 100 yemekten 95'ini makul buldu; 4 tarif için girdi düzeltmesi önerdi. Koordinatör bunları ve ayrıca kızartma yağı yüksek kalan 3 sebze yemeğini düzeltti. Örnek: Adana kebapta ızgarada damlayan yağ çiğ hesapla modellenemediği için et, USDA'nın pişmiş ızgara kuzu kıyma kaydıyla hesaplandı (140 g porsiyon 725 → 390 kcal).
- CI her değişiklikte testleri çalıştırır, USDA verisini yeniden indirip kataloğu sıfırdan üretir ve depodaki `dist/catalog.json` ile birebir aynı olduğunu kontrol eder.

## Sınırlar

Değerler standart bir ev tarifine göre yaklaşıktır; tarifler aileden aileye değişir. Bazı Türk ürünlerinin USDA'da birebir karşılığı yoktur (kaşar ≈ provolone, sucuk ≈ kuru salam, tarhana ≈ tam buğday unu); bu eşleşmeler `ingredients.json` ve `base-foods.json` içinde notla belirtilir. Uygulama değerlerin yaklaşık olduğunu ve tıbbi tavsiye olmadığını gösterir.
