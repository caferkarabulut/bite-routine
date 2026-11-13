// USDA ham JSON'dan kompakt indeks uretir ve basit token puanlamali arama saglar.
// Kullanim: node scripts/usda-index.mjs   -> .cache/usda/index.json
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NUTRIENT_IDS, USDA_DATASETS, usdaCacheDir, usdaIndexPath } from './config.mjs';

/** Bir besin listesinden (USDA foodNutrients) deger okur; eksikse null (asla 0 degil). */
function pick(foodNutrients, ids) {
  for (const id of ids) {
    const fn = foodNutrients.find((n) => (n.nutrient?.id ?? n.nutrientId) === id);
    if (fn && fn.amount !== undefined && fn.amount !== null && fn.amount !== '') {
      const v = Number(fn.amount);
      if (Number.isFinite(v)) return v;
    }
  }
  return null;
}

/** Tek bir USDA gida kaydini indeks kaydina cevirir. */
export function indexRecord(food, dataType) {
  const fns = food.foodNutrients ?? [];
  return {
    fdcId: food.fdcId,
    dataType: food.dataType ?? dataType,
    description: food.description,
    kcal: pick(fns, NUTRIENT_IDS.kcal),
    protein: pick(fns, NUTRIENT_IDS.protein),
    carbs: pick(fns, NUTRIENT_IDS.carbs),
    fat: pick(fns, NUTRIENT_IDS.fat),
    fiber: pick(fns, NUTRIENT_IDS.fiber),
    sodium: pick(fns, NUTRIENT_IDS.sodium),
  };
}

export function buildIndex(cacheDir = usdaCacheDir()) {
  const foods = [];
  for (const ds of USDA_DATASETS) {
    const p = join(cacheDir, ds.json);
    if (!existsSync(p)) throw new Error(`${p} yok. Once: npm run fetch:usda`);
    const raw = JSON.parse(readFileSync(p, 'utf8'));
    const list = raw[ds.rootKey];
    if (!Array.isArray(list)) throw new Error(`${ds.json}: ${ds.rootKey} dizisi bulunamadi`);
    for (const f of list) foods.push(indexRecord(f, ds.dataType));
  }
  return { version: 1, count: foods.length, foods };
}

export function loadIndex(path = usdaIndexPath()) {
  if (!existsSync(path)) throw new Error(`${path} yok. Once: npm run fetch:usda && npm run index:usda`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

// ---- Arama ----

export function tokenize(s) {
  return String(s).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}
/** Cok basit cogul/kok indirgeme: lentils -> lentil, tomatoes -> tomato. */
export function stem(t) {
  if (t.length > 4 && t.endsWith('ies')) return t.slice(0, -3) + 'y';
  if (t.length > 4 && t.endsWith('oes')) return t.slice(0, -2);
  if (t.length > 3 && t.endsWith('s') && !t.endsWith('ss')) return t.slice(0, -1);
  return t;
}

const COOKED_WORDS = new Set(['cooked', 'boiled', 'baked', 'fried', 'roasted', 'steamed', 'canned', 'stewed', 'grilled', 'broiled', 'braised']);

/** Bir kaydin sorguya puani; eslesen yoksa null. Yuksek = iyi. */
export function scoreRecord(rec, queryTokens) {
  const qs = queryTokens.map(stem);
  const dt = tokenize(rec.description).map(stem);
  const dset = new Set(dt);
  let matched = 0;
  let score = 0;
  qs.forEach((q, i) => {
    if (dset.has(q)) {
      matched++;
      score += 10;
      const pos = dt.indexOf(q);
      if (pos === 0) score += 4; // USDA aciklamalari ana gidayla baslar
      else if (pos < 3) score += 1;
    } else if (dt.some((d) => d.startsWith(q) && q.length >= 3)) {
      matched++;
      score += 5;
    }
  });
  if (matched === 0) return null;
  score -= (qs.length - matched) * 12;
  // Aciklamadaki fazla sozcuk cezasi (kisa/genel kayit tercih edilir)
  const extra = Math.max(0, dt.length - qs.length);
  score -= extra * 0.4;
  const wantsRaw = qs.includes('raw');
  const queryCooked = qs.some((q) => COOKED_WORDS.has(q));
  if (wantsRaw) {
    if (dset.has('raw')) score += 6;
    if ([...dset].some((d) => COOKED_WORDS.has(d))) score -= 6;
    if (rec.dataType === 'SR Legacy' || rec.dataType === 'Foundation') score += 2;
  } else if (!queryCooked && [...dset].some((d) => COOKED_WORDS.has(d))) {
    score -= 1;
  }
  return score;
}

export function searchIndex(index, query, limit = 15) {
  const toks = tokenize(query);
  if (toks.length === 0) return [];
  const out = [];
  for (const rec of index.foods) {
    const s = scoreRecord(rec, toks);
    if (s !== null) out.push({ ...rec, score: s });
  }
  out.sort((a, b) => b.score - a.score || a.description.length - b.description.length || a.fdcId - b.fdcId);
  return out.slice(0, limit);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const idx = buildIndex();
    writeFileSync(usdaIndexPath(), JSON.stringify(idx));
    const nulls = (k) => idx.foods.filter((f) => f[k] === null).length;
    console.log(`Indeks yazildi: ${usdaIndexPath()} (${idx.count} gida; kcal eksik ${nulls('kcal')}, protein eksik ${nulls('protein')}, karb eksik ${nulls('carbs')}, yag eksik ${nulls('fat')})`);
  } catch (e) { console.error(e.message); process.exit(1); }
}
