// Katalog uretimi: tarifler + malzeme eslemesi + USDA indeksi -> dist/catalog.json
// Kullanim: node scripts/build-catalog.mjs [--strict] [--root <catalog klasoru>] [--out <dosya>]
// Kural: besin degerlerini yalnizca bu program kaynak tablolardan hesaplar.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATALOG_ROOT, CATEGORIES, usdaIndexPath } from './config.mjs';

export const NUTRIENTS = ['kcal', 'protein', 'carbs', 'fat'];
const TRIVIAL_SHARE = 0.02; // ham agirligin %2'sinden kucuk malzeme "onemsiz"
const FORBIDDEN_KEYS = new Set(['kcal', 'calories', 'calorie', 'protein', 'carbs', 'carbohydrate', 'carbohydrates', 'fat', 'energy', 'per100g']);
const YIELD_MIN = 0.3;
const YIELD_MAX = 2.5;

/** Temel gida porsiyon adinda bulunmamasi gereken yabanci/USDA olcu kalintilari. */
export const FOREIGN_PORTION_RE = /USDA|\bcup\b|\btbsp\b|\btsp\b|inç|\bons\b|\boz\b|extra large/i;

export const round1 = (x) => Math.round((x + Number.EPSILON) * 10) / 10;

const num = (v) => (v === null || v === undefined || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null);

/** USDA starter kaynaklarindaki bir gidanin 100 g degerleri (id'lere gore; eksik = null). */
export function starterNutrients(food) {
  const find = (ids) => {
    for (const id of ids) {
      const n = (food.nutrients ?? []).find((x) => x.id === id);
      if (n) return num(n.amount);
    }
    return null;
  };
  return { kcal: find([1008, 2047]), protein: find([1003]), carbs: find([1005]), fat: find([1004]) };
}

function findForbiddenKeys(obj, path, out) {
  if (Array.isArray(obj)) obj.forEach((v, i) => findForbiddenKeys(v, `${path}[${i}]`, out));
  else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (FORBIDDEN_KEYS.has(k.toLowerCase())) out.push(`${path}.${k}`);
      findForbiddenKeys(v, `${path}.${k}`, out);
    }
  }
}

/**
 * Bir tarifin 100 g basina besin degerlerini hesaplar (yuvarlama YOK).
 * @returns {{per100: object, rawTotal: number, warnings: string[], errors: string[]}}
 */
export function computeDish(recipe, ingredientMap, lookup) {
  const warnings = [];
  const errors = [];
  const label = recipe.dishId;
  const rawTotal = (recipe.ingredients ?? []).reduce((s, i) => s + (Number(i.grams) > 0 ? Number(i.grams) : 0), 0);
  const totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  const nullBy = { kcal: [], protein: [], carbs: [], fat: [] };
  const tinyMissing = new Set();

  for (const ing of recipe.ingredients ?? []) {
    const grams = Number(ing.grams);
    if (!(grams > 0)) continue;
    const map = ingredientMap[ing.key];
    if (!map) continue; // dogrulama ayri raporlar
    if (map.zero === true) continue; // su vb.: tum besinler 0
    const rec = map.fdcId === null || map.fdcId === undefined ? null : lookup(map.fdcId);
    if (!rec) {
      errors.push(`${label}: "${ing.key}" icin FDC ${map.fdcId} USDA indeksinde/kaynaklarda bulunamadi`);
      continue;
    }
    const share = rawTotal > 0 ? grams / rawTotal : 0;
    for (const n of NUTRIENTS) {
      const v = rec[n];
      if (v === null || v === undefined) {
        if (share > TRIVIAL_SHARE) nullBy[n].push(ing.key);
        else { tinyMissing.add(`${ing.key}:${n}`); }
      } else totals[n] += (grams * v) / 100;
    }
  }

  const cooked = Number(recipe.cookedWeightGrams);
  const per100 = {};
  for (const n of NUTRIENTS) {
    if (nullBy[n].length > 0 || !(cooked > 0)) {
      per100[n] = null;
      if (nullBy[n].length > 0) warnings.push(`${label}: ${n} null; eksik malzeme: ${nullBy[n].join(', ')}`);
    } else per100[n] = (totals[n] / cooked) * 100;
  }
  if (tinyMissing.size > 0) {
    warnings.push(`${label}: onemsiz (<%2) malzemede eksik deger 0 sayildi: ${[...tinyMissing].join(', ')}`);
  }
  return { per100, rawTotal, warnings, errors };
}

