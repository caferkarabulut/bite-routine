import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildCatalog, computeDish, round1, starterNutrients, main } from './build-catalog.mjs';

const miniIndex = JSON.parse(readFileSync(new URL('./fixtures/mini-index.json', import.meta.url), 'utf8'));
const byId = new Map(miniIndex.foods.map((f) => [f.fdcId, f]));
const lookup = (id) => byId.get(id) ?? null;

const INGREDIENTS = {
  version: 1,
  ingredients: {
    'kirmizi-mercimek-kuru': { fdcId: 1 },
    'sogan-kuru': { fdcId: 4 },
    zeytinyagi: { fdcId: 8 },
    tereyagi: { fdcId: 7 }, // kcal/protein/karb eksik
    su: { fdcId: null, zero: true },
  },
};

const mkRecipe = (over = {}) => ({
  dishId: 'mercimek',
  servings: 4,
  ingredients: [
    { key: 'kirmizi-mercimek-kuru', nameTr: 'Mercimek', grams: 250 },
    { key: 'sogan-kuru', nameTr: 'Soğan', grams: 100 },
    { key: 'zeytinyagi', nameTr: 'Zeytinyağı', grams: 20 },
    { key: 'su', nameTr: 'Su', grams: 1000 },
  ],
  cookedWeightGrams: 1100,
  portions: [{ id: 'kase', nameTr: '1 kase', nameEn: '1 bowl', grams: 300 }],
  assumptions: 'test',
  confidence: 'high',
  ...over,
});

function inputs({ recipe = mkRecipe(), dishes, ingredients = INGREDIENTS, extra = {} } = {}) {
  return {
    dishes: dishes ?? { version: 1, dishes: [{ id: 'mercimek', category: 'corba', nameTr: 'Mercimek', nameEn: 'Lentil', aliases: [], servingKind: 'bowl' }] },
    recipeFiles: recipe ? [{ file: 'recipes/corba.json', data: { version: 1, category: 'corba', recipes: [recipe] } }] : [],
    ingredients,
    lookup,
    starter: { foods: [] },
    portions: { foods: [] },
    packaged: null,
    ...extra,
  };
}

const hasErr = (res, re) => assert.ok(res.errors.some((e) => re.test(e)), `beklenen hata ${re} yok: ${JSON.stringify(res.errors)}`);

test('yemek hesabi: elle hesaplanmis ornek (su 0, pismis agirliga bolunur)', () => {
  // kcal: 250*3.58 + 100*0.40 + 20*8.84 = 895 + 40 + 176.8 = 1111.8 -> /1100*100 = 101.0727
  // protein: 250*.239 + 100*.011 = 59.75 + 1.1 = 60.85 -> 5.5318
  // karb: 250*.631 + 100*.093 = 157.75 + 9.3 = 167.05 -> 15.1864
  // yag: 250*.022 + 100*.001 + 20*1 = 5.5 + 0.1 + 20 = 25.6 -> 2.3273
  const calc = computeDish(mkRecipe(), INGREDIENTS.ingredients, lookup);
  assert.equal(calc.rawTotal, 1370);
  assert.ok(Math.abs(calc.per100.kcal - (1111.8 / 1100) * 100) < 1e-9);
  assert.ok(Math.abs(calc.per100.protein - (60.85 / 1100) * 100) < 1e-9);
  assert.ok(Math.abs(calc.per100.carbs - (167.05 / 1100) * 100) < 1e-9);
  assert.ok(Math.abs(calc.per100.fat - (25.6 / 1100) * 100) < 1e-9);
  const res = buildCatalog(inputs());
  assert.deepEqual(res.errors, []);
  const dish = res.catalog.items.find((i) => i.id === 'mercimek');
  assert.deepEqual(dish.per100g, { kcal: 101.1, protein: 5.5, carbs: 15.2, fat: 2.3 });
  assert.equal(dish.kind, 'dish');
  assert.deepEqual(dish.source.fdcIds, [1, 4, 8]);
  assert.equal(dish.portions[0].grams, 300);
});

