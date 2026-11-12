# USDA katalog kaynak eşlemesi

Doğrulama tarihi: 15 Ekim 2026. 30 gıdanın her biri USDA FoodData Central **Food Details** API `/fdc/v1/foods` yanıtındaki tam `foodNutrients` kayıtlarından kontrol edildi. Arama özeti, eski CSV, porsiyon tablosu veya model tahmini kullanılmadı. Seçilen alanların ham miktarları, besin kimlikleri, birimleri, orijinal açıklamaları ve yayın tarihleri [kanıt dosyasında](usda-starter-foods.json) saklanır. Bu dosya tam API yanıtının seçilmiş alanlarından oluşur; ham miktarlar hassasiyet kaybetmemek için metindir. Çalışma zamanında API anahtarı veya USDA bağlantısı gerekmez.

## Birim, yöntem ve lisans

- USDA [alan tanımları](https://fdc.nal.usda.gov/docs/Download_Field_Descriptions_Oct2020.pdf), `food_nutrient.amount` alanını besinin **100 g yenilebilir kısmı** olarak tanımlar (s. 4). Ev ölçüsü/adet veya 100 ml değildir; süt dahil gramla kullanılır. Kabuk/kemik/çekirdek gibi yenmeyen kısımlar gramaja dahil edilmez.
- Enerji `1008` (kcal); protein `1003`, karbonhidrat (farktan hesaplanan) `1005`, toplam yağ `1004` (g). İki mevcut Foundation kaydında enerji `2047` (USDA Atwater genel faktörleri) seçilir; `2048` ile karıştırılmaz ve uygulama enerjiyi makrolardan yeniden üretmez. [Foundation belgesi](https://fdc.nal.usda.gov/Foundation_Foods_Documentation/) yöntemleri açıklar.
- Veritabanının mevcut iki ondalıklı alanlarına aktarırken yalnız son aşamada iki basamağa yuvarlanır (yarım yukarı). Eksik değer sıfır yapılmaz. Fuji elmanın yağ miktarı `0.1625 g`, API'de ayrıca `loq: 0.1` taşır; bu metadata kanıtta korunur, ölçüm sınırının altındaki bir sıfır olarak yorumlanmaz.
- [USDA API kılavuzu](https://fdc.nal.usda.gov/api-guide/) verileri kamu malı / CC0 olarak sunar. Kaynak: U.S. Department of Agriculture, Agricultural Research Service, FoodData Central. Kaynak bağlantıları mevcut uygulama yaklaşımıyla FDC kimliğine ve veri türüne göre resmî aramayı açar.

## Adlandırma sınırları

Feta, Türk beyaz peynirine eşitlenmez. Süt kaydı %3,25 yağlı ve D vitamini eklenmiş ABD kaydıdır; tüm yerel sütleri temsil etmez. Pişmiş bulgur yağlı pilav değildir. Makarna kuru ve zenginleştirilmemiştir. Izgara kıyma kaydı %85 yağsız et/%15 yağdan yapılmış yassı et parçasıdır; köfte tarifi veya çiğ kıyma olarak sunulmaz. Somon çiftlik Atlantik somonudur. Sade badem/ceviz içi, şekerli veya aromalı kuruyemişi temsil etmez. Geleneksel yemek veya tarif eklenmedi.

Mevcut sekiz FDC kimliği korunur. Önceki kaba yuvarlamalar ayrıntı yanıtıyla eşleştirildi (ör. yumurta proteini 12,60 → 12,56; mercimek karbonhidratı 20,10 → 20,13; tavuk proteini 31,00 → 31,02). Eski günlük kopyaları geçmiş değerlerini korur.

## Kayıtlar

Tüm sayılar 100 g yenilebilir gıda içindir. Sütunlar veritabanına alınan kcal/g değerleridir; yuvarlanmamış değerler kanıt dosyasındadır. Foundation kayıtları yoğurt ve Fuji elma; FNDDS kaydı pişmiş beyaz pirinç; diğerleri SR Legacy'dir.

| Türkçe ad | FDC kimliği / kaynak | Resmî açıklama | kcal | Protein g | Karbonhidrat g | Yağ g |
|---|---|---|---:|---:|---:|---:|
| Yumurta (çiğ) | [171287](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=171287) | Egg, whole, raw, fresh | 143.00 | 12.56 | 0.72 | 9.51 |
| Mercimek (haşlanmış, tuzsuz) | [172421](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=172421) | Lentils, mature seeds, cooked, boiled, without salt | 116.00 | 9.02 | 20.13 | 0.38 |
| Nohut (haşlanmış, tuzsuz) | [173757](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=173757) | Chickpeas (garbanzo beans, bengal gram), mature seeds, cooked, boiled, without salt | 164.00 | 8.86 | 27.42 | 2.59 |
| Yoğurt (sade, tam yağlı) | [2259793](https://fdc.nal.usda.gov/food-search?type=Foundation&query=2259793) | Yogurt, plain, whole milk | 77.95 | 3.82 | 5.57 | 4.48 |
| Fuji elma (çiğ, kabuklu) | [1750340](https://fdc.nal.usda.gov/food-search?type=Foundation&query=1750340) | Apples, fuji, with skin, raw | 64.66 | 0.15 | 15.65 | 0.16 |
| Beyaz pirinç (pişmiş, yağ eklenmemiş) | [2708408](https://fdc.nal.usda.gov/food-search?type=Survey%20%28FNDDS%29&query=2708408) | Rice, white, cooked, no added fat | 129.00 | 2.67 | 28.00 | 0.28 |
| Tavuk göğsü (derisiz, fırınlanmış) | [171477](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=171477) | Chicken, broilers or fryers, breast, meat only, cooked, roasted | 165.00 | 31.02 | 0.00 | 3.57 |
| Domates (çiğ) | [170457](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=170457) | Tomatoes, red, ripe, raw, year round average | 18.00 | 0.88 | 3.89 | 0.20 |
| Süt (%3,25 yağlı, D vitamini eklenmiş) | [171265](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=171265) | Milk, whole, 3.25% milkfat, with added vitamin D | 61.00 | 3.15 | 4.80 | 3.25 |
| Feta peyniri | [173420](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=173420) | Cheese, feta | 265.00 | 14.21 | 3.88 | 21.49 |
| Yulaf (pişirilmemiş) | [169705](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=169705) | Oats (Includes foods for USDA's Food Distribution Program) | 389.00 | 16.89 | 66.27 | 6.90 |
| Bulgur (pişmiş) | [170287](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=170287) | Bulgur, cooked | 83.00 | 3.08 | 18.58 | 0.24 |
| Tam buğday ekmeği (ticari) | [172688](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=172688) | Bread, whole-wheat, commercially prepared | 252.00 | 12.45 | 42.71 | 3.50 |
| Makarna (kuru, zenginleştirilmemiş) | [168927](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=168927) | Pasta, dry, unenriched | 371.00 | 13.04 | 74.67 | 1.51 |
| Atlantik somonu (çiftlik, çiğ) | [175167](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=175167) | Fish, salmon, Atlantic, farmed, raw | 208.00 | 20.42 | 0.00 | 13.42 |
| Sığır kıyması (%15 yağlı, yassı parça, üstten ızgara) | [174032](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=174032) | Beef, ground, 85% lean meat / 15% fat, patty, cooked, broiled | 250.00 | 25.93 | 0.00 | 15.41 |
| Patates (çiğ, kabuklu) | [170026](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=170026) | Potatoes, flesh and skin, raw | 77.00 | 2.05 | 17.49 | 0.09 |
| Havuç (çiğ) | [170393](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=170393) | Carrots, raw | 41.00 | 0.93 | 9.58 | 0.24 |
| Salatalık (çiğ, kabuklu) | [168409](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=168409) | Cucumber, with peel, raw | 15.00 | 0.65 | 3.63 | 0.11 |
| Kuru soğan (çiğ) | [170000](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=170000) | Onions, raw | 40.00 | 1.10 | 9.34 | 0.10 |
| Brokoli (çiğ) | [170379](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=170379) | Broccoli, raw | 34.00 | 2.82 | 6.64 | 0.37 |
| Ispanak (çiğ) | [168462](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=168462) | Spinach, raw | 23.00 | 2.86 | 3.63 | 0.39 |
| Muz (çiğ) | [173944](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=173944) | Bananas, raw | 89.00 | 1.09 | 22.84 | 0.33 |
| Portakal (çiğ) | [169097](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=169097) | Oranges, raw, all commercial varieties | 47.00 | 0.94 | 11.75 | 0.12 |
| Çilek (çiğ) | [167762](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=167762) | Strawberries, raw | 32.00 | 0.67 | 7.68 | 0.30 |
| Zeytinyağı (salata veya pişirme için) | [171413](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=171413) | Oil, olive, salad or cooking | 884.00 | 0.00 | 0.00 | 100.00 |
| Badem (iç) | [170567](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=170567) | Nuts, almonds | 579.00 | 21.15 | 21.55 | 49.93 |
| Ceviz (İngiliz cevizi, iç) | [170187](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=170187) | Nuts, walnuts, english | 654.00 | 15.23 | 13.71 | 65.21 |
| Mercimek (kuru, pişirilmemiş) | [172420](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=172420) | Lentils, raw | 352.00 | 24.63 | 63.35 | 1.06 |
| Beyaz fasulye (kuru, pişirilmemiş) | [175202](https://fdc.nal.usda.gov/food-search?type=SR%20Legacy&query=175202) | Beans, white, mature seeds, raw | 333.00 | 23.36 | 60.27 | 0.85 |

Adet/ev ölçüleri ve kaynak amount normalizasyonu ayrı [ölçü sözleşmesinde](food-portions-contract.md) belgelenmiştir; yukarıdaki 100 g eşlemesi değişmez.

## Porsiyon ölçüleri

[`usda-food-portions.json`](usda-food-portions.json), aynı 30 kaydın USDA porsiyon alanlarını ve her ölçü için kabul/eleme kararını taşır (28 gıda, 64 ölçü). Kabul edilen ölçülerde gram karşılığı `gramWeight / amount` ile hesaplanır. Yoğurt ve Fuji elmadaki RACC miktarı adet sayılmadığı için bu gıdalar gramla kalır.

Bu dosyalar kaldırılan .NET API'sinin seed verisiydi (15 Ekim 2026); Faz 1'de mobil katalog üretiminin başlangıç girdisi olarak kullanılır.
