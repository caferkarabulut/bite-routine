// Önbellekteki Open Food Facts sayfalarından güvenilir ürünleri süzer -> off-tr.json ve README.md.
// Kullanım: node catalog/packaged/filter-off.mjs
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(here, '..', '.cache', 'off');
const OUT_JSON = join(here, 'off-tr.json');
const OUT_README = join(here, 'README.md');

const KJ_PER_KCAL = 4.184;
const TR_LETTERS = /[çğıöşüÇĞİÖŞÜ]/;
const LATIN_ONLY = /^[\p{Script=Latin}\p{N}\p{P}\p{S}\s]+$/u;

const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
export const clean = (s) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : '');

/** Boş, kod benzeri (çoğu rakam / harf yok) adları eler. */
export function looksLikeCode(name) {
  if (name.length < 2) return true;
  const letters = (name.match(/\p{L}/gu) ?? []).length;
  if (letters < 2) return true;
  if (/^[\d\s.\-_/]+$/.test(name)) return true;
  const digits = (name.match(/\d/g) ?? []).length;
  return digits / name.length > 0.5;
}

/**
 * Türkçe ad seçimi: product_name_tr; yoksa product_name yalnız dil 'tr' ise
 * ya da Türkçe harf içeriyorsa ve Latin alfabesindeyse kabul edilir.
 */
export function pickName(p) {
  const tr = clean(p.product_name_tr);
  if (tr) return { name: tr, reason: looksLikeCode(tr) ? 'code_like_name' : null };
  const raw = clean(p.product_name);
  if (!raw) return { name: '', reason: 'no_name' };
  if (!LATIN_ONLY.test(raw)) return { name: '', reason: 'name_not_turkish' };
  if (p.lang === 'tr' || TR_LETTERS.test(raw)) {
    return { name: raw, reason: looksLikeCode(raw) ? 'code_like_name' : null };
  }
  return { name: '', reason: 'name_not_turkish' };
}

/** 100 g başına kcal; yalnız kJ varsa 4.184'e bölünür. */
export function energyKcal(n) {
  const kcal = num(n['energy-kcal_100g']);
  if (kcal !== null) return { kcal, fromKj: false };
  const kj = num(n['energy-kj_100g']) ?? num(n['energy_100g']);
  if (kj !== null) return { kcal: kj / KJ_PER_KCAL, fromKj: true };
  return { kcal: null, fromKj: false };
}

/** Atwater tutarlılığı; alkol (7 kcal/g) eklenir, polyol (2.4 kcal/g) için alt sınır gevşetilir. */
export function atwaterOk(kcal, protein, carbs, fat, n = {}) {
  const alcohol = Math.max(0, num(n['alcohol_100g']) ?? 0);
  const polyols = Math.max(0, num(n['polyols_100g']) ?? 0);
  const expected = 4 * protein + 4 * carbs + 9 * fat + 7 * alcohol;
  const tol = Math.max(25, 0.2 * kcal);
  const lowExpected = expected - 1.6 * Math.min(polyols, carbs);
  return kcal <= expected + tol && kcal >= lowExpected - tol;
}

/** Tek ürünü değerlendirir: { product } ya da { drop: neden }. */
export function evaluate(p) {
  const code = clean(String(p.code ?? ''));
  if (!/^\d{6,14}$/.test(code)) return { drop: 'bad_barcode' };

  const { name, reason } = pickName(p);
  if (reason) return { drop: reason };

  const n = p.nutriments ?? {};
  if (p.nutrition_data_per === 'serving' && !(num(p.serving_quantity) > 0)) {
    return { drop: 'per_serving_only' };
  }
  const { kcal, fromKj } = energyKcal(n);
  const protein = num(n['proteins_100g']);
  const carbs = num(n['carbohydrates_100g']);
  const fat = num(n['fat_100g']);
  if (kcal === null || protein === null || carbs === null || fat === null) return { drop: 'missing_nutrients' };
  if (kcal < 0 || kcal > 900) return { drop: 'kcal_out_of_range' };
  if ([protein, carbs, fat].some((v) => v < 0 || v > 100)) return { drop: 'macro_out_of_range' };
  if (protein + carbs + fat > 105) return { drop: 'macro_sum_over_105' };
  if (!atwaterOk(kcal, protein, carbs, fat, n)) return { drop: 'atwater_mismatch' };

  const brand = clean((p.brands ?? '').split(',')[0]);
  const quantity = clean(p.quantity);
  let servingGrams = null;
  const sq = num(p.serving_quantity);
  const unitIsGram = /(^|[\d\s])(g|gr|gram)\s*\)?$/i.test(clean(p.serving_size)) || /^\d+([.,]\d+)?$/.test(clean(p.serving_size));
  if (sq !== null && sq >= 1 && sq <= 1000 && unitIsGram) servingGrams = round(sq, 1);

  return {
    product: {
      code,
      nameTr: name,
      brand,
      quantity,
      servingGrams,
      per100g: { kcal: round(kcal), protein: round(protein), carbs: round(carbs), fat: round(fat) },
    },
    meta: { fromKj, liquid: /\b(ml|cl|l|lt|litre)\b/i.test(quantity) && !/\bg\b|\bkg\b/i.test(quantity) },
  };
}