test('eksik besin: onemli malzemede null yayilir, onemsiz malzemede 0 sayilir ve uyarilir', () => {
  const big = mkRecipe({
    ingredients: [
      { key: 'tereyagi', nameTr: 'Tereyağı', grams: 100 },
      { key: 'sogan-kuru', nameTr: 'Soğan', grams: 400 },
    ],
    cookedWeightGrams: 400,
  });
  const c1 = computeDish(big, INGREDIENTS.ingredients, lookup);
  assert.equal(c1.per100.kcal, null);
  assert.equal(c1.per100.protein, null);
  assert.equal(c1.per100.carbs, null);
  assert.ok(Math.abs(c1.per100.fat - ((100 * 0.822 + 400 * 0.001) / 400) * 100) < 1e-9); // yag mevcut
  assert.ok(c1.warnings.some((w) => /kcal null/.test(w)));

  const tiny = mkRecipe({
    ingredients: [
      { key: 'tereyagi', nameTr: 'Tereyağı', grams: 5 }, // 5/1005 < %2
      { key: 'sogan-kuru', nameTr: 'Soğan', grams: 1000 },
    ],
    cookedWeightGrams: 1000,
  });
  const c2 = computeDish(tiny, INGREDIENTS.ingredients, lookup);
  assert.ok(Math.abs(c2.per100.kcal - 40) < 1e-9); // yalniz sogan: 1000*.40/1000*100
  assert.ok(c2.warnings.some((w) => /onemsiz.*tereyagi:kcal/.test(w)));
});

test('yuvarlama yalniz sonda: ara yuvarlama farkli sonuc verirdi', () => {
  const ing = { version: 1, ingredients: { a: { fdcId: 900 }, b: { fdcId: 901 }, c: { fdcId: 902 } } };
  const lk = () => ({ kcal: 0.34, protein: 0.34, carbs: 0.34, fat: 0.34 });
  const r = { dishId: 'x', ingredients: ['a', 'b', 'c'].map((k) => ({ key: k, grams: 100 })), cookedWeightGrams: 100 };
  const calc = computeDish(r, ing.ingredients, lk);
  assert.ok(Math.abs(calc.per100.kcal - 1.02) < 1e-9); // hesap yuvarlanmamis
  assert.equal(round1(calc.per100.kcal), 1.0); // ara yuvarlamayla 0.3*3 = 0.9 olurdu
  const res = buildCatalog({ ...inputs({ recipe: mkRecipe({ ingredients: r.ingredients, cookedWeightGrams: 100, portions: [{ id: 'k', nameTr: 'k', grams: 1 }] }), ingredients: ing }), lookup: lk });
  assert.deepEqual(res.errors, []);
  assert.equal(res.catalog.items[0].per100g.kcal, 1);
});

test('round1 ve starterNutrients (2047 enerji, 0E-8 sifir, eksik null)', () => {
  assert.equal(round1(2.349), 2.3);
  assert.equal(round1(2.35), 2.4);
  const n = starterNutrients({ nutrients: [{ id: 2047, amount: '77.9524' }, { id: 1003, amount: '0E-8' }, { id: 1004, amount: '4.484' }] });
  assert.deepEqual(n, { kcal: 77.9524, protein: 0, carbs: null, fat: 4.484 });
});

