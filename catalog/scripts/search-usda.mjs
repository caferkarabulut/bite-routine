// Kullanim: node scripts/search-usda.mjs "lentils red raw" [--limit 15]
import { fileURLToPath } from 'node:url';
import { loadIndex, searchIndex } from './usda-index.mjs';

const fmt = (v) => (v === null || v === undefined ? '  -  ' : String(Math.round(v * 10) / 10).padStart(5));

export function formatResults(results) {
  if (results.length === 0) return 'Sonuc yok.';
  const lines = ['fdcId    tip         kcal  prot carb   fat  aciklama'];
  for (const r of results) {
    lines.push(
      `${String(r.fdcId).padEnd(8)} ${r.dataType.padEnd(11)} ${fmt(r.kcal)} ${fmt(r.protein)} ${fmt(r.carbs)} ${fmt(r.fat)}  ${r.description}`,
    );
  }
  lines.push('(kcal/protein/karbonhidrat/yag: 100 g basina; "-" = veri yok)');
  return lines.join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  let limit = 15;
  const li = args.indexOf('--limit');
  if (li >= 0) { limit = Number(args[li + 1]) || 15; args.splice(li, 2); }
  const query = args.join(' ').trim();
  if (!query) { console.error('Kullanim: node scripts/search-usda.mjs "lentils red raw" [--limit 15]'); process.exit(2); }
  try {
    console.log(formatResults(searchIndex(loadIndex(), query, limit)));
  } catch (e) { console.error(e.message); process.exit(1); }
}
