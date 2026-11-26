import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluate, filterAll, atwaterOk, looksLikeCode, titleTr, normalizeUnits, canonicalBrands, displayName, normalizeDisplay, foldKey, buildWordDict,
} from './filter-off.mjs';

const base = (over = {}) => ({
  code: '8690000000001',
  product_name_tr: 'Çikolatalı Gofret',
  brands: 'Ülker, Başka',
  quantity: '50 g',
  serving_size: '25 g',
  serving_quantity: 25,
  lang: 'tr',
  nutrition_data_per: '100g',
  nutriments: { 'energy-kcal_100g': 520, proteins_100g: 6, carbohydrates_100g: 60, fat_100g: 28 },
  ...over,
});
const nut = (n) => ({ nutriments: { 'energy-kcal_100g': 520, proteins_100g: 6, carbohydrates_100g: 60, fat_100g: 28, ...n } });

test('geçerli ürün tutulur ve normalize edilir', () => {
  const r = evaluate(base({ product_name_tr: '  Çikolatalı   Gofret ' }));
  assert.equal(r.product.nameTr, 'Çikolatalı Gofret');
  assert.equal(r.product.brand, 'Ülker');
  assert.equal(r.product.servingGrams, 25);
  assert.deepEqual(r.product.per100g, { kcal: 520, protein: 6, carbs: 60, fat: 28 });
});

test('ad kuralları', () => {
  assert.equal(evaluate(base({ product_name_tr: '', product_name: '' })).drop, 'no_name');
  assert.equal(evaluate(base({ product_name_tr: '12345678' })).drop, 'code_like_name');
  assert.equal(evaluate(base({ product_name_tr: 'A1' })).drop, 'code_like_name');
  assert.equal(evaluate(base({ product_name_tr: '', product_name: 'Ети Карам', lang: 'ru' })).drop, 'name_not_turkish');
  assert.equal(evaluate(base({ product_name_tr: '', product_name: 'Chocolate Bar', lang: 'en' })).drop, 'name_not_turkish');
  assert.equal(evaluate(base({ product_name_tr: '', product_name: 'Çizi Peynirli Kraker', lang: 'en' })).product.nameTr, 'Çizi Peynirli Kraker');
  assert.equal(evaluate(base({ product_name_tr: '', product_name: 'Eti Burcak', lang: 'tr' })).product.nameTr, 'Eti Burcak');
  assert.ok(looksLikeCode('0000 11'));
});

test('eksik besin ve yalnız porsiyon', () => {
  assert.equal(evaluate(base(nut({ fat_100g: undefined }))).drop, 'missing_nutrients');
  assert.equal(evaluate(base(nut({ proteins_100g: 'abc' }))).drop, 'missing_nutrients');
  assert.equal(evaluate(base({ nutrition_data_per: 'serving', serving_quantity: undefined })).drop, 'per_serving_only');
});

test('aralık kuralları', () => {
  assert.equal(evaluate(base(nut({ 'energy-kcal_100g': 950 }))).drop, 'kcal_out_of_range');
  assert.equal(evaluate(base(nut({ 'energy-kcal_100g': -1 }))).drop, 'kcal_out_of_range');
  assert.equal(evaluate(base(nut({ carbohydrates_100g: 120 }))).drop, 'macro_out_of_range');
  assert.equal(evaluate(base(nut({ proteins_100g: -2 }))).drop, 'macro_out_of_range');
  assert.equal(evaluate(base(nut({ 'energy-kcal_100g': 500, proteins_100g: 40, carbohydrates_100g: 40, fat_100g: 30 }))).drop, 'macro_sum_over_105');
});

