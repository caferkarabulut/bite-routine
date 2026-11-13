export type CategoryLabel = { tr: string; en: string };

export const CATEGORY_LABELS: Record<string, CategoryLabel> = {
  corba: { tr: "Çorbalar", en: "Soups" },
  baklagil: { tr: "Baklagil yemekleri", en: "Legume dishes" },
  kahvalti: { tr: "Kahvaltılıklar ve yumurta", en: "Breakfast and eggs" },
  "et-tavuk": { tr: "Et, tavuk, köfte ve kebaplar", en: "Meat, chicken, meatballs and kebabs" },
  "pilav-makarna": { tr: "Pilav, makarna, bulgur, mantı", en: "Rice, pasta, bulgur, manti" },
  "sebze-zeytinyagli": { tr: "Sebze yemekleri ve zeytinyağlılar", en: "Vegetable dishes and olive oil dishes" },
  "salata-meze": { tr: "Salata ve mezeler", en: "Salads and mezes" },
  "hamur-isi": { tr: "Börek, pide, lahmacun, simit, poğaça", en: "Pastries, pide, lahmacun, simit" },
  tatli: { tr: "Tatlılar", en: "Desserts" },
  icecek: { tr: "İçecekler", en: "Drinks" },
  "temel-gida": { tr: "Temel gıdalar", en: "Basic foods" },
  paketli: { tr: "Paketli ürünler", en: "Packaged products" },
};

export const CATEGORY_ORDER: readonly string[] = [
  "temel-gida",
  "corba",
  "baklagil",
  "kahvalti",
  "et-tavuk",
  "pilav-makarna",
  "sebze-zeytinyagli",
  "salata-meze",
  "hamur-isi",
  "tatli",
  "icecek",
  "paketli",
];

/** Label for a category key; unknown keys fall back to the key itself. */
export function categoryLabel(category: string, lang: "tr" | "en"): string {
  return CATEGORY_LABELS[category]?.[lang] ?? category;
}
