// Strings for the "profile" screens. Owned by the agent that builds src/features/profile.
import type { Translations } from "../en";

export const profileTr = {
  welcomeText: "Ücretsiz, çevrimdışı bir kalori günlüğü. Verilerin yalnız telefonunda kalır.",
  formTitle: "Seni tanıyalım",
  start: "Başla",
  previewTitle: "Günlük hedefin (önizleme)",
  previewEmpty: "Bilgileri doldurunca günlük hedefin burada görünür.",
  resultTitle: "Kullanılacak hedef",
  overrideKcal: "Kalori hedefi (kcal)",
  overrideProtein: "Protein hedefi (g)",
  calculatedValue: "Hesaplanan: {value}",
  fixErrors: "Kırmızı işaretli alanları düzelt.",
} as const;

export const profileEn: Translations<typeof profileTr> = {
  welcomeText: "A free, offline calorie diary. Your data stays on your phone.",
  formTitle: "Let's get to know you",
  start: "Get started",
  previewTitle: "Your daily target (preview)",
  previewEmpty: "Fill in your details and your daily target appears here.",
  resultTitle: "Target in use",
  overrideKcal: "Calorie target (kcal)",
  overrideProtein: "Protein target (g)",
  calculatedValue: "Calculated: {value}",
  fixErrors: "Fix the fields marked in red.",
};
