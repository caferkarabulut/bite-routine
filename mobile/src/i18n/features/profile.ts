// Strings for the "profile" screens. Owned by the agent that builds src/features/profile.
import type { Translations } from "../en";

export const profileTr = {
  title: "Profil",
  choose: "Seç",
  carbsShort: "Karb.",
  manualTargets: "Hedefleri elle ayarla",
  update: "Güncelle",
  updated: "Güncellendi.",
  updateHint: "Bilgilerin, aktiviten, amacın ve hedefin tek dokunuşla güncellenir.",
  welcomeText: "Günlük hedefini hesaplayalım. Verilerin yalnız telefonunda kalır.",
  formTitle: "Seni tanıyalım",
  start: "Başla",
  previewTitle: "Hesaplanan hedefin",
  previewEmpty: "Bilgileri doldurunca günlük hedefin burada görünür.",
  resultTitle: "Günlük hedefin",
  overrideKcal: "Kalori hedefi (kcal)",
  overrideProtein: "Protein hedefi (g)",
  calculatedValue: "Hesaplanan: {value}",
  fixErrors: "Kırmızı işaretli alanları düzelt.",
} as const;

export const profileEn: Translations<typeof profileTr> = {
  title: "Profile",
  choose: "Choose",
  carbsShort: "Carbs",
  manualTargets: "Set targets manually",
  update: "Update",
  updated: "Updated.",
  updateHint: "Update your details, activity, goal and targets with one tap.",
  welcomeText: "Let’s calculate your daily target. Your data stays on your phone.",
  formTitle: "Let's get to know you",
  start: "Get started",
  previewTitle: "Your calculated target",
  previewEmpty: "Fill in your details and your daily target appears here.",
  resultTitle: "Your daily target",
  overrideKcal: "Calorie target (kcal)",
  overrideProtein: "Protein target (g)",
  calculatedValue: "Calculated: {value}",
  fixErrors: "Fix the fields marked in red.",
};