test('temel gidalar: starter + kabul edilen porsiyonlar, 1 ondalik', () => {
  const res = buildCatalog({
    dishes: null, recipeFiles: [], ingredients: null, lookup,
    starter: { foods: [{ fdcId: 7777, description: 'Yogurt', dataType: 'Foundation', turkishName: 'Yoğurt', nutrients: [{ id: 2047, amount: '77.9524' }, { id: 1003, amount: '3.824172' }, { id: 1005, amount: '5.574928' }, { id: 1004, amount: '4.484' }] }] },
    portions: { foods: [{ fdcId: 7777, reviewedPortions: [
      { id: 1, accepted: true, measureName: 'Kase', modifier: 'bowl', gramsPerUnit: '245' },
      { id: 2, accepted: false, measureName: 'Reddedilen', gramsPerUnit: '10' },
    ] }] },
    packaged: null,
  });
  assert.deepEqual(res.errors, []);
  const f = res.catalog.items[0];
  assert.equal(f.id, 'usda-7777');
  assert.deepEqual(f.per100g, { kcal: 78, protein: 3.8, carbs: 5.6, fat: 4.5 });
  assert.equal(f.portions.length, 1);
  assert.equal(f.portions[0].grams, 245);
});

test('paketli urunler gecer, eksik null kalir', () => {
  const res = buildCatalog({
    ...inputs({ recipe: null }),
    packaged: { retrievedAt: '2026-11-13', license: 'ODbL', products: [{ code: '869', nameTr: 'Bisküvi', brand: 'M', quantity: '100 g', servingGrams: 30, per100g: { kcal: 450.26, protein: 6, carbs: null, fat: 18 } }] },
  });
  assert.deepEqual(res.errors, []);
  const p = res.catalog.items.find((i) => i.kind === 'packaged');
  assert.equal(p.id, 'off-869');
  assert.deepEqual(p.per100g, { kcal: 450.3, protein: 6, carbs: null, fat: 18 });
  assert.equal(p.portions[0].grams, 30);
  assert.equal(p.source.code, '869');
});

// ---- Dogrulama hatalari ----

test('hata: bilinmeyen kategori (yemek ve dosya)', () => {
  const d = { version: 1, dishes: [{ id: 'mercimek', category: 'yok', nameTr: 'M', servingKind: 'bowl' }] };
  hasErr(buildCatalog(inputs({ dishes: d })), /bilinmeyen kategori "yok"/);
});

test('hata: recipe dishId dishes.json icinde yok', () => {
  hasErr(buildCatalog(inputs({ recipe: mkRecipe({ dishId: 'hayalet' }) })), /dishId dishes\.json icinde yok/);
});

test('tarifsiz yemek: uyari; --strict ile hata', () => {
  const res = buildCatalog(inputs({ recipe: null }));
  assert.deepEqual(res.errors, []);
  assert.ok(res.warnings.some((w) => /mercimek/.test(w) && /tarif yok/.test(w)));
  hasErr(buildCatalog(inputs({ recipe: null }), { strict: true }), /"mercimek" icin tarif yok/);
});

test('hata: yinelenen id (yemek, tarif, temel gida cakismasi)', () => {
  const dup = { version: 1, dishes: [
    { id: 'mercimek', category: 'corba', nameTr: 'M', servingKind: 'bowl' },
    { id: 'mercimek', category: 'corba', nameTr: 'M2', servingKind: 'bowl' },
  ] };
  hasErr(buildCatalog(inputs({ dishes: dup })), /Yinelenen yemek id "mercimek"/);
  const two = inputs();
  two.recipeFiles[0].data.recipes.push(mkRecipe());
  hasErr(buildCatalog(two), /birden fazla tarif/);
  const clash = inputs({ dishes: { version: 1, dishes: [{ id: 'usda-5', category: 'corba', nameTr: 'x', servingKind: 'bowl' }] }, recipe: mkRecipe({ dishId: 'usda-5' }) });
  clash.starter = { foods: [{ fdcId: 5, description: 'x', dataType: 'SR Legacy', turkishName: 'x', nutrients: [] }] };
  hasErr(buildCatalog(clash), /Yinelenen id "usda-5"/);
});

test('hata: ingredients.json icinde olmayan anahtar, baglanmamis anahtar', () => {
  const r = mkRecipe(); r.ingredients.push({ key: 'bilinmeyen', nameTr: 'x', grams: 5 });
  hasErr(buildCatalog(inputs({ recipe: r })), /"bilinmeyen" ingredients\.json icinde yok/);
  const ing = { version: 1, ingredients: { ...INGREDIENTS.ingredients, 'kirmizi-mercimek-kuru': { fdcId: null } } };
  hasErr(buildCatalog(inputs({ ingredients: ing })), /FDC kaydina baglanmamis/);
});

