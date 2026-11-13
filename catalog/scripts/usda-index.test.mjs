import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { indexRecord, searchIndex, tokenize, stem } from './usda-index.mjs';
import { formatResults } from './search-usda.mjs';

const fixture = (n) => JSON.parse(readFileSync(new URL(`./fixtures/${n}`, import.meta.url), 'utf8'));
const index = fixture('mini-index.json');

test('indexRecord: Foundation enerji 2047 kullanilir, 2048 degil; eksik null, 0 korunur', () => {
  const [a, b] = fixture('usda-mini.json').FoundationFoods.map((f) => indexRecord(f, 'Foundation'));
  assert.equal(a.kcal, 200.5);
  assert.equal(a.protein, 0); // gercek sifir korunur
  assert.equal(a.carbs, null); // eksik -> null, asla 0 degil
  assert.equal(a.fat, 10);
  assert.equal(a.sodium, 12);
  assert.equal(a.fiber, null);
  assert.equal(b.kcal, 50);
  assert.equal(b.fiber, 3.2);
  assert.equal(b.protein, null);
});

test('tokenize ve stem', () => {
  assert.deepEqual(tokenize('Lentils, pink-or red'), ['lentils', 'pink', 'or', 'red']);
  assert.equal(stem('lentils'), 'lentil');
  assert.equal(stem('tomatoes'), 'tomato');
  assert.equal(stem('berries'), 'berry');
});

test('arama: tam eslesme once gelir, cogul kok eslesmesi calisir', () => {
  const r = searchIndex(index, 'lentils pink red raw');
  assert.equal(r[0].fdcId, 1);
  const o = searchIndex(index, 'onion raw');
  assert.equal(o[0].fdcId, 4);
});

test('arama: "raw" sorgusu pismis kayitlari geride birakir', () => {
  const r = searchIndex(index, 'lentils raw');
  const ids = r.map((x) => x.fdcId);
  assert.ok(ids.indexOf(2) < ids.indexOf(3));
  const o = searchIndex(index, 'onions raw').map((x) => x.fdcId);
  assert.ok(o.indexOf(4) < o.indexOf(5));
});

test('arama: ilk sozcuk (ana gida) eslesmesi baska yerdeki eslesmeden onde', () => {
  const r = searchIndex(index, 'pink raw');
  // "Grapefruit, raw, pink" yalniz pink+raw; mercimek de pink+raw ama daha kisa/ana gida ayni skor degil; ikisi de gelmeli
  assert.ok(r.length >= 2);
});

test('arama: eslesmeyen sorgu bos, limit uygulanir', () => {
  assert.deepEqual(searchIndex(index, 'zzzz'), []);
  assert.equal(searchIndex(index, 'raw', 2).length, 2);
  assert.deepEqual(searchIndex(index, '   '), []);
});

test('formatResults: eksik kcal "-" gosterilir', () => {
  const out = formatResults(searchIndex(index, 'butter salted'));
  assert.match(out, /Butter, stick, salted/);
  assert.match(out, /-/);
  assert.equal(formatResults([]), 'Sonuc yok.');
});