test('Atwater tutarlılığı ve istisnalar', () => {
  assert.equal(evaluate(base(nut({ 'energy-kcal_100g': 100 }))).drop, 'atwater_mismatch');
  assert.equal(evaluate(base(nut({ 'energy-kcal_100g': 900 }))).drop, 'atwater_mismatch');
  assert.ok(atwaterOk(0, 0, 0, 0));
  // alkol: 0 g makro ama 10 g alkol ~ 70 kcal
  assert.equal(atwaterOk(70, 0, 0, 0, { alcohol_100g: 10 }), true);
  assert.equal(atwaterOk(300, 0, 0, 0), false);
  // polyol: şekersiz tatlı, karbonhidratın büyük kısmı polyol
  assert.equal(atwaterOk(300, 0, 80, 0, { polyols_100g: 80 }), true);
  assert.equal(atwaterOk(300, 0, 80, 0), true); // 320 ile zaten tolerans içinde
  assert.equal(atwaterOk(200, 0, 80, 0, { polyols_100g: 80 }), true);
  assert.equal(atwaterOk(200, 0, 80, 0), false);
});

test('kJ dönüşümü', () => {
  const r = evaluate(base({ nutriments: { 'energy-kj_100g': 2175, proteins_100g: 6, carbohydrates_100g: 60, fat_100g: 28 } }));
  assert.equal(r.product.per100g.kcal, 519.8);
  assert.equal(r.meta.fromKj, true);
  const r2 = evaluate(base({ nutriments: { energy_100g: 2092, proteins_100g: 6, carbohydrates_100g: 60, fat_100g: 28 } }));
  assert.equal(r2.product.per100g.kcal, 500);
  // kcal varsa kJ yok sayılır
  assert.equal(evaluate(base()).meta.fromKj, false);
});

test('servingGrams', () => {
  assert.equal(evaluate(base({ serving_quantity: 0.5, serving_size: '0.5 g' })).product.servingGrams, null);
  assert.equal(evaluate(base({ serving_quantity: 5000, serving_size: '5000 g' })).product.servingGrams, null);
  assert.equal(evaluate(base({ serving_quantity: 200, serving_size: '200 ml' })).product.servingGrams, null);
  assert.equal(evaluate(base({ serving_quantity: undefined })).product.servingGrams, null);
  assert.equal(evaluate(base({ serving_quantity: '30', serving_size: '30g' })).product.servingGrams, 30);
});

test('barkod doğrulaması', () => {
  assert.equal(evaluate(base({ code: 'abc' })).drop, 'bad_barcode');
});

test('yinelenenler, sıralama ve sayımlar', () => {
  const list = [
    base({ code: '8690000000002', product_name_tr: 'Zeta', brands: 'B', serving_quantity: undefined, quantity: '' }),
    base({ code: '8690000000003', product_name_tr: 'Alfa', brands: 'B' }),
    base({ code: '8690000000003', product_name_tr: 'Alfa', brands: 'B', serving_quantity: undefined }), // aynı barkod
    base({ code: '8690000000004', product_name_tr: 'ALFA', brands: 'b' }), // aynı marka+ad
    base({ code: '8690000000005', product_name_tr: 'Başka', brands: 'A' }),
    base({ code: '8690000000006', product_name_tr: 'Kötü', nutriments: {} }),
  ];
  const { products, dropCounts } = filterAll(list);
  assert.deepEqual(products.map((p) => `${p.brand}/${p.nameTr}`), ['A/Başka', 'B/Alfa', 'B/Zeta']);
  assert.equal(products.find((p) => p.nameTr.toLowerCase() === 'alfa').servingGrams, 25);
  assert.equal(dropCounts.duplicate_barcode, 1);
  assert.equal(dropCounts.duplicate_brand_name, 1);
  assert.equal(dropCounts.missing_nutrients, 1);
});

