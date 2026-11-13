import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, filterAll, atwaterOk, looksLikeCode } from './filter-off.mjs';

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