function roundNutrients(p) {
  const o = {};
  for (const n of NUTRIENTS) o[n] = p[n] === null || p[n] === undefined ? null : round1(p[n]);
  return o;
}

/**
 * Saf birlestirme/dogrulama. Dosya okumaz.
 * inputs: { dishes, recipeFiles:[{file, data}], ingredients, lookup(fdcId), starter, portions, baseFoods, packaged }
 */
export function buildCatalog(inputs, opts = {}) {
  const errors = [];
  const warnings = [];
  const strict = !!opts.strict;
  const items = [];
  const seenIds = new Map(); // id -> aciklama

  const claim = (id, what) => {
    if (seenIds.has(id)) errors.push(`Yinelenen id "${id}": ${what} ve ${seenIds.get(id)}`);
    else seenIds.set(id, what);
  };

  // --- Temel gidalar ---
  const starterFoods = inputs.starter?.foods ?? [];
  const portionsByFdc = new Map((inputs.portions?.foods ?? []).map((f) => [f.fdcId, f]));
  for (const f of starterFoods) {
    const id = `usda-${f.fdcId}`;
    claim(id, `temel gida ${f.fdcId}`);
    const per = starterNutrients(f);
    const portions = [];
    for (const p of portionsByFdc.get(f.fdcId)?.reviewedPortions ?? []) {
      if (p.accepted !== true) continue;
      const grams = Number(p.gramsPerUnit);
      if (!(grams > 0)) { errors.push(`${id}: porsiyon ${p.id} gram <= 0 (${p.gramsPerUnit})`); continue; }
      portions.push({ id: `p${p.id}`, nameTr: p.measureName, nameEn: p.modifier ?? null, grams: round1(grams) });
    }
    items.push({
      id, kind: 'food', category: 'temel-gida',
      nameTr: f.turkishName, nameEn: f.description, aliases: [],
      per100g: roundNutrients(per), portions,
      source: { type: 'usda', fdcId: f.fdcId, dataType: f.dataType, description: f.description },
    });
  }

  // --- Ek temel gidalar (base-foods.json): besinler USDA indeksinden fdcId ile okunur ---
  const PORTION_ORIGINS = new Set(['usda', 'estimate']);
  const baseList = inputs.baseFoods?.foods ?? [];
  {
    const forbidden = [];
    findForbiddenKeys(inputs.baseFoods?.foods ?? [], 'base-foods', forbidden);
    for (const f of forbidden) errors.push(`base-foods.json: besin alani yasak (${f})`);
  }
  for (const f of baseList) {
    const id = `usda-${f.fdcId}`;
    const where = `base-foods.json/${id}`;
    if (!Number.isInteger(f.fdcId) || f.fdcId <= 0) { errors.push(`base-foods.json: gecersiz fdcId (${f.fdcId}) "${f.nameTr ?? '?'}"`); continue; }
    if (f.id !== undefined && f.id !== id) errors.push(`${where}: id "${f.id}" fdcId ile uyusmuyor (beklenen ${id})`);
    claim(id, `ek temel gida ${f.fdcId}`);
    const before = errors.length;
    if (!f.nameTr) errors.push(`${where}: nameTr bos`);
    if (!f.description) errors.push(`${where}: description (USDA aciklamasi) bos`);
    if (!Array.isArray(f.portions) || f.portions.length === 0) errors.push(`${where}: en az bir porsiyon gerekli`);
    const pids = (f.portions ?? []).map((p) => p.id);
    if (new Set(pids).size !== pids.length) errors.push(`${where}: yinelenen porsiyon id`);
    for (const p of f.portions ?? []) {
      if (!(Number(p.grams) > 0)) errors.push(`${where}: porsiyon "${p.id}" gram <= 0 (${p.grams})`);
      if (!PORTION_ORIGINS.has(p.origin)) errors.push(`${where}: porsiyon "${p.id}" origin "usda" veya "estimate" olmali (${p.origin})`);
    }
    const rec = inputs.lookup ? inputs.lookup(f.fdcId) : null;
    if (!rec) { errors.push(`${where}: FDC ${f.fdcId} USDA indeksinde bulunamadi`); continue; }
    if (rec.description !== undefined && rec.description !== f.description) {
      errors.push(`${where}: description USDA ile ayni degil ("${f.description}" / "${rec.description}")`);
    }
    if (rec.dataType !== undefined && f.dataType !== undefined && rec.dataType !== f.dataType) {
      errors.push(`${where}: dataType USDA ile ayni degil (${f.dataType} / ${rec.dataType})`);
    }
    const per = {};
    for (const n of NUTRIENTS) {
      per[n] = num(rec[n]);
      if (per[n] === null) errors.push(`${where}: ${n} USDA kaydinda yok`);
      else if (per[n] < 0) errors.push(`${where}: ${n} negatif (${per[n]})`);
    }
    if (per.kcal !== null && per.kcal > 900) errors.push(`${where}: kcal/100 g = ${per.kcal} (0-900 disinda)`);
    if (errors.length > before) continue;
    const atw = 4 * per.protein + 4 * per.carbs + 9 * per.fat;
    if (Math.abs(per.kcal - atw) > Math.max(25, 0.2 * per.kcal)) {
      warnings.push(`${where}: Atwater uyumsuz: kcal ${round1(per.kcal)} vs 4P+4K+9Y ${round1(atw)}`);
    }
    items.push({
      id, kind: 'food', category: 'temel-gida',
      nameTr: f.nameTr, nameEn: f.nameEn ?? null, aliases: f.aliases ?? [],
      per100g: roundNutrients(per),
      portions: f.portions.map((p) => ({ id: p.id, nameTr: p.nameTr, nameEn: p.nameEn ?? null, grams: round1(Number(p.grams)), origin: p.origin })),
      source: { type: 'usda', fdcId: f.fdcId, dataType: rec.dataType ?? f.dataType ?? null, description: f.description, ...(f.note ? { note: f.note } : {}) },
    });
  }

  // Temel gida porsiyon adlari Turkce olmali: USDA/Amerikan olcu kalintisi yok (strict: hata, degilse uyari)
  for (const it of items) {
    const seen = new Set();
    for (const p of it.portions) {
      if (FOREIGN_PORTION_RE.test(p.nameTr ?? '')) {
        (strict ? errors : warnings).push(`${it.id}/${p.id}: porsiyon adi yabanci olcu iceriyor ("${p.nameTr}")`);
      }
      if (seen.has(p.nameTr)) errors.push(`${it.id}/${p.id}: yinelenen porsiyon adi ("${p.nameTr}")`);
      seen.add(p.nameTr);
    }
  }

  // --- Yemekler ---
  const dishes = inputs.dishes?.dishes ?? [];
  const dishById = new Map();
  for (const d of dishes) {
    if (!d.id) { errors.push('Kimliksiz yemek kaydi'); continue; }
    if (dishById.has(d.id)) errors.push(`Yinelenen yemek id "${d.id}" (dishes.json)`);
    else dishById.set(d.id, d);
    if (!CATEGORIES.includes(d.category)) errors.push(`Yemek "${d.id}": bilinmeyen kategori "${d.category}"`);
  }

  const ingredientMap = inputs.ingredients?.ingredients ?? {};
  const recipeByDish = new Map();
  for (const rf of inputs.recipeFiles ?? []) {
    const fileLabel = rf.file ?? '?';
    if (rf.data?.category && !CATEGORIES.includes(rf.data.category)) {
      errors.push(`${fileLabel}: bilinmeyen kategori "${rf.data.category}"`);
    }
    for (const r of rf.data?.recipes ?? []) {
      const where = `${fileLabel}/${r.dishId}`;
      const forbidden = [];
      findForbiddenKeys(r, r.dishId ?? '?', forbidden);
      for (const f of forbidden) errors.push(`${where}: tarifte besin alani yasak (${f})`);
      if (!dishById.has(r.dishId)) { errors.push(`${where}: dishId dishes.json icinde yok`); continue; }
      if (recipeByDish.has(r.dishId)) { errors.push(`${where}: ayni yemek icin birden fazla tarif`); continue; }
      const dish = dishById.get(r.dishId);
      if (rf.data?.category && dish.category !== rf.data.category) {
        errors.push(`${where}: dosya kategorisi "${rf.data.category}" yemek kategorisi "${dish.category}" ile uyusmuyor`);
      }
      recipeByDish.set(r.dishId, { r, file: fileLabel });
    }
  }

  const noRecipe = [];
  for (const d of dishes) {
    if (!d.id || !dishById.has(d.id) || dishById.get(d.id) !== d) continue;
    const entry = recipeByDish.get(d.id);
    if (!entry) {
      if (strict) errors.push(`Yemek "${d.id}" icin tarif yok (--strict)`);
      else noRecipe.push(d.id);
      continue;
    }
    const { r } = entry;
    const where = `${entry.file}/${d.id}`;
    const before = errors.length;

    if (!Array.isArray(r.ingredients) || r.ingredients.length === 0) errors.push(`${where}: malzeme listesi bos`);
    for (const ing of r.ingredients ?? []) {
      if (!(Number(ing.grams) > 0)) errors.push(`${where}: "${ing.key}" gram <= 0 (${ing.grams})`);
      if (!Object.hasOwn(ingredientMap, ing.key)) errors.push(`${where}: malzeme anahtari "${ing.key}" ingredients.json icinde yok`);
      else if (ingredientMap[ing.key].zero !== true && (ingredientMap[ing.key].fdcId ?? null) === null) {
        errors.push(`${where}: "${ing.key}" bir FDC kaydina baglanmamis`);
      }
    }
    if (!(Number(r.cookedWeightGrams) > 0)) errors.push(`${where}: cookedWeightGrams <= 0 (${r.cookedWeightGrams})`);
    if (!Array.isArray(r.portions) || r.portions.length === 0) errors.push(`${where}: en az bir porsiyon gerekli`);
    for (const p of r.portions ?? []) {
      if (!(Number(p.grams) > 0)) errors.push(`${where}: porsiyon "${p.id}" gram <= 0 (${p.grams})`);
    }
    const pids = (r.portions ?? []).map((p) => p.id);
    if (new Set(pids).size !== pids.length) errors.push(`${where}: yinelenen porsiyon id`);
    if ((d.servingKind === 'piece' || d.servingKind === 'slice') && !pids.includes(d.servingKind === 'piece' ? 'adet' : 'dilim')) {
      warnings.push(`${where}: servingKind ${d.servingKind} icin "${d.servingKind === 'piece' ? 'adet' : 'dilim'}" porsiyonu yok`);
    }

    const rawTotal = (r.ingredients ?? []).reduce((s, i) => s + (Number(i.grams) > 0 ? Number(i.grams) : 0), 0);
    if (rawTotal > 0 && Number(r.cookedWeightGrams) > 0) {
      const ratio = Number(r.cookedWeightGrams) / rawTotal;
      if (ratio < YIELD_MIN || ratio > YIELD_MAX) {
        errors.push(`${where}: verim orani ${ratio.toFixed(2)} (pismis ${r.cookedWeightGrams} g / ham ${rawTotal} g) ${YIELD_MIN}-${YIELD_MAX} disinda`);
      }
    }

    // Girdi hatasi varsa hesaplamayi atla (anlamsiz sonuc ve yan hatalar uretmesin)
    if (errors.length > before) continue;

    const calc = computeDish(r, ingredientMap, inputs.lookup ?? (() => null));
    errors.push(...calc.errors.map((e) => `${where}: ${e}`));
    warnings.push(...calc.warnings);
    const per = calc.per100;
    if (per.kcal !== null && (per.kcal < 0 || per.kcal > 900)) {
      errors.push(`${where}: kcal/100 g = ${round1(per.kcal)} (0-900 disinda)`);
    }
    if (NUTRIENTS.every((n) => per[n] !== null)) {
      const atw = 4 * per.protein + 4 * per.carbs + 9 * per.fat;
      const diff = Math.abs(per.kcal - atw);
      if (diff > Math.max(25, 0.2 * per.kcal)) {
        warnings.push(`${where}: Atwater uyumsuz: kcal ${round1(per.kcal)} vs 4P+4K+9Y ${round1(atw)} (fark ${round1(diff)})`);
      }
    }

    claim(d.id, `yemek ${d.id}`);
    const fdcIds = [...new Set((r.ingredients ?? []).map((i) => ingredientMap[i.key]?.fdcId).filter((x) => x !== null && x !== undefined))];
    items.push({
      id: d.id, kind: 'dish', category: d.category,
      nameTr: d.nameTr, nameEn: d.nameEn ?? null, aliases: d.aliases ?? [],
      per100g: roundNutrients(per),
      portions: (r.portions ?? []).map((p) => ({ id: p.id, nameTr: p.nameTr, nameEn: p.nameEn ?? null, grams: round1(Number(p.grams)) })),
      source: {
        type: 'recipe', servings: r.servings ?? null, confidence: r.confidence ?? null,
        cookedWeightGrams: r.cookedWeightGrams, rawWeightGrams: round1(rawTotal),
        assumptions: r.assumptions ?? null, fdcIds,
        ingredients: r.ingredients.map((i) => ({ key: i.key, grams: i.grams, fdcId: ingredientMap[i.key]?.fdcId ?? null })),
      },
    });
  }

  if (noRecipe.length) warnings.push(`${noRecipe.length} yemek icin tarif yok (--strict ile hata olur): ${noRecipe.join(', ')}`);

  // --- Paketli urunler ---
  const pk = inputs.packaged;
  for (const p of pk?.products ?? []) {
    const id = `off-${p.code}`;
    claim(id, `paketli urun ${p.code}`);
    const per = {};
    for (const n of NUTRIENTS) per[n] = num(p.per100g?.[n]);
    for (const n of NUTRIENTS) {
      if (per[n] !== null && per[n] < 0) errors.push(`${id}: ${n} negatif (${per[n]})`);
    }
    if (per.kcal !== null && per.kcal > 900) errors.push(`${id}: kcal/100 g = ${per.kcal} (0-900 disinda)`);
    const grams = num(p.servingGrams);
    items.push({
      id, kind: 'packaged', category: 'paketli',
      nameTr: p.nameTr, nameEn: null, aliases: [], brand: p.brand ?? null, quantity: p.quantity ?? null,
      per100g: roundNutrients(per),
      portions: grams > 0 ? [{ id: 'porsiyon', nameTr: '1 porsiyon', nameEn: '1 serving', grams: round1(grams) }] : [],
      source: { type: 'off', code: p.code, retrievedAt: pk.retrievedAt ?? null, license: pk.license ?? null },
    });
  }

  const catalog = errors.length === 0 ? { version: 1, items } : null;
  return { catalog, errors, warnings };
}

