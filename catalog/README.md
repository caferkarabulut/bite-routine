# Katalog veri hattı

Uygulamaya gömülen gıda kataloğu bu klasörde üretilir. Temel kural: **yapay zekâ yalnız tarif yazar; besin değerlerini her zaman program kaynak tablolardan hesaplar.** Hiçbir JSON dosyasına elle veya yapay zekâyla kcal/makro yazılmaz (paketli ürünler hariç; onlar Open Food Facts verisidir).

## Akış

```
dishes.json ──► recipes/<kategori>.json ──┐
                                          ├─► scripts/build-catalog ──► dist/catalog.json
ingredients.json (anahtar → USDA FDC) ────┤
sources/usda-*.json (30 temel gıda) ──────┤
packaged/off-tr.json (Open Food Facts) ───┘
```

| Dosya | Sahibi | İçerik |
| --- | --- | --- |
| `dishes.json` | Liste ajanı | Yemek listesi |
| `recipes/<kategori>.json` | Tarif ajanları (her kategori tek sahip) | Ev tarifleri |
| `ingredients.json` | Eşleştirme ajanı | Malzeme anahtarı → USDA FDC kaydı |
| `scripts/**` | Hesap ajanı | İndirme, arama, hesaplama, doğrulama ve testler |
| `packaged/**` | Paketli ürün ajanı | Open Food Facts Türkiye süzmesi |
| `sources/**` | Değişmez | Eski API'nin doğrulanmış 30 USDA gıdası ve porsiyonları |
| `.cache/` | Git dışı | İndirilen ham veri |

Betikler Node 24 ile bağımlılıksız çalışır (`node --test`, yerleşik `fetch`, sistemdeki `unzip`).

## Kategoriler

| Anahtar | Ad | Hedef sayı |
| --- | --- | ---: |
| `corba` | Çorbalar | 10 |
| `baklagil` | Baklagil yemekleri | 7 |
| `kahvalti` | Kahvaltılıklar ve yumurta | 10 |
| `et-tavuk` | Et, tavuk, köfte ve kebaplar | 13 |
| `pilav-makarna` | Pilav, makarna, bulgur, mantı | 9 |
| `sebze-zeytinyagli` | Sebze yemekleri ve zeytinyağlılar | 12 |
| `salata-meze` | Salata ve mezeler | 11 |
| `hamur-isi` | Börek, pide, lahmacun, simit, poğaça | 12 |
| `tatli` | Tatlılar | 10 |
| `icecek` | Ayran, çay, Türk kahvesi, şalgam vb. | 6 |

## `dishes.json`

```json
{
  "version": 1,
  "dishes": [
    {
      "id": "mercimek-corbasi",
      "category": "corba",
      "nameTr": "Mercimek çorbası",
      "nameEn": "Red lentil soup",
      "aliases": ["süzme mercimek çorbası"],
      "servingKind": "bowl"
    }
  ]
}
```

- `id`: küçük harf, ASCII, tireli; benzersiz.
- `servingKind`: `bowl` (kase/kepçe), `plate` (tabak), `piece` (adet: lahmacun, simit, köfte), `slice` (dilim: börek, baklava), `glass` (bardak/fincan).

## `recipes/<kategori>.json`

```json
{
  "version": 1,
  "category": "corba",
  "recipes": [
    {
      "dishId": "mercimek-corbasi",
      "servings": 6,
      "ingredients": [
        { "key": "kirmizi-mercimek-kuru", "nameTr": "Kırmızı mercimek (kuru)", "grams": 250 },
        { "key": "sogan-kuru", "nameTr": "Kuru soğan", "grams": 100 },
        { "key": "su", "nameTr": "Su", "grams": 1500 }
      ],
      "cookedWeightGrams": 1650,
      "portions": [
        { "id": "kepce", "nameTr": "1 kepçe", "nameEn": "1 ladle", "grams": 200 },
        { "id": "kase", "nameTr": "1 kase", "nameEn": "1 bowl", "grams": 300 }
      ],
      "assumptions": "Ev usulü, tereyağlı; buharlaşma ~%15.",
      "confidence": "medium"
    }
  ]
}
```