test('titleTr: Türkçe başlık biçimi', () => {
  assert.equal(titleTr('ETİ'), 'Eti');
  assert.equal(titleTr('ÇİFTÇİ'), 'Çiftçi');
  assert.equal(titleTr('IŞIK İÇİN'), 'Işık İçin');
  assert.equal(titleTr('içim süt'), 'İçim Süt');
  assert.equal(titleTr('ısırgan ve ıhlamur'), 'Isırgan ve Ihlamur');
  assert.equal(titleTr('ayran ile yoğurt'), 'Ayran ile Yoğurt');
  assert.equal(titleTr("LAY'S ÇİPS"), "Lay's Çips");
  // Ünlü uyumuna aykırı "I" yabancı sözcüktür
  assert.equal(titleTr('MAYONNAISE'), 'Mayonnaise');
  assert.equal(titleTr('MARS POLSKA OGRANICZONĄ'), 'Mars Polska Ograniczoną');
  // sözlük kanıtı: belirsiz ASCII "I" veri kümesindeki yazıma uyar
  const dict = buildWordDict(['Pınar Süt', 'ice tea', 'Çok İçecek', 'Zeytinyağı', 'Kırmızı biber', 'Atatürk Orman Çiftliği']);
  assert.equal(titleTr('PINAR SÜT', { dict }), 'Pınar Süt');
  assert.equal(titleTr('DEREN ICE TEA IÇECEK', { dict }), 'Deren Ice Tea İçecek');
  assert.equal(titleTr('ZEYTINYAĞI', { dict }), 'Zeytinyağı');
  assert.equal(titleTr('KIRMIZI BIBER', { dict }), 'Kırmızı Biber'); // BIBER sözlükte yok -> "i" varsayımı
  assert.equal(titleTr('ANADOLU CIFTLIGI', { dict }), 'Anadolu Çiftliği'); // aksanlar da sözlükten gelir
  // sözlükle çelişen açık harf kullanılmaz: kaynaktaki Ö, sözlükteki "o" ile uyuşmuyor
  assert.equal(titleTr('KÖRIK', { dict: buildWordDict(['korik']) }), 'Körik');
  // sözlük yoksa varsayılan nokta "i" (ünlü uyumu sezgisi yok)
  assert.equal(titleTr('LIGHT'), 'Light');
  assert.equal(titleTr('VITAMIN C'), 'Vitamin C');
  assert.equal(titleTr('ZEYTINYAĞI'), 'Zeytinyaği');
  assert.equal(titleTr('ICE TEA'), 'Ice Tea');
  assert.equal(titleTr('IRMAK'), 'Irmak');
  // çok güçlü kanıt: Türkçeye özgü harf + yalnız art ünlü
  assert.equal(titleTr('IŞIK'), 'Işık');
  assert.equal(titleTr('FISTIĞI'), 'Fıstığı');
  // yabancı harf denetimi kelime bazlı: komşu kelime etkilemez
  assert.equal(titleTr('IŞIK Ó'), 'Işık Ó');
  assert.equal(titleTr('IŞIK ŚĄ'), 'Işık Śą');
  // sözlükte olmayan ASCII-I kelimeler bildirilir
  const seen = [];
  titleTr('LIGHT PINAR IŞIK ETİ', { dict: buildWordDict(['Pınar']), onFallback: (w) => seen.push(w) });
  assert.deepEqual(seen, ['LIGHT']);
  assert.equal(titleTr('indomie noodle'), 'Indomie Noodle');
  assert.equal(titleTr('lezzet-i efsane'), 'Lezzet-i Efsane');
});

test('normalizeUnits: sayıdan sonra birim yazımı', () => {
  assert.equal(normalizeUnits('Eti Canga 45 G'), 'Eti Canga 45 g');
  assert.equal(normalizeUnits('Amoy Soya Sosu 750 Ml'), 'Amoy Soya Sosu 750 ml');
  assert.equal(normalizeUnits('Süt 1 Lt'), 'Süt 1 lt');
  assert.equal(normalizeUnits('Süt 1 l'), 'Süt 1 L');
  assert.equal(normalizeUnits('Su 1,5 L.'), 'Su 1,5 L.');
  assert.equal(normalizeUnits('Un 2 KG'), 'Un 2 kg');
  assert.equal(normalizeUnits('Su 2.5 LİTRE'), 'Su 2.5 litre');
  assert.equal(normalizeUnits('Yoğurt 280G'), 'Yoğurt 280g');
  // sayı olmadan ya da kelimenin parçası olarak değişmez
  assert.equal(normalizeUnits('Gazoz G Vitamini'), 'Gazoz G Vitamini');
  assert.equal(normalizeUnits('3 Gri Kutu'), '3 Gri Kutu');
  assert.equal(normalizeUnits('Pro-L 3 Lezzet'), 'Pro-L 3 Lezzet');
});