test('hata: FDC kimligi indekste yok', () => {
  const ing = { version: 1, ingredients: { ...INGREDIENTS.ingredients, sogan: { fdcId: 424242 } } };
  const r = mkRecipe(); r.ingredients.push({ key: 'sogan', nameTr: 'x', grams: 50 });
  hasErr(buildCatalog(inputs({ recipe: r, ingredients: ing })), /FDC 424242 .* bulunamadi/);
});

test('hata: gram <= 0, pismis agirlik <= 0, porsiyon gram <= 0', () => {
  const r1 = mkRecipe(); r1.ingredients[1].grams = 0;
  hasErr(buildCatalog(inputs({ recipe: r1 })), /gram <= 0/);
  const r2 = mkRecipe(); r2.ingredients[1].grams = -3;
  hasErr(buildCatalog(inputs({ recipe: r2 })), /gram <= 0/);
  hasErr(buildCatalog(inputs({ recipe: mkRecipe({ cookedWeightGrams: 0 }) })), /cookedWeightGrams <= 0/);
  hasErr(buildCatalog(inputs({ recipe: mkRecipe({ portions: [{ id: 'k', nameTr: 'k', grams: 0 }] }) })), /porsiyon "k" gram <= 0/);
  hasErr(buildCatalog(inputs({ recipe: mkRecipe({ portions: [] }) })), /en az bir porsiyon/);
});

test('hata: verim orani 0.3-2.5 disinda', () => {
  hasErr(buildCatalog(inputs({ recipe: mkRecipe({ cookedWeightGrams: 300 }) })), /verim orani 0\.22/);
  hasErr(buildCatalog(inputs({ recipe: mkRecipe({ cookedWeightGrams: 4000 }) })), /verim orani 2\.92/);
  assert.deepEqual(buildCatalog(inputs({ recipe: mkRecipe({ cookedWeightGrams: 1370 * 0.3 }) })).errors.filter((e) => /verim/.test(e)), []);
});

test('hata: tarifte besin alani yasak (kok, malzeme, porsiyon)', () => {
  for (const mut of [
    (r) => { r.kcal = 100; },
    (r) => { r.calories = 100; },
    (r) => { r.ingredients[0].protein = 1; },
    (r) => { r.portions[0].carbs = 1; },
    (r) => { r.fat = 1; },
  ]) {
    const r = mkRecipe(); mut(r);
    hasErr(buildCatalog(inputs({ recipe: r })), /besin alani yasak/);
  }
});

test('hata: kcal/100 g 0-900 disinda', () => {
  // yag 1000 g, pismis agirlik 400 g (verim .4 gecerli) -> 884*1000/100/400*100 = 2210
  const ing = { version: 1, ingredients: { yag: { fdcId: 8 } } };
  const r = mkRecipe({ ingredients: [{ key: 'yag', nameTr: 'Yağ', grams: 1000 }], cookedWeightGrams: 400 });
  hasErr(buildCatalog(inputs({ recipe: r, ingredients: ing })), /0-900 disinda/);
});

test('uyari: Atwater uyumsuzlugu listelenir; tutarli yemekte yok', () => {
  assert.ok(!buildCatalog(inputs()).warnings.some((w) => /Atwater/.test(w)));
  const bad = { version: 1, ingredients: { x: { fdcId: 900 } } };
  const lk = () => ({ kcal: 300, protein: 1, carbs: 1, fat: 1 }); // 4+4+9 = 17 kcal ile celisir
  const r = mkRecipe({ ingredients: [{ key: 'x', nameTr: 'x', grams: 100 }], cookedWeightGrams: 100 });
  const res = buildCatalog({ ...inputs({ recipe: r, ingredients: bad }), lookup: lk });
  assert.deepEqual(res.errors, []);
  assert.ok(res.warnings.some((w) => /mercimek.*Atwater/.test(w)));
});