- Malzeme gramları **çiğ / kuru hâliyle** ve yenilebilir kısım içindir (kemik, kabuk hariç). Hacim ölçüleri grama çevrilir (1 su bardağı su = 200 g, 1 yemek kaşığı yağ ≈ 13 g, 1 tatlı kaşığı tuz ≈ 5 g).
- Su ve tuz da malzemedir; pişmiş ağırlık hesabının doğru olması için tarifteki tüm su yazılır.
- `cookedWeightGrams`: tencereden çıkan toplam yenilebilir ağırlık (buharlaşma, kuruyemiş/pilav su çekmesi dahil). Fırın/kızartma ürünlerinde pişmiş toplam ağırlık.
- `portions`: en az bir ev ölçüsü; `piece`/`slice` yemeklerinde `"id": "adet"` veya `"dilim"` ile bir parçanın gramı.
- `confidence`: `high` (yaygın, tutarlı tarif), `medium`, `low` (bölgesel farkı büyük).
- **Kalori, protein, karbonhidrat veya yağ alanı yazılmaz.**

### Malzeme anahtarları

Aşağıdaki anahtarlar uygunsa aynen kullanılır; yenisi gerekiyorsa aynı biçimde (`<gıda>-<durum>`) eklenir. Eşleştirme ajanı tüm anahtarları sonradan USDA kayıtlarına bağlar.

`su`, `tuz`, `karabiber`, `pul-biber`, `kimyon`, `nane-kuru`, `seker`, `zeytinyagi`, `aycicek-yagi`, `tereyagi`, `sogan-kuru`, `sarimsak`, `domates`, `domates-salcasi`, `biber-salcasi`, `sivri-biber`, `kapya-biber`, `patates`, `havuc`, `limon-suyu`, `maydanoz`, `dereotu`, `kirmizi-mercimek-kuru`, `yesil-mercimek-kuru`, `nohut-kuru`, `kuru-fasulye-kuru`, `pirinc-kuru`, `bulgur-kuru`, `sehriye-kuru`, `makarna-kuru`, `un-bugday`, `yumurta`, `sut-tam-yagli`, `yogurt-tam-yagli`, `beyaz-peynir`, `kasar-peyniri`, `dana-kiyma-orta-yagli`, `dana-kusbasi`, `kuzu-eti`, `tavuk-gogsu`, `tavuk-but`, `sucuk`, `patlican`, `kabak`, `ispanak`, `pirasa`, `taze-fasulye`, `bamya`, `lahana`, `marul`, `salatalik`, `ceviz-ici`, `fistik-antep`, `irmik`, `nisasta-misir`, `yufka`, `maya-kuru`.

## `ingredients.json`

```json
{
  "version": 1,
  "ingredients": {
    "kirmizi-mercimek-kuru": { "fdcId": 172420, "dataType": "SR Legacy", "description": "Lentils, pink or red, raw", "note": "" }
  }
}
```

Her anahtar tek bir USDA kaydına bağlanır. Tam karşılık yoksa en yakın kayıt seçilir ve `note` alanında fark açıklanır (ör. beyaz peynir için feta). Su için `"fdcId": null, "zero": true`.

## `packaged/off-tr.json`

```json
{
  "version": 1,
  "source": "Open Food Facts",
  "license": "ODbL 1.0 (veritabanı), DbCL 1.0 (içerik)",
  "retrievedAt": "2026-11-13",
  "products": [
    {
      "code": "8690000000000",
      "nameTr": "Ürün adı",
      "brand": "Marka",
      "quantity": "500 g",
      "servingGrams": 30,
      "per100g": { "kcal": 0, "protein": 0, "carbs": 0, "fat": 0 }
    }
  ]
}
```

## Çıktı: `dist/catalog.json`

Uygulamanın okuduğu tek dosya. Her kayıt: `id`, `kind` (`dish` | `food` | `packaged`), `category`, `nameTr`, `nameEn`, `aliases`, `per100g` (`kcal`, `protein`, `carbs`, `fat`; eksik değer `null`), `portions` (`id`, `nameTr`, `nameEn`, `grams`), `source` (yemekler için tarif ve kullanılan FDC kimlikleri; ürünler için Open Food Facts barkodu). Değerler yalnız son adımda bir ondalığa yuvarlanır.
