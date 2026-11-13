// Tek yerde tutulan sabitler: USDA veri seti adresleri, dosya yollari, besin kimlikleri.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CATALOG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const USDA_BASE_URL = 'https://fdc.nal.usda.gov/fdc-datasets/';

// Surum/tarih degisirse yalnizca burasi guncellenir.
export const USDA_DATASETS = [
  {
    name: 'SR Legacy',
    dataType: 'SR Legacy',
    rootKey: 'SRLegacyFoods',
    zip: 'FoodData_Central_sr_legacy_food_json_2018-04.zip',
    json: 'FoodData_Central_sr_legacy_food_json_2018-04.json',
  },
  {
    name: 'Foundation',
    dataType: 'Foundation',
    rootKey: 'FoundationFoods',
    zip: 'FoodData_Central_foundation_food_json_2026-10-29.zip',
    json: 'FoodData_Central_foundation_food_json_2026-10-29.json',
  },
];

// Besin kimlikleri (USDA nutrient.id). Enerji: once 1008, yoksa 2047 (Foundation Atwater genel). 2048 kullanilmaz.
export const NUTRIENT_IDS = {
  kcal: [1008, 2047],
  protein: [1003],
  carbs: [1005],
  fat: [1004],
  fiber: [1079],
  sodium: [1093],
};

export const CATEGORIES = [
  'corba', 'baklagil', 'kahvalti', 'et-tavuk', 'pilav-makarna',
  'sebze-zeytinyagli', 'salata-meze', 'hamur-isi', 'tatli', 'icecek',
];

export function usdaCacheDir(root = CATALOG_ROOT) {
  return join(root, '.cache', 'usda');
}
export function usdaIndexPath(root = CATALOG_ROOT) {
  return join(usdaCacheDir(root), 'index.json');
}