test('hatalar toplanir ve katalog uretilmez', () => {
  const r = mkRecipe({ cookedWeightGrams: 0, portions: [] }); r.kcal = 5;
  const res = buildCatalog(inputs({ recipe: r }));
  assert.ok(res.errors.length >= 3);
  assert.equal(res.catalog, null);
});

test('CLI: gecici kokle calisir, --strict tarifsizde basarisiz olur', () => {
  const root = mkdtempSync(join(tmpdir(), 'catalog-test-'));
  mkdirSync(join(root, 'recipes'));
  mkdirSync(join(root, '.cache', 'usda'), { recursive: true });
  writeFileSync(join(root, '.cache', 'usda', 'index.json'), JSON.stringify(miniIndex));
  writeFileSync(join(root, 'dishes.json'), JSON.stringify({ version: 1, dishes: [
    { id: 'mercimek', category: 'corba', nameTr: 'M', nameEn: 'L', aliases: [], servingKind: 'bowl' },
    { id: 'omlet', category: 'kahvalti', nameTr: 'O', nameEn: 'O', aliases: [], servingKind: 'plate' },
  ] }));
  writeFileSync(join(root, 'ingredients.json'), JSON.stringify(INGREDIENTS));
  writeFileSync(join(root, 'recipes', 'corba.json'), JSON.stringify({ version: 1, category: 'corba', recipes: [mkRecipe()] }));
  const mute = (fn) => { const o = [console.log, console.warn, console.error]; console.log = console.warn = console.error = () => {}; try { return fn(); } finally { [console.log, console.warn, console.error] = o; } };
  assert.equal(mute(() => main(['--root', root, '--strict'])), 1);
  assert.ok(!existsSync(join(root, 'dist', 'catalog.json')));
  assert.equal(mute(() => main(['--root', root])), 0);
  const out = JSON.parse(readFileSync(join(root, 'dist', 'catalog.json'), 'utf8'));
  assert.equal(out.items.length, 1);
  assert.equal(out.items[0].per100g.kcal, 101.1);
});

// ---- Ek temel gidalar (base-foods.json) ----

const mkBase = (over = {}) => ({
  id: 'usda-4', nameTr: 'Kuru soğan', nameEn: 'Onion', aliases: ['soğan'], fdcId: 4, dataType: 'SR Legacy',
  description: 'Onions, raw', note: 'test notu',
  portions: [
    { id: 'adet', nameTr: '1 adet', nameEn: '1 onion', grams: 110, origin: 'usda' },
    { id: 'avuc', nameTr: '1 avuç', nameEn: '1 handful', grams: 35.04, origin: 'estimate' },
  ],
  ...over,
});
const withBase = (foods, extra = {}) => ({ ...inputs({ recipe: null }), baseFoods: { version: 1, foods }, ...extra });

test('ek temel gida: indeksten 100 g degerleri, food/temel-gida, porsiyon origin, kaynak ve not', () => {
  const res = buildCatalog(withBase([mkBase(), mkBase({ id: 'usda-2', fdcId: 2, description: 'Lentils, raw', nameTr: 'Mercimek' })]));
  assert.deepEqual(res.errors, []);
  const f = res.catalog.items.find((i) => i.id === 'usda-4');
  assert.equal(f.kind, 'food');
  assert.equal(f.category, 'temel-gida');
  assert.deepEqual(f.per100g, { kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1 });
  assert.deepEqual(f.portions.map((p) => [p.id, p.grams, p.origin]), [['adet', 110, 'usda'], ['avuc', 35, 'estimate']]);
  assert.deepEqual(f.source, { type: 'usda', fdcId: 4, dataType: 'SR Legacy', description: 'Onions, raw', note: 'test notu' });
  assert.deepEqual(f.aliases, ['soğan']);
  // Eksik makro olmayan kayitta Atwater tutarli: uyari yok
  assert.ok(!res.warnings.some((w) => /Atwater/.test(w) && /usda-4/.test(w)));
});

