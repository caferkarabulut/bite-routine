// Strings for the "today" screens. Owned by the agent that builds src/features/today.
import type { Translations } from "../en";

export const todayTr = {
  eatenOfGoal: "{eaten} / {goal} kcal",
  macroOfGoal: "{eaten} / {goal} g",
  macroEaten: "{eaten} g",
  incompleteData: "Bazı kayıtların besin değeri bilinmiyor; toplamlar eksik olabilir.",
  addToMeal: "{meal} öğününe yemek ekle",
  entryNotFound: "Kayıt bulunamadı.",
  foodMissing: "Bu yemek artık bulunamıyor; yalnız kayıtlı porsiyon veya gram kullanılabilir.",
  deleteTitle: "Kayıt silinsin mi?",
  deleteEntry: "Kaydı sil",
  caloriesPreview: "{kcal} kcal",
  openEntry: "Kaydı düzenle",
} as const;

export const todayEn: Translations<typeof todayTr> = {
  eatenOfGoal: "{eaten} / {goal} kcal",
  macroOfGoal: "{eaten} / {goal} g",
  macroEaten: "{eaten} g",
  incompleteData: "Some entries have no nutrition data; totals may be incomplete.",
  addToMeal: "Add food to {meal}",
  entryNotFound: "Entry not found.",
  foodMissing: "This food is no longer available; only the saved portion or grams can be used.",
  deleteTitle: "Delete this entry?",
  deleteEntry: "Delete entry",
  caloriesPreview: "{kcal} kcal",
  openEntry: "Edit entry",
};