test('canonicalBrands: aynı marka tek yazım', () => {
  const mk = (...brands) => brands.map((brand) => ({ brand, nameTr: '' }));
  const c = canonicalBrands(mk('ETİ', 'ETI', 'Eti', 'eti', 'Eti', 'ÇİFTÇİ', 'ULKER', 'Ülker', 'ülker', 'ZUBER', 'tat', 'TAT'));
  assert.equal(c.get(foldKey('ETI')), 'Eti'); // karışık harfli en sık
  assert.equal(c.get(foldKey('ÇİFTÇİ')), 'Çiftçi'); // yalnız büyük -> başlık biçimi
  assert.equal(c.get(foldKey('ULKER')), 'Ülker'); // aksan katlanır, karışık yazım seçilir
  assert.equal(c.get(foldKey('ZUBER')), 'Zuber'); // aksanlı yazım yoksa başlık biçimi
  assert.equal(c.get(foldKey('tat')), 'Tat'); // büyük + küçük karışık grup -> başlık biçimi
  // kısaltma: tüm yazımlar büyük ve en çok 3 harf
  const ab = canonicalBrands(mk('BİM', 'BİM', 'A101', '7UP', 'LC', 'Lc2'));
  assert.equal(ab.get(foldKey('BİM')), 'BİM');
  assert.equal(ab.get(foldKey('A101')), 'A101');
  // perakendeci alias: karışık yazım ("Bim") çoğunlukta olsa da BİM; Uno/Sek gibi alias olmayanlar karışık yazımda kalır
  const retail = canonicalBrands(mk('Bim', 'Bim', 'BİM', 'ŞOK', 'Sok', 'A101', 'a101', 'Uno', 'UNO', 'Sek', 'SEK'));
  assert.equal(retail.get('bim'), 'BİM');
  assert.equal(retail.get('sok'), 'ŞOK');
  assert.equal(retail.get('a101'), 'A101');
  assert.equal(retail.get('uno'), 'Uno');
  assert.equal(retail.get('sek'), 'Sek');
  // alias tablosu: yalnız ASCII yazımı olan Anadolu Çiftliği, sözlük olmadan da düzelir
  assert.equal(canonicalBrands(mk('ANADOLU CIFTLIGI')).get('anadolu ciftligi'), 'Anadolu Çiftliği');
  assert.equal(ab.get(foldKey('7UP')), '7UP');
  assert.equal(ab.get(foldKey('LC')), 'LC');
  // 4 harf ve üstü büyük marka kısaltma sayılmaz
  assert.equal(canonicalBrands(mk('ETİK')).get('etik'), 'Etik');
  // addaki yazım kanıt olur: LAVI + "Lavi Meyve" -> Lavi (Lavı değil)
  const ev = canonicalBrands([{ brand: 'LAVI', nameTr: 'Lavi Meyve Nektarı' }, { brand: 'LAVI', nameTr: 'Lavi Su' }]);
  assert.equal(ev.get('lavi'), 'Lavi');
  // eşitlikte daha az büyük harfli yazım
  assert.equal(canonicalBrands(mk('Mr. NO DARDANEL', 'Mr. No Dardanel')).get('mr no dardanel'), 'Mr. No Dardanel');
});

test('displayName: ad biçimi ve marka', () => {
  assert.equal(displayName('eti lif', 'Eti'), 'Eti Lif');
  assert.equal(displayName('ETİ LİF', 'Eti'), 'Eti Lif');
  assert.equal(displayName('Eti Canga 45 G', 'Eti'), 'Eti Canga 45 g');
  // karışık harfli ad sahibinin yazımıyla kalır
  assert.equal(displayName('PİNAR Süt tam yağlı', 'Pınar'), 'Pınar Süt tam yağlı');
  assert.equal(displayName('iPhone Kılıfı', ''), 'iPhone Kılıfı');
  assert.equal(displayName('Sütaş Kaymaklı yoğurt', 'Sütaş'), 'Sütaş Kaymaklı yoğurt');
  // başlık biçimine çevrilen adda marka her yerde; kısaltma markası korunur
  assert.equal(displayName('yumurta bim', 'BİM'), 'Yumurta BİM');
  assert.equal(displayName('Ekmek bim', 'BİM'), 'Ekmek bim');
  // marka kelimenin parçası olarak eşleşmez
  assert.equal(displayName('ETİK ÜRÜN', 'Eti'), 'Etik Ürün');
  assert.equal(displayName('amoy soya sosu 750 ml', 'Amoy'), 'Amoy Soya Sosu 750 ml');
  assert.equal(displayName('SU 0.5 L.', ''), 'Su 0.5 L.');
});

