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

// ---- Görünen ad / marka yazımı (yalnız nameTr ve brand; besin değeri, barkod, porsiyon değişmez) ----

const TR_FOLD = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u', ê: 'e', ô: 'o' };
const WORD_RE = /[\p{L}\p{N}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu;
const CONNECTIVES = new Set(['ve', 'ile', 'veya']);
const FOREIGN_I_WORDS = new Set(['ice', 'iced', 'indomie', 'instant']);
const UNIT_RE = /(\d(?:[\d.,]*\d)?)(\s*)(kg|gr|gram|mg|g|ml|cl|lt|l[iİ]tre|l)(?![\p{L}\p{N}])/giu;

/**
 * Küçük alias tabloları (anahtar: foldKey). Veriden/sözlükten çözülemeyen bilinen durumlar için; kısa tutulur.
 * - BRAND_ALIASES: gerçek yazımı kısaltma ya da aksanlı olan ve gruptaki yazımlarla çakışan markalar.
 *   BİM/ŞOK/A101 perakendecileri: veride "Bim" gibi karışık yazım da var, "<= 3 harf büyük kalır" kuralı yetmez.
 *   "Anadolu Çiftliği": veride yalnız ASCII yazımı ("ANADOLU CIFTLIGI") var; sözlük de çözer, alias güvence.
 * - WORD_ALIASES: tamamen büyük kaynakta, sözlükte yeri olmayan ama yazımı bilinen kelimeler (foldKey -> küçük harfli yazım).
 */
export const BRAND_ALIASES = new Map([
  ['bim', 'BİM'],
  ['sok', 'ŞOK'],
  ['a101', 'A101'],
  ['anadolu ciftligi', 'Anadolu Çiftliği'],
]);
export const WORD_ALIASES = new Map([]);

const nfc = (s) => (typeof s === 'string' ? s.normalize('NFC') : s);

/** Marka gruplama anahtarı: NFC, Türkçe küçük harf, aksan katlama (ç->c, ı->i ...), harf/rakam dışı -> boşluk. */
export const foldKey = (s) =>
  nfc(s)
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşüâîûêô]/g, (c) => TR_FOLD[c])
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

const hasLetter = (s) => /\p{L}/u.test(s);
export const isAllUpper = (s) => hasLetter(s) && s === s.toLocaleUpperCase('tr-TR');
export const isAllLower = (s) => hasLetter(s) && s === s.toLocaleLowerCase('tr-TR');
const isMixed = (s) => hasLetter(s) && !isAllUpper(s) && !isAllLower(s);
const letterCount = (s) => (s.match(/\p{L}/gu) ?? []).length;
const diacritics = (s) => (s.match(/[çğıöşüÇĞİÖŞÜ]/g) ?? []).length;
const byCountThenAccent = (a, b) => b[1] - a[1] || diacritics(b[0]) - diacritics(a[0]) || (a[0] < b[0] ? -1 : 1);
const byAccentThenCount = (a, b) => diacritics(b[0]) - diacritics(a[0]) || b[1] - a[1] || (a[0] < b[0] ? -1 : 1);

/**
 * Kelime sözlüğü: veri kümesindeki (ürün ad/markaları, istenirse katalogdaki yemek/gıda adları) doğru yazılmış
 * kelimeler, foldKey anahtarıyla. Yalnız yazımı belirsiz olmayan kelimeler girer: büyük ASCII "I" içeren
 * kelimeler (tamamen büyük metinlerdeki "FISTIK" ya da karışık harfli "Ice"/"Irmak") atlanır; harfsiz, tek harfli,
 * rakamlı ve apostroflu kelimeler de. Aynı anahtarda en sık yazım kazanır (tek bir hatalı "Heınz" 20 "Heinz"i bastırmasın); eşitlikte en çok aksanlı, sonra alfabetik
 * (ASCII'ye indirgenmiş "cikolata" yerine "çikolata"). Dönüş: foldKey -> küçük harfli doğru yazım.
 */
