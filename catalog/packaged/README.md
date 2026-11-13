# Paketli ürünler (Open Food Facts, Türkiye)

`off-tr.json`, Open Food Facts'in Türkiye'de satılan ürünlerinin süzülmüş hâlidir.

## Özet

- Alınma tarihi: 2026-11-13
- Benzersiz indirilen ürün: 4448 (Türkiye için OFF toplamı ~12.100; anonim v2 arama 1000 sonuç sınırı nedeniyle Nutri-Score bölümlerine ayrılarak çekildi, Nutri-Score'u olmayan ~8570 ürünün yalnız bir kısmı alınabildi)
- Tutulan ürün: 2455 (porsiyon gramı bilinen: 926; kJ'den çevrilen: 11; sıvı/ml ambalajlı: 450)

| Eleme nedeni | Adet |
| --- | ---: |
| Ad yok | 936 |
| kcal/protein/karbonhidrat/yağ eksik | 580 |
| Ad Türkçe değil (Türkçe ad yok; dil tr değil / Latin dışı) | 284 |
| Atwater tutarsızlığı | 83 |
| Aynı marka+ad, farklı barkod | 79 |
| Ad kod benzeri | 19 |
| Geçersiz barkod | 6 |
| kcal 0-900 dışında | 3 |
| Protein+karbonhidrat+yağ > 105 g | 2 |
| Makro 0-100 g dışında | 1 |

## Kurallar

- Ad: `product_name_tr`; yoksa `product_name` yalnız dil `tr` ise veya Türkçe harf içerip Latin alfabesindeyse. Boş ve kod benzeri adlar elenir.
- Değerler yalnız `*_100g` (hazırlanmış/`_prepared` değil). kcal, protein, karbonhidrat, yağ dördü de sayısal olmalı. Yalnız kJ varsa kcal = kJ / 4,184.
- Aralıklar: kcal 0-900, her makro 0-100 g, protein+karbonhidrat+yağ <= 105 g.
- Atwater: |kcal - (4p + 4c + 9f)| <= max(25, kcal x %20). Alkol varsa 7 kcal/g eklenir, polyol varsa alt sınır 1,6 kcal/g gevşetilir.
- İçecekler: Open Food Facts 100 ml ve 100 g değerlerini aynı alanda tutar. Su bazlı içeceklerde 100 ml ~ 100 g kabul edilir; ayrıca yoğunluk düzeltmesi yapılmaz (yağ, bal, şurup gibi yoğun sıvılarda küçük sapma olabilir). Ambalajı ml olan ürünler `quantity` alanından ayırt edilir.
- `servingGrams`: `serving_quantity` gram biriminde ve 1-1000 arasındaysa, değilse `null`.
- Aynı barkod tek kayıt; aynı marka+ad farklı barkodla geliyorsa en dolu kayıt tutulur. Marka -> ad sırasıyla (tr) sıralanır.

## Lisans ve atıf

Veri: Open Food Facts katkıcıları, ODbL. Kaynak: https://world.openfoodfacts.org
Veritabanı ODbL 1.0, tek tek içerik DbCL 1.0 lisanslıdır; türev veritabanı da aynı koşullarla paylaşılmalı ve uygulamada atıf gösterilmelidir.

## Yeniden çalıştırma

```
node catalog/packaged/fetch-off.mjs        # ~20 dk; .cache/off/ içine sayfa sayfa indirir, kaldığı yerden devam eder (--refresh: baştan)
node catalog/packaged/filter-off.mjs       # off-tr.json ve bu README'yi üretir
node --test catalog/packaged/
```