test('normalizeDisplay: yalnız nameTr ve brand değişir', () => {
  const mk = (code, brand, nameTr) => ({ code, brand, nameTr, quantity: '45 G', servingGrams: 20, per100g: { kcal: 1, protein: 2, carbs: 3, fat: 4 } });
  const input = [mk('1', 'ETİ', 'eti lif'), mk('2', 'Eti', 'Eti Canga 45 G'), mk('3', '', 'SÜT')];
  const out = normalizeDisplay(input);
  assert.deepEqual(out.map((p) => [p.brand, p.nameTr]), [['Eti', 'Eti Lif'], ['Eti', 'Eti Canga 45 g'], ['', 'Süt']]);
  for (const [i, p] of out.entries()) {
    const { brand, nameTr, ...rest } = p;
    const { brand: b0, nameTr: n0, ...rest0 } = input[i];
    assert.deepEqual(rest, rest0);
  }
  assert.equal(input[0].brand, 'ETİ'); // girdi değişmez
});

test('filterAll: normalleştirme tekilleştirmeyi değiştirmez', () => {
  const list = [
    base({ code: '8690000000011', product_name_tr: 'eti lif', brands: 'ETİ' }),
    base({ code: '8690000000012', product_name_tr: 'Eti Lif', brands: 'Eti' }), // aynı marka+ad (normKey)
    base({ code: '8690000000013', product_name_tr: 'Eti Lif 45 G', brands: 'ETI' }), // farklı ad
  ];
  const { products, dropCounts } = filterAll(list);
  assert.equal(products.length, 2);
  assert.equal(dropCounts.duplicate_brand_name, 1);
  assert.deepEqual(products.map((p) => `${p.brand}/${p.nameTr}`), ['Eti/Eti Lif', 'Eti/Eti Lif 45 g']);
});

test('Unicode: NFD girdi NFC gibi işlenir', () => {
  assert.equal(foldKey('İçim'.normalize('NFD')), 'icim');
  assert.equal(foldKey('İçim'.normalize('NFD')), foldKey('İçim'));
  assert.equal(displayName('süt'.normalize('NFD'), ''), 'Süt');
  assert.equal(displayName('ÇİFTÇİ SÜT'.normalize('NFD'), ''), 'Çiftçi Süt');
  assert.equal(titleTr('içim süt'.normalize('NFD')), 'İçim Süt');
  assert.equal(normalizeUnits('Süt 1 Lt'.normalize('NFD')), 'Süt 1 lt');
  const out = normalizeDisplay([{ code: '1', brand: 'İÇİM'.normalize('NFD'), nameTr: 'içim süt'.normalize('NFD'), quantity: '', servingGrams: null, per100g: {} }]);
  assert.equal(out[0].brand, 'İçim');
  assert.equal(out[0].nameTr, 'İçim Süt');
  assert.equal(out[0].brand, out[0].brand.normalize('NFC'));
});

test('marka yerleştirme: baş/son noktalama çiftlenmez', () => {
  assert.equal(displayName('TA!DA! TAVUK', 'Ta!Da!'), 'Ta!Da! Tavuk');
  assert.equal(displayName('DR. SÜT', 'Dr.'), 'Dr. Süt');
  assert.equal(displayName('(MARKA) SÜT', '(Marka)'), '(Marka) Süt');
  assert.equal(displayName('Ta!Da! tavuk', 'Ta!Da!'), 'Ta!Da! tavuk');
  assert.equal(displayName('TAVUK TA!DA!', 'Ta!Da!'), 'Tavuk Ta!Da!');
  // addaki marka noktalamasız yazılmışsa marka kendi noktalamasıyla yazılır
  assert.equal(displayName('Dr Oetker Do Whipped Cream', 'Dr. Oetker'), 'Dr. Oetker Do Whipped Cream');
});