export function buildWordDict(texts) {
  const counts = new Map();
  for (const raw of texts) {
    if (typeof raw !== 'string') continue;
    for (const [token] of raw.normalize('NFC').matchAll(WORD_RE)) {
      if (!/^\p{L}{2,}$/u.test(token) || token.includes('I')) continue;
      const word = token.toLocaleLowerCase('tr-TR');
      const key = foldKey(word);
      const g = counts.get(key) ?? new Map();
      g.set(word, (g.get(word) ?? 0) + 1);
      counts.set(key, g);
    }
  }
  const dict = new Map();
  for (const [key, g] of counts) dict.set(key, [...g.entries()].sort(byCountThenAccent)[0][0]);
  return dict;
}

/** Sözlük/alias yazımı kaynak kelimeyle uyumlu mu: kaynaktaki açık Türkçe harfler (Ç Ğ İ Ö Ş Ü) aynen korunmalı. */
function compatible(word, spelling) {
  if (word.length !== spelling.length) return false;
  for (let i = 0; i < word.length; i++) {
    if (/[ÇĞİÖŞÜ]/.test(word[i]) && word[i].toLocaleLowerCase('tr-TR') !== spelling[i]) return false;
  }
  return true;
}

/**
 * Tamamen büyük harfli bir kelimeyi küçültür; ASCII "I" Türkçede "ı" ya da "i" olabilir. Sıra:
 *  1. Kelimede hiç ASCII "I" yoksa belirsizlik yok: tr-TR kuralı. Açık "İ" her zaman "i" olarak korunur; kelimedeki
 *     ASCII "I"lar (VİTAMIN, HİNDISTAN) aşağıdaki adımlarla ayrıca çözülür.
 *  2. Alias tablosu, sonra veri sözlüğü (foldKey eşleşmesi; kaynaktaki Ç Ğ İ Ö Ş Ü ile çelişmemeli).
 *  3. Çok güçlü kanıt: kelimede Türkçeye özgü harf (ç ğ ö ş ü) var ve hiç ön ünlü (e i ö ü) yok: "I" -> "ı"
 *     (IŞIK -> ışık, FISTIĞI -> fıstığı).
 *  4. Varsayılan "I" -> "i" (LIGHT -> light, VITAMIN -> vitamin); fallback: true döner ve ctx.onFallback çağrılır.
 */