const completeness = (x) =>
  (x.servingGrams !== null ? 1 : 0) + (x.quantity ? 1 : 0) + (x.brand ? 1 : 0) + (x.nameTr.length > 3 ? 1 : 0);

const normKey = (s) => s.toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/** Aynı barkod -> en dolu kayıt; aynı marka+ad (farklı barkod) -> en dolu kayıt. */
export function dedupe(items) {
  const drops = { duplicate_barcode: 0, duplicate_brand_name: 0 };
  const byCode = new Map();
  for (const it of items) {
    const prev = byCode.get(it.code);
    if (!prev) byCode.set(it.code, it);
    else {
      drops.duplicate_barcode++;
      if (completeness(it) > completeness(prev)) byCode.set(it.code, it);
    }
  }
  const byName = new Map();
  for (const it of byCode.values()) {
    if (!it.brand) { byName.set(`code:${it.code}`, it); continue; }
    const key = `${normKey(it.brand)}|${normKey(it.nameTr)}`;
    const prev = byName.get(key);
    if (!prev) byName.set(key, it);
    else {
      drops.duplicate_brand_name++;
      if (completeness(it) > completeness(prev)) byName.set(key, it);
    }
  }
  return { products: [...byName.values()], drops };
}

export function sortProducts(list) {
  return list.sort(
    (a, b) => a.brand.localeCompare(b.brand, 'tr') || a.nameTr.localeCompare(b.nameTr, 'tr') || a.code.localeCompare(b.code),
  );
}

export function filterAll(rawProducts) {
  const dropCounts = {};
  const kept = [];
  let fromKj = 0;
  let liquids = 0;
  for (const p of rawProducts) {
    const r = evaluate(p);
    if (r.drop) { dropCounts[r.drop] = (dropCounts[r.drop] ?? 0) + 1; continue; }
    kept.push(r.product);
    if (r.meta.fromKj) fromKj++;
    if (r.meta.liquid) liquids++;
  }
  const { products, drops } = dedupe(kept);
  for (const [k, v] of Object.entries(drops)) if (v) dropCounts[k] = v;
  sortProducts(products);
  return { products, dropCounts, fromKj, liquids };
}

const DROP_LABELS = {
  bad_barcode: 'Geçersiz barkod',
  no_name: 'Ad yok',
  name_not_turkish: 'Ad Türkçe değil (Türkçe ad yok; dil tr değil / Latin dışı)',
  code_like_name: 'Ad kod benzeri',
  per_serving_only: 'Yalnız porsiyon başına değer',
  missing_nutrients: 'kcal/protein/karbonhidrat/yağ eksik',
  kcal_out_of_range: 'kcal 0-900 dışında',
  macro_out_of_range: 'Makro 0-100 g dışında',
  macro_sum_over_105: 'Protein+karbonhidrat+yağ > 105 g',
  atwater_mismatch: 'Atwater tutarsızlığı',
  duplicate_barcode: 'Yinelenen barkod',
  duplicate_brand_name: 'Aynı marka+ad, farklı barkod',
};