test('kısaltma: BİM alias; normalizeDisplay ürünleri BİM yapar', () => {
  const mk = (code, brand, nameTr) => ({ code, brand, nameTr, quantity: '', servingGrams: null, per100g: {} });
  const out = normalizeDisplay([mk('1', 'BİM', 'Ekmek'), mk('2', 'Bim', 'Tam Buğday Ekmek'), mk('3', 'Bim', 'Süt')]);
  assert.deepEqual(out.map((p) => p.brand), ['BİM', 'BİM', 'BİM']);
});

test('filterAll: sözlük ek metinleri ve onFallback', () => {
  const list = [base({ code: '8690000000021', product_name_tr: 'ZEYTINYAĞI LIGHT', brands: 'Marka' })];
  const seen = [];
  const { products } = filterAll(list, { extraTexts: ['Zeytinyağı'], onFallback: (w) => seen.push(w) });
  assert.equal(products[0].nameTr, 'Zeytinyağı Light');
  assert.deepEqual(seen, ['LIGHT']);
});

test('açık İ korunur, kalan ASCII I ayrıca çözülür', () => {
  // sözlük yok: İ -> i, kalan I varsayılan i
  assert.equal(titleTr('VİTAMIN'), 'Vitamin');
  assert.equal(titleTr('HİNDISTAN'), 'Hindistan');
  assert.equal(titleTr('KİTKAT'), 'Kitkat');
  // sözlük kanıtı kaynaktaki açık harflerle çelişmemeli
  const dict = buildWordDict(['Hindistan cevizi', 'Işık', 'ışık lambası', 'sıcak']);
  assert.equal(titleTr('HİNDISTAN CEVİZİ', { dict }), 'Hindistan Cevizi');
  assert.equal(titleTr('SICAK', { dict }), 'Sıcak');
  // sözlük "ışık" diyor ama kaynaktaki İ ("i") ile çelişir -> sözlük reddedilir, varsayılan "i"
  assert.equal(titleTr('IŞİK', { dict }), 'Işik');
  const seen = [];
  titleTr('VİTAMIN HİNDISTAN', { dict, onFallback: (w) => seen.push(w) });
  assert.deepEqual(seen, ['VİTAMIN']);
});

test('sözlük: sıklık önce, eşitlikte aksan', () => {
  const heinz = Array.from({ length: 20 }, () => 'Heinz Ketçap').concat(['Heınz Mayonez']);
  const dict = buildWordDict(heinz);
  assert.equal(dict.get('heinz'), 'heinz');
  assert.equal(titleTr('HEINZ KETÇAP', { dict }), 'Heinz Ketçap');
  // eşitlikte aksanlı yazım kazanır (ASCII'ye indirgenmiş ile aksanlı bir kez)
  assert.equal(buildWordDict(['Çiftliği', 'ciftligi']).get('ciftligi'), 'çiftliği');
  assert.equal(buildWordDict(['ciftligi', 'Çiftliği']).get('ciftligi'), 'çiftliği');
  // çoğunluk aksanlıysa ASCII tek yazım bastırılır
  const d2 = buildWordDict(['Atatürk Orman Çiftliği', 'Trakya Çiftliği', 'ciftligi']);
  assert.equal(titleTr('ANADOLU CIFTLIGI', { dict: d2 }), 'Anadolu Çiftliği');
  // filterAll: 20 doğru + 1 hatalı yazım
  const list = [
    ...Array.from({ length: 20 }, (_, i) => base({ code: `86900000010${String(i).padStart(2, '0')}`, product_name_tr: `Heinz Ketçap ${i + 1}`, brands: 'Heinz' })),
    base({ code: '8690000001100', product_name_tr: 'Heınz Sos', brands: 'Heinz' }),
    base({ code: '8690000001101', product_name_tr: 'HEINZ KETÇAP', brands: 'Marka' }),
  ];
  const seen = [];
  const { products } = filterAll(list, { onFallback: (w) => seen.push(w) });
  assert.equal(products.find((p) => p.code === '8690000001101').nameTr, 'Heinz Ketçap');
  assert.deepEqual(seen, []);
});