function lowerUpperWord(word, ctx) {
  const tr = word.toLocaleLowerCase('tr-TR');
  if (!word.includes('I')) return { text: tr, fallback: false };
  if (!/['’]/.test(word)) {
    const key = foldKey(word);
    for (const candidate of [WORD_ALIASES.get(key), ctx.dict?.get(key)]) {
      if (candidate && compatible(word, candidate)) return { text: candidate, fallback: false };
    }
  }
  if (/[ÇĞÖŞÜ]/.test(word) && !/[eiöü]/.test(tr)) return { text: tr, fallback: false };
  ctx.onFallback?.(word);
  return { text: word.replace(/I/g, 'i').toLocaleLowerCase('tr-TR'), fallback: true };
}

/**
 * Türkçe başlık biçimi: her kelimenin ilk harfi büyük (i -> İ, ı -> I), gerisi küçük. İlk kelime
 * dışında "ve", "ile", "veya" küçük kalır. Girdi tamamen büyükse kelimeler lowerUpperWord ile küçültülür;
 * tamamen küçükse yalnız ilk harf büyütülür. ctx: { dict, onFallback } (isteğe bağlı).
 */
export function titleTr(input, ctx = {}) {
  const s = nfc(input);
  const upperSource = isAllUpper(s);
  let index = 0;
  return s.replace(WORD_RE, (word, offset) => {
    const first = index++ === 0;
    const lowered = upperSource ? lowerUpperWord(word, ctx) : { text: word, fallback: false };
    const rest = lowered.text;
    if (!first && CONNECTIVES.has(rest.toLocaleLowerCase('tr-TR'))) return rest.toLocaleLowerCase('tr-TR');
    // "lezzet-i efsane" gibi tireden sonraki tek harf (ek) küçük kalır.
    if (word.length === 1 && s[offset - 1] === '-') return rest;
    let head = rest[0].toLocaleUpperCase('tr-TR');
    // Yabancı sözcüklerde ve sözlüksüz ASCII "I" ile başlayan kelimelerde baş harf "I" kalır (ICE -> Ice, IRMAK -> Irmak).
    if (FOREIGN_I_WORDS.has(rest) || (lowered.fallback && word[0] === 'I')) head = 'I';
    return head + rest.slice(1);
  });
}

/** Sayıdan sonra gelen birimlerin yazımı: g, gr, gram, kg, mg, ml, cl, lt, litre küçük; litre simgesi büyük "L". */
export function normalizeUnits(input) {
  return nfc(input).replace(UNIT_RE, (_, num, space, unit) => {
    const u = unit.toLocaleLowerCase('tr-TR').replace('ı', 'i');
    return `${num}${space}${u === 'l' ? 'L' : u}`;
  });
}

/**
 * Markaları Türkçe duyarlı anahtarla (foldKey) gruplar ve her grup için tek görünen biçim seçer.
 *  0. BRAND_ALIASES'ta varsa o yazım.
 *  1. Grupta karışık harfli (ne tamamen büyük ne tamamen küçük) yazım varsa en sık olanı (eşitlikte
 *     aksanı çok olan, sonra az büyük harfli, sonra alfabetik).
 *  2. Yoksa ve grubun tüm yazımları tamamen büyük ve en çok 3 harfliyse kısaltma sayılır, büyük kalır
 *     (örn. "7UP", "MNS").
 *  3. Yoksa en çok aksanlı (sonra en sık) yazım seçilip Türkçe başlık biçimine çevrilir
 *     ("ETİ" -> "Eti", "ÇİFTÇİ" -> "Çiftçi", "tat" -> "Tat").
 * Dönüş: foldKey -> görünen marka. Girdi: { brand, nameTr } ürünleri; ctx: { dict, onFallback }.
 */
export function canonicalBrands(products, ctx = {}) {
  const groups = new Map();
  const add = (key, text) => {
    const g = groups.get(key) ?? new Map();
    g.set(text, (g.get(text) ?? 0) + 1);
    groups.set(key, g);
  };
  for (const p of products) {
    const brand = nfc(p.brand);
    const nameTr = nfc(p.nameTr);
    if (!brand) continue;
    const key = foldKey(brand);
    if (!key) continue;
    add(key, brand);
    // Kanıt: adın başında marka yazılmışsa o yazım da aday olur (LAVI + "Lavi Meyve ..." -> Lavi; DUDOMI + "DUDOMİ ..." -> Dudomi).
    const span = nameTr ? findBrandSpan(nameTr, key, false) : null;
    if (span) add(key, nameTr.slice(span.start, span.end));
  }
  const capitals = (s) => (s.match(/\p{Lu}/gu) ?? []).length;
  const rank = (a, b) => b[1] - a[1] || diacritics(b[0]) - diacritics(a[0]) || capitals(a[0]) - capitals(b[0]) || (a[0] < b[0] ? -1 : 1);
  const out = new Map();
  for (const [key, g] of groups) {
    if (BRAND_ALIASES.has(key)) { out.set(key, BRAND_ALIASES.get(key)); continue; }
    const variants = [...g.entries()];
    const mixed = variants.filter(([v]) => isMixed(v)).sort(rank);
    let display;
    if (mixed.length) display = mixed[0][0];
    else {
      const best = [...variants].sort(byAccentThenCount)[0][0];
      const abbreviation = variants.every(([v]) => isAllUpper(v) && letterCount(v) <= 3);
      display = abbreviation ? best : titleTr(best, ctx);
    }
    out.set(key, normalizeUnits(display));
  }
  return out;
}

/** Adda marka kelimelerinin (tam kelime sınırında, foldKey eşitliğiyle) geçtiği ilk aralık: {start,end} | null. */
function findBrandSpan(name, brandKey, anywhere) {
  const brandWords = brandKey.split(' ').filter(Boolean);
  if (!brandWords.length) return null;
  const tokens = [...name.matchAll(WORD_RE)].map((m) => ({ start: m.index, end: m.index + m[0].length, key: foldKey(m[0]) }));
  // "Hellmann's" gibi apostroflu kelime foldKey ile birden çok parçaya ayrılır; parçalara açıp karşılaştır.
  const parts = [];
  tokens.forEach((t, ti) => t.key.split(' ').forEach((k) => k && parts.push({ k, ti })));
  const last = anywhere ? parts.length - brandWords.length : 0;
  for (let i = 0; i <= last; i++) {
    if (!brandWords.every((w, j) => parts[i + j]?.k === w)) continue;
    const endPart = i + brandWords.length - 1;
    // Marka kelimenin tamamını kaplamalı ("Eti" kelimesi "Etik" içinde eşleşmesin).
    if (parts[i].ti === parts[i - 1]?.ti || parts[endPart].ti === parts[endPart + 1]?.ti) continue;
    return { start: tokens[parts[i].ti].start, end: tokens[parts[endPart].ti].end };
  }
  return null;
}

/** Markayı addaki eşleşmenin yerine yazar; markanın baş/son noktalaması eşleşmenin hemen yanındaysa o da değiştirilir. */
function replaceBrandInName(name, brand, { anywhere }) {
  const span = findBrandSpan(name, foldKey(brand), anywhere);
  if (!span) return name;
  const lead = brand.match(/^[^\p{L}\p{N}]*/u)[0];
  const trail = brand.match(/[^\p{L}\p{N}]*$/u)[0];
  let { start, end } = span;
  if (lead && name.slice(start - lead.length, start) === lead) start -= lead.length;
  if (trail && name.slice(end, end + trail.length) === trail) end += trail.length;
  return name.slice(0, start) + brand + name.slice(end);
}

/**
 * Görünen ad: tamamen büyük ya da tamamen küçük ad Türkçe başlık biçimine çevrilir (karışık harfli
 * ad sahibinin yazımıyla kalır); marka adın başında (başlık biçimine çevrilen adlarda her yerinde)
 * kanonik yazımla değiştirilir; birimler normalizeUnits ile düzeltilir. ctx: { dict, onFallback }.
 */
export function displayName(input, brandInput, ctx = {}) {
  const name = nfc(input);
  const brand = nfc(brandInput);
  const retitle = !isMixed(name);
  let out = retitle ? titleTr(name, ctx) : name;
  if (brand) out = replaceBrandInName(out, brand, { anywhere: retitle });
  return normalizeUnits(out);
}

/**
 * Yalnız nameTr ve brand alanlarını normalleştirir (NFC dahil); yeni liste döner.
 * options.extraTexts: sözlüğe eklenecek ek Türkçe metinler (katalogdaki yemek/gıda adları); options.onFallback(word):
 * sözlükte/kanıtta bulunmayıp "i" varsayımına düşen ASCII-"I" kelimelerini bildirir.
 */
export function normalizeDisplay(products, { extraTexts = [], onFallback } = {}) {
  const nfcProducts = products.map((p) => ({ ...p, brand: nfc(p.brand), nameTr: nfc(p.nameTr) }));
  const dict = buildWordDict([...nfcProducts.flatMap((p) => [p.nameTr, p.brand]), ...extraTexts]);
  const ctx = { dict, onFallback };
  const canon = canonicalBrands(nfcProducts, ctx);
  return nfcProducts.map((p) => {
    const brand = p.brand ? (canon.get(foldKey(p.brand)) ?? p.brand) : p.brand;
    return { ...p, brand, nameTr: displayName(p.nameTr, brand, ctx) };
  });
}

export function sortProducts(list) {
  return list.sort(
    (a, b) => a.brand.localeCompare(b.brand, 'tr') || a.nameTr.localeCompare(b.nameTr, 'tr') || a.code.localeCompare(b.code),
  );
}

export function filterAll(rawProducts, displayOptions = {}) {
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
  const deduped = dedupe(kept);
  for (const [k, v] of Object.entries(deduped.drops)) if (v) dropCounts[k] = v;
  // Yazım normalleştirmesi tekilleştirmeden sonra: tutulan/elenen kayıt değişmez, yalnız görünen metin.
  const products = normalizeDisplay(deduped.products, displayOptions);
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
- Görünen marka ve ad yazımı (yalnız \`nameTr\` ve \`brand\`; besin değeri, barkod, porsiyon, ambalaj miktarı değişmez; tekilleştirmeden sonra uygulanır):
  - Metinler NFC'ye çevrilir. Marka: Türkçe duyarlı anahtarla (büyük/küçük harf, I/İ/ı/i, ç ğ ö ş ü aksanı, noktalama ve boşluk katlanır) aynı markalar gruplanır (ETİ, ETI, Eti, eti -> tek marka). Grupta karışık harfli yazım varsa en sık olan, yoksa Türkçe başlık biçimi (ETİ -> Eti, ÇİFTÇİ -> Çiftçi). Grubun tüm yazımları tamamen büyük ve en çok 3 harfliyse (A101, 7UP) kısaltma sayılıp büyük bırakılır. Küçük alias tablosu (\`BRAND_ALIASES\`: BİM, ŞOK, A101, Anadolu Çiftliği) bu kuralların önüne geçer.
  - Ad: tamamen büyük ya da tamamen küçükse Türkçe başlık biçimine çevrilir (i -> İ, ı -> I; "ve", "ile", "veya" küçük kalır). Karışık harfli ad sahibinin yazımıyla kalır.
  - Tamamen büyük kelimedeki belirsiz ASCII "I" sırasıyla şöyle çözülür: kelimede ASCII "I" yoksa Türkçe kural (açık "İ" her zaman "i" kalır, aynı kelimedeki ASCII "I" aşağıdaki adımlarla çözülür); kelime alias tablosunda ya da veri sözlüğünde varsa oradaki yazım (sözlük: ürün ad/markalarındaki ve katalogdaki yemek/gıda adlarındaki doğru yazılmış kelimeler, foldKey anahtarıyla; en sık yazım, eşitlikte aksanlı; ASCII'ye indirgenmiş "CIFTLIGI" de "çiftliği" olur); kelimede ç ğ ö ş ü varsa ve ön ünlü (e i ö ü) yoksa "ı"; aksi hâlde varsayılan "i" (LIGHT -> Light). Sözlükte bulunmayıp "i" varsayımına düşen kelime sayısı filter-off çıktısında yazılır (\`--list-fallback\` ile liste).
  - Adda marka geçiyorsa marka kanonik yazımla (baş/son noktalamasıyla birlikte) yazılır: başlık biçimine çevrilen adlarda her yerde, diğerlerinde yalnız adın başında.
  - Sayıdan sonraki birimler: g, gr, gram, kg, mg, ml, cl, lt, litre küçük harf; litre simgesi büyük "L" (45 G -> 45 g, 750 Ml -> 750 ml, 1 l -> 1 L).
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
  // Yazım sözlüğüne katalogdaki Türkçe yemek/gıda adları da girer (Zeytinyağı, Kırmızı ... kanıtı).
  const extraTexts = [];
  for (const [file, key] of [['dishes.json', 'dishes'], ['base-foods.json', 'foods']]) {
    try {
      const j = JSON.parse(await readFile(join(here, '..', file), 'utf8'));
      for (const x of j[key] ?? []) extraTexts.push(x.nameTr, ...(x.aliases ?? []));
    } catch { /* dosya yoksa yalnız ürün adları kullanılır */ }
  }
  const fallbackWords = new Map();
  const onFallback = (w) => fallbackWords.set(w, (fallbackWords.get(w) ?? 0) + 1);
  const { products, dropCounts, fromKj, liquids } = filterAll([...byCode.values()], { extraTexts, onFallback });
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
  console.log(`sözlükte/kanıtta olmayıp "i" varsayımına düşen ASCII-I kelime: ${fallbackWords.size}`);
  if (process.argv.includes('--list-fallback')) console.log([...fallbackWords.keys()].sort().join('\n'));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