function readme({ fetched, kept, dropCounts, fromKj, liquids, retrievedAt, withServing }) {
  const rows = Object.entries(dropCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `| ${DROP_LABELS[k] ?? k} | ${v} |`)
    .join('\n');
  return `# Paketli ürünler (Open Food Facts, Türkiye)

\`off-tr.json\`, Open Food Facts'in Türkiye'de satılan ürünlerinin süzülmüş hâlidir.

## Özet

- Alınma tarihi: ${retrievedAt}
- Benzersiz indirilen ürün: ${fetched} (Türkiye için OFF toplamı ~12.100; anonim v2 arama 1000 sonuç sınırı nedeniyle Nutri-Score bölümlerine ayrılarak çekildi, Nutri-Score'u olmayan ~8570 ürünün yalnız bir kısmı alınabildi)
- Tutulan ürün: ${kept} (porsiyon gramı bilinen: ${withServing}; kJ'den çevrilen: ${fromKj}; sıvı/ml ambalajlı: ${liquids})

| Eleme nedeni | Adet |
| --- | ---: |
${rows}

## Kurallar

- Ad: \`product_name_tr\`; yoksa \`product_name\` yalnız dil \`tr\` ise veya Türkçe harf içerip Latin alfabesindeyse. Boş ve kod benzeri adlar elenir.
- Değerler yalnız \`*_100g\` (hazırlanmış/\`_prepared\` değil). kcal, protein, karbonhidrat, yağ dördü de sayısal olmalı. Yalnız kJ varsa kcal = kJ / 4,184.
- Aralıklar: kcal 0-900, her makro 0-100 g, protein+karbonhidrat+yağ <= 105 g.
- Atwater: |kcal - (4p + 4c + 9f)| <= max(25, kcal x %20). Alkol varsa 7 kcal/g eklenir, polyol varsa alt sınır 1,6 kcal/g gevşetilir.
- İçecekler: Open Food Facts 100 ml ve 100 g değerlerini aynı alanda tutar. Su bazlı içeceklerde 100 ml ~ 100 g kabul edilir; ayrıca yoğunluk düzeltmesi yapılmaz (yağ, bal, şurup gibi yoğun sıvılarda küçük sapma olabilir). Ambalajı ml olan ürünler \`quantity\` alanından ayırt edilir.
- \`servingGrams\`: \`serving_quantity\` gram biriminde ve 1-1000 arasındaysa, değilse \`null\`.
- Aynı barkod tek kayıt; aynı marka+ad farklı barkodla geliyorsa en dolu kayıt tutulur. Marka -> ad sırasıyla (tr) sıralanır.

## Lisans ve atıf

Veri: Open Food Facts katkıcıları, ODbL. Kaynak: https://world.openfoodfacts.org
Veritabanı ODbL 1.0, tek tek içerik DbCL 1.0 lisanslıdır; türev veritabanı da aynı koşullarla paylaşılmalı ve uygulamada atıf gösterilmelidir.

## Yeniden çalıştırma

\`\`\`
node catalog/packaged/fetch-off.mjs        # ~20 dk; .cache/off/ içine sayfa sayfa indirir, kaldığı yerden devam eder (--refresh: baştan)
node catalog/packaged/filter-off.mjs       # off-tr.json ve bu README'yi üretir
node --test catalog/packaged/
\`\`\`
`;
}

async function main() {
  const files = (await readdir(CACHE_DIR)).filter((f) => /^[a-z0-9-]+-\d{3}\.json$/.test(f)).sort();
  if (!files.length) throw new Error('Önbellek boş; önce fetch-off.mjs çalıştırın.');
  const all = [];
  let latest = '';
  for (const f of files) {
    const page = JSON.parse(await readFile(join(CACHE_DIR, f), 'utf8'));
    all.push(...page.products);
    if (page.fetchedAt > latest) latest = page.fetchedAt;
  }
  // Bölümler çakışabilir: ham kayıtları barkoda göre tekilleştir (besin değeri olan kayıt öncelikli).
  const byCode = new Map();
  for (const p of all) {
    const prev = byCode.get(p.code);
    const score = (x) => Object.keys(x.nutriments ?? {}).length;
    if (!prev || score(p) > score(prev)) byCode.set(p.code, p);
  }
  const rawCodes = new Set(byCode.keys());
  const { products, dropCounts, fromKj, liquids } = filterAll([...byCode.values()]);
  const retrievedAt = (latest || new Date().toISOString()).slice(0, 10);
  const out = {
    version: 1,
    source: 'Open Food Facts',
    license: 'ODbL 1.0 (veritabanı), DbCL 1.0 (içerik)',
    retrievedAt,
    products,
  };
  await writeFile(OUT_JSON, JSON.stringify(out));
  await writeFile(
    OUT_README,
    readme({
      fetched: rawCodes.size,
      kept: products.length,
      dropCounts,
      fromKj,
      liquids,
      retrievedAt,
      withServing: products.filter((x) => x.servingGrams !== null).length,
    }),
  );
  console.log(`indirilen ${all.length} kayıt (${rawCodes.size} benzersiz kod), tutulan ${products.length}`);
  console.log(dropCounts);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
