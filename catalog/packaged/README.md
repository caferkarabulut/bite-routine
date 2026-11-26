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
- Görünen marka ve ad yazımı (yalnız `nameTr` ve `brand`; besin değeri, barkod, porsiyon, ambalaj miktarı değişmez; tekilleştirmeden sonra uygulanır):
  - Metinler NFC'ye çevrilir. Marka: Türkçe duyarlı anahtarla (büyük/küçük harf, I/İ/ı/i, ç ğ ö ş ü aksanı, noktalama ve boşluk katlanır) aynı markalar gruplanır (ETİ, ETI, Eti, eti -> tek marka). Grupta karışık harfli yazım varsa en sık olan, yoksa Türkçe başlık biçimi (ETİ -> Eti, ÇİFTÇİ -> Çiftçi). Grubun tüm yazımları tamamen büyük ve en çok 3 harfliyse (A101, 7UP) kısaltma sayılıp büyük bırakılır. Küçük alias tablosu (`BRAND_ALIASES`: BİM, ŞOK, A101, Anadolu Çiftliği) bu kuralların önüne geçer.
  - Ad: tamamen büyük ya da tamamen küçükse Türkçe başlık biçimine çevrilir (i -> İ, ı -> I; "ve", "ile", "veya" küçük kalır). Karışık harfli ad sahibinin yazımıyla kalır.
  - Tamamen büyük kelimedeki belirsiz ASCII "I" sırasıyla şöyle çözülür: kelimede ASCII "I" yoksa Türkçe kural (açık "İ" her zaman "i" kalır, aynı kelimedeki ASCII "I" aşağıdaki adımlarla çözülür); kelime alias tablosunda ya da veri sözlüğünde varsa oradaki yazım (sözlük: ürün ad/markalarındaki ve katalogdaki yemek/gıda adlarındaki doğru yazılmış kelimeler, foldKey anahtarıyla; en sık yazım, eşitlikte aksanlı; ASCII'ye indirgenmiş "CIFTLIGI" de "çiftliği" olur); kelimede ç ğ ö ş ü varsa ve ön ünlü (e i ö ü) yoksa "ı"; aksi hâlde varsayılan "i" (LIGHT -> Light). Sözlükte bulunmayıp "i" varsayımına düşen kelime sayısı filter-off çıktısında yazılır (`--list-fallback` ile liste).
  - Adda marka geçiyorsa marka kanonik yazımla (baş/son noktalamasıyla birlikte) yazılır: başlık biçimine çevrilen adlarda her yerde, diğerlerinde yalnız adın başında.
  - Sayıdan sonraki birimler: g, gr, gram, kg, mg, ml, cl, lt, litre küçük harf; litre simgesi büyük "L" (45 G -> 45 g, 750 Ml -> 750 ml, 1 l -> 1 L).
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