test('ek temel gida: not bos ise source.note yazilmaz', () => {
  const f = buildCatalog(withBase([mkBase({ note: '' })])).catalog.items[0];
  assert.ok(!('note' in f.source));
});

test('ek temel gida hata: starter ile ayni fdcId ve kendi icinde yinelenen fdcId', () => {
  const clash = withBase([mkBase()], { starter: { foods: [{ fdcId: 4, description: 'Onions, raw', dataType: 'SR Legacy', turkishName: 'Soğan', nutrients: [{ id: 1008, amount: '40' }] }] } });
  hasErr(buildCatalog(clash), /Yinelenen id "usda-4"/);
  hasErr(buildCatalog(withBase([mkBase(), mkBase()])), /Yinelenen id "usda-4"/);
});

test('ek temel gida hata: indekste yok, makro eksik, aciklama/dataType uyusmuyor', () => {
  hasErr(buildCatalog(withBase([mkBase({ id: 'usda-999', fdcId: 999 })])), /FDC 999 USDA indeksinde bulunamadi/);
  // fdcId 7: kcal/protein/carbs yok
  const missing = buildCatalog(withBase([mkBase({ id: 'usda-7', fdcId: 7, dataType: 'Foundation', description: 'Butter, stick, salted' })]));
  hasErr(missing, /kcal USDA kaydinda yok/);
  hasErr(missing, /carbs USDA kaydinda yok/);
  assert.equal(missing.catalog, null);
  hasErr(buildCatalog(withBase([mkBase({ description: 'Onions' })])), /description USDA ile ayni degil/);
  hasErr(buildCatalog(withBase([mkBase({ dataType: 'Foundation' })])), /dataType USDA ile ayni degil/);
});

test('ek temel gida hata: porsiyon (bos, gram, origin, yinelenen id) ve id/fdcId uyumsuzlugu', () => {
  hasErr(buildCatalog(withBase([mkBase({ portions: [] })])), /en az bir porsiyon/);
  hasErr(buildCatalog(withBase([mkBase({ portions: [{ id: 'a', nameTr: 'x', grams: 0, origin: 'usda' }] })])), /porsiyon "a" gram <= 0/);
  hasErr(buildCatalog(withBase([mkBase({ portions: [{ id: 'a', nameTr: 'x', grams: 5 }] })])), /origin/);
  hasErr(buildCatalog(withBase([mkBase({ portions: [{ id: 'a', nameTr: 'x', grams: 5, origin: 'guess' }] })])), /origin/);
  const dupP = { id: 'a', nameTr: 'x', grams: 5, origin: 'usda' };
  hasErr(buildCatalog(withBase([mkBase({ portions: [dupP, dupP] })])), /yinelenen porsiyon id/);
  hasErr(buildCatalog(withBase([mkBase({ id: 'usda-5' })])), /id "usda-5" fdcId ile uyusmuyor/);
  hasErr(buildCatalog(withBase([mkBase({ fdcId: 'x' })])), /gecersiz fdcId/);
});

test('ek temel gida hata: besin alani yasak', () => {
  hasErr(buildCatalog(withBase([mkBase({ kcal: 40 })])), /besin alani yasak.*kcal/);
});

test('ek temel gida: base-foods.json yoksa CLI uyarir, varsa katalog urun sayisina eklenir', () => {
  const root = mkdtempSync(join(tmpdir(), 'catalog-base-test-'));
  mkdirSync(join(root, '.cache', 'usda'), { recursive: true });
  writeFileSync(join(root, '.cache', 'usda', 'index.json'), JSON.stringify(miniIndex));
  const warns = [];
  const run = () => {
    const o = [console.log, console.warn, console.error];
    console.log = console.error = () => {}; console.warn = (m) => warns.push(String(m));
    try { return main(['--root', root]); } finally { [console.log, console.warn, console.error] = o; }
  };
  assert.equal(run(), 0);
  assert.ok(warns.some((w) => /base-foods\.json yok/.test(w)));
  writeFileSync(join(root, 'base-foods.json'), JSON.stringify({ version: 1, foods: [mkBase()] }));
  assert.equal(run(), 0);
  const out = JSON.parse(readFileSync(join(root, 'dist', 'catalog.json'), 'utf8'));
  assert.equal(out.items.length, 1);
  assert.equal(out.items[0].id, 'usda-4');
});