// ---- Dosya yukleme ve CLI ----

function readJson(path, warnings, label, { optional = true } = {}) {
  if (!existsSync(path)) {
    if (optional) warnings.push(`${label} yok (${path}); atlandi`);
    return null;
  }
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch (e) { throw new Error(`${path} okunamadi: ${e.message}`); }
}

export function loadInputs(root, warnings) {
  const dishes = readJson(join(root, 'dishes.json'), warnings, 'dishes.json');
  const ingredients = readJson(join(root, 'ingredients.json'), warnings, 'ingredients.json');
  const starter = readJson(join(root, 'sources', 'usda-starter-foods.json'), warnings, 'usda-starter-foods.json');
  const portions = readJson(join(root, 'sources', 'usda-food-portions.json'), warnings, 'usda-food-portions.json');
  const baseFoods = readJson(join(root, 'base-foods.json'), warnings, 'base-foods.json');
  const packaged = readJson(join(root, 'packaged', 'off-tr.json'), warnings, 'packaged/off-tr.json');
  const recipeFiles = [];
  const rdir = join(root, 'recipes');
  if (existsSync(rdir)) {
    for (const f of readdirSync(rdir).filter((x) => x.endsWith('.json')).sort()) {
      recipeFiles.push({ file: `recipes/${f}`, data: readJson(join(rdir, f), warnings, f, { optional: false }) });
    }
  }
  if (recipeFiles.length === 0) warnings.push('recipes/*.json yok; yemek eklenmedi');

  const starterMap = new Map((starter?.foods ?? []).map((f) => [f.fdcId, starterNutrients(f)]));
  let indexMap = null;
  const idxPath = usdaIndexPath(root);
  if (existsSync(idxPath)) {
    const idx = JSON.parse(readFileSync(idxPath, 'utf8'));
    indexMap = new Map(idx.foods.map((f) => [f.fdcId, f]));
  } else if (recipeFiles.length > 0 || (baseFoods?.foods ?? []).length > 0) {
    warnings.push(`USDA indeksi yok (${idxPath}); yalnizca sources/ gidalari cozulebilir. Once: npm run fetch:usda && npm run index:usda`);
  }
  // Dogrulanmis starter degerleri indeksten once gelir (ayni FDC kimliginde ayni sayilar).
  const lookup = (id) => starterMap.get(id) ?? indexMap?.get(id) ?? null;
  return { dishes, recipeFiles, ingredients, starter, portions, baseFoods, packaged, lookup };
}

export function main(argv = process.argv.slice(2)) {
  const flag = (n) => argv.includes(n);
  const val = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
  const root = val('--root') ? resolve(val('--root')) : CATALOG_ROOT;
  const out = val('--out') ? resolve(val('--out')) : join(root, 'dist', 'catalog.json');
  const strict = flag('--strict');

  const loadWarnings = [];
  let inputs;
  try { inputs = loadInputs(root, loadWarnings); } catch (e) { console.error(`HATA: ${e.message}`); return 1; }
  const { catalog, errors, warnings } = buildCatalog(inputs, { strict });
  const allWarnings = [...loadWarnings, ...warnings];

  if (allWarnings.length) {
    console.warn(`UYARI (${allWarnings.length}):`);
    for (const w of allWarnings) console.warn(`  - ${w}`);
  }
  if (errors.length) {
    console.error(`\nHATA (${errors.length}):`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error('\nKatalog yazilmadi.');
    return 1;
  }
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(catalog, null, 2) + '\n');
  const by = (k) => catalog.items.filter((i) => i.kind === k).length;
  console.log(`\nKatalog yazildi: ${out}\n  temel gida: ${by('food')}, yemek: ${by('dish')}, paketli: ${by('packaged')}`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(main());
