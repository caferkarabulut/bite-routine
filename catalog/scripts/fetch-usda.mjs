// USDA FoodData Central toplu JSON veri setlerini .cache/usda altina indirir ve acar.
// Kullanim: node scripts/fetch-usda.mjs   (zaten varsa atlar)
import { existsSync, mkdirSync, createWriteStream, renameSync } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { USDA_BASE_URL, USDA_DATASETS, usdaCacheDir } from './config.mjs';

export async function fetchUsda(dir = usdaCacheDir()) {
  mkdirSync(dir, { recursive: true });
  for (const ds of USDA_DATASETS) {
    const jsonPath = join(dir, ds.json);
    const zipPath = join(dir, ds.zip);
    if (existsSync(jsonPath)) {
      console.log(`[atlandi] ${ds.name}: ${ds.json} zaten var`);
      continue;
    }
    if (!existsSync(zipPath)) {
      const url = USDA_BASE_URL + ds.zip;
      console.log(`[indiriliyor] ${ds.name}: ${url}`);
      const res = await fetch(url);
      if (!res.ok || !res.body) throw new Error(`${url} indirilemedi: HTTP ${res.status}`);
      const part = zipPath + '.part';
      await pipeline(Readable.fromWeb(res.body), createWriteStream(part));
      renameSync(part, zipPath);
    } else {
      console.log(`[atlandi] ${ds.name}: ${ds.zip} zaten indirilmis`);
    }
    console.log(`[aciliyor] ${ds.zip}`);
    execFileSync('unzip', ['-o', '-q', zipPath, '-d', dir], { stdio: 'inherit' });
    if (!existsSync(jsonPath)) throw new Error(`${ds.zip} icinde ${ds.json} bulunamadi`);
  }
  console.log('USDA verisi hazir:', dir);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fetchUsda().catch((e) => { console.error(e.message); process.exit(1); });
}
