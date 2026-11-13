// Open Food Facts Türkiye ürünlerini API v2 ile sayfa sayfa indirir.
// Her sayfa .cache/off/page-NNN.json olarak saklanır; yeniden çalıştırınca eksik sayfalardan devam eder.
// Kullanım: node catalog/packaged/fetch-off.mjs [--refresh] [--max-pages N]
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const CACHE_DIR = join(here, '..', '.cache', 'off');
const USER_AGENT = 'BiteRoutine/0.1 (catalog build)';
const PAGE_SIZE = 100;
const MIN_INTERVAL_MS = 6500; // OFF arama sınırı ~10 istek/dk
const MAX_ATTEMPTS = 12;
const FIELDS = [
  'code', 'product_name', 'product_name_tr', 'generic_name_tr', 'brands', 'quantity',
  'serving_size', 'serving_quantity', 'nutrition_data_per', 'lang', 'states_tags', 'completeness',
  'nutriments.energy-kcal_100g', 'nutriments.energy-kj_100g', 'nutriments.energy_100g',
  'nutriments.proteins_100g', 'nutriments.carbohydrates_100g', 'nutriments.fat_100g',
  'nutriments.alcohol_100g', 'nutriments.polyols_100g',
].join(',');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pageFile = (name, n) => join(CACHE_DIR, `${name}-${String(n).padStart(3, '0')}.json`);

// Anonim v2 arama 10. sayfadan sonrasını (page_size=100 için 1000 sonuç) reddeder (HTTP 401);
// bu yüzden sorgu Nutri-Score derecesine göre bölünür. Büyük bölümler (unknown) farklı sıralamalarla
// tekrar çekilip barkoda göre birleştirilir. "all-default" önceden alınmış sıralamasız ilk 10 sayfadır.
const PARTITIONS = [
  ...['a', 'b', 'c', 'd', 'e', 'not-applicable'].map((g) => ({ name: `grade-${g}`, params: `&nutrition_grades_tags=${g}` })),
  ...['created_t', 'last_modified_t', 'unique_scans_n', 'popularity_key', 'completeness'].map((s) => ({
    name: `unknown-${s}`, params: `&nutrition_grades_tags=unknown&sort_by=${s}`,
  })),
];

function url(params, page) {
  return `https://world.openfoodfacts.org/api/v2/search?countries_tags_en=turkey&page_size=${PAGE_SIZE}&page=${page}${params}&fields=${FIELDS}`;
}

async function fetchPage(params, page) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let wait = Math.min(60_000, 8_000 * 2 ** Math.min(attempt - 1, 3));
    try {
      const res = await fetch(url(params, page), {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(90_000),
      });
      const retryAfter = Number(res.headers.get('retry-after'));
      if (retryAfter > 0) wait = Math.max(wait, retryAfter * 1000);
      const text = await res.text();
      if (res.ok) {
        try {
          const json = JSON.parse(text);
          if (Array.isArray(json.products)) return json;
          console.warn(`sayfa ${page}: products dizisi yok`);
        } catch {
          console.warn(`sayfa ${page}: JSON değil (HTML hata sayfası olabilir)`);
        }
      } else {
        console.warn(`sayfa ${page}: HTTP ${res.status}`);
        if (res.status === 401 && page > 10) return 'end';
        if (res.status >= 400 && res.status < 500 && res.status !== 429 && res.status !== 408) {
          throw new Error(`kalıcı HTTP hatası ${res.status}`);
        }
      }
    } catch (err) {
      if (String(err.message).startsWith('kalıcı')) throw err;
      console.warn(`sayfa ${page}: ${err.message}`);
    }
    if (attempt < MAX_ATTEMPTS) {
      console.warn(`  ${Math.round(wait / 1000)} sn sonra yeniden denenecek (${attempt}/${MAX_ATTEMPTS})`);
      await sleep(wait);
    }
  }
  throw new Error(`sayfa ${page} ${MAX_ATTEMPTS} denemede alınamadı`);
}

async function main() {
  const args = process.argv.slice(2);
  const refresh = args.includes('--refresh');
  await mkdir(CACHE_DIR, { recursive: true });
  let lastRequest = 0;
  let network = 0;
  for (const part of PARTITIONS) {
    let total = null;
    for (let page = 1; page <= 10; page++) {
      if (total !== null && (page - 1) * PAGE_SIZE >= total) break;
      const file = pageFile(part.name, page);
      if (!refresh && existsSync(file)) {
        total = JSON.parse(await readFile(file, 'utf8')).count;
        continue;
      }
      const gap = lastRequest + MIN_INTERVAL_MS - Date.now();
      if (gap > 0) await sleep(gap);
      lastRequest = Date.now();
      const json = await fetchPage(part.params, page);
      lastRequest = Date.now();
      network++;
      if (json === 'end') break;
      total = json.count;
      const slim = { partition: part.name, count: json.count, page: json.page, page_size: json.page_size, fetchedAt: new Date().toISOString(), products: json.products };
      await writeFile(`${file}.tmp`, JSON.stringify(slim));
      await rename(`${file}.tmp`, file);
      console.log(`${part.name} sayfa ${page}/${Math.min(10, Math.ceil(total / PAGE_SIZE))}: ${json.products.length} ürün (bölüm toplamı ${total})`);
      if (json.products.length === 0) break;
    }
  }
  console.log(`bitti; ${network} sayfa indirildi.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