test('gercek base-foods.json: indeks varsa tum kayitlar gecerli (smoke)', () => {
  const root = new URL('..', import.meta.url);
  const basePath = new URL('base-foods.json', root);
  const idxPath = new URL('.cache/usda/index.json', root);
  if (!existsSync(basePath) || !existsSync(idxPath)) return;
  const base = JSON.parse(readFileSync(basePath, 'utf8'));
  const idx = new Map(JSON.parse(readFileSync(idxPath, 'utf8')).foods.map((f) => [f.fdcId, f]));
  const res = buildCatalog({ ...inputs({ recipe: null }), lookup: (id) => idx.get(id) ?? null, baseFoods: base });
  assert.deepEqual(res.errors, []);
  assert.equal(res.catalog.items.length, base.foods.length);
});

test('temel gida porsiyon adinda yabanci olcu: strict hata, normal uyari', () => {
  const mk = (measureName) => ({
    dishes: null, recipeFiles: [], ingredients: null, lookup,
    starter: { foods: [{ fdcId: 7777, description: 'Yogurt', dataType: 'Foundation', turkishName: 'Yoğurt', nutrients: [{ id: 2047, amount: '77.9524' }, { id: 1003, amount: '3.8' }, { id: 1005, amount: '5.5' }, { id: 1004, amount: '4.4' }] }] },
    portions: { foods: [{ fdcId: 7777, reviewedPortions: [{ id: 1, accepted: true, measureName, gramsPerUnit: '240' }] }] },
    packaged: null,
  });
  for (const bad of ['cup (USDA ölçüsü)', 'Yemek kaşığı (USDA tbsp)', 'Büyük adet (3 inç çap)', '1 ons', '3 oz', 'Çok büyük adet (extra large)', '1 tsp']) {
    const strict = buildCatalog(mk(bad), { strict: true });
    assert.ok(strict.errors.some((e) => /yabanci olcu/.test(e)), bad);
    const loose = buildCatalog(mk(bad));
    assert.deepEqual(loose.errors, [], bad);
    assert.ok(loose.warnings.some((w) => /yabanci olcu/.test(w)), bad);
  }
  for (const ok of ['1 büyük bardak (240 ml)', '1 yemek kaşığı', 'Büyük boy', '1 parça (~28 g)', 'Orta dilim']) {
    const res = buildCatalog(mk(ok), { strict: true });
    assert.ok(!res.errors.some((e) => /yabanci olcu/.test(e)), ok);
  }
});

test('temel gida: ayni besinde yinelenen porsiyon adi hata', () => {
  const res = buildCatalog({
    dishes: null, recipeFiles: [], ingredients: null, lookup,
    starter: { foods: [{ fdcId: 7777, description: 'Y', dataType: 'Foundation', turkishName: 'Y', nutrients: [{ id: 2047, amount: '77' }, { id: 1003, amount: '3' }, { id: 1005, amount: '5' }, { id: 1004, amount: '4' }] }] },
    portions: { foods: [{ fdcId: 7777, reviewedPortions: [
      { id: 1, accepted: true, measureName: 'Orta boy', gramsPerUnit: '100' },
      { id: 2, accepted: true, measureName: 'Orta boy', gramsPerUnit: '120' },
    ] }] },
    packaged: null,
  });
  assert.ok(res.errors.some((e) => /yinelenen porsiyon adi/.test(e)));
});
