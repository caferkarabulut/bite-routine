# Mobil mimari (yerel uygulama)

Uygulama tamamen cihazda çalışır: sunucu, hesap ve ağ isteği yoktur. Kapsam: [proje durumu](../../docs/PROJECT_STATUS.md). Ortak tipler: [`src/types.ts`](../src/types.ts) (yalnız koordinatör değiştirir).

## Katmanlar

| Klasör | İçerik | Bağımlılık |
| --- | --- | --- |
| `src/db/` | expo-sqlite veritabanı, şema/migration, repository fonksiyonları, yedekleme/geri yükleme/silme, `DatabaseProvider` | `types.ts` |
| `src/domain/` | Saf fonksiyonlar: hedef hesabı, besin/porsiyon hesabı, toplamlar, İstanbul günü, sayı ayrıştırma | `types.ts` |
| `src/i18n/` | TR/EN sözlükleri, `I18nProvider`, `useI18n()` | `types.ts`, expo-localization |
| `src/catalog/` | Gömülü katalog (`assets/catalog.json`), Türkçe arama, kategori adları | `types.ts` |
| `src/app/` | Expo Router ekranları (Dalga B) | hepsi |
| `src/components/` | Ortak arayüz bileşenleri (Dalga B) | hepsi |

Katmanlar birbirini doğrudan çağırmaz; ekranlar birleştirir. `domain`, `catalog` ve `i18n` React Native API'si dışında saf TypeScript'tir ve Node'da test edilir.

## Modül sözleşmeleri

### `src/db/` (Dalga A, veri ajanı)

- `type Db` = expo-sqlite'ın async API'sinin kullanılan alt kümesi (`execAsync`, `runAsync`, `getAllAsync`, `getFirstAsync`, `withTransactionAsync`). Testler bunu `node:sqlite` üzerine kurulmuş bir adaptörle karşılar.
- `openDatabase(): Promise<Db>` ve `migrate(db)`: `PRAGMA user_version` ile sıralı migration; yabancı anahtarlar açık.
- Repository fonksiyonları ilk parametre olarak `db` alır:
  - profil: `getProfile`, `saveProfile`
  - günlük: `listEntriesByDate(date)`, `listEntriesInRange(start, end)`, `addEntry(NewDiaryEntry)`, `updateEntry(id, DiaryEntryPatch)`, `deleteEntry(id)`
  - kendi yemeklerim: `listCustomFoods`, `getCustomFood`, `saveCustomFood`, `deleteCustomFood` (günlük kopyaları etkilenmez)
  - favoriler: `listFavorites`, `addFavorite(FoodRef)`, `removeFavorite`, `isFavorite`
  - su: `getWater(date)`, `setWater(date, ml)`, `addWater(date, deltaMl)` (0 altına inmez)
  - kilo: `listWeights`, `addWeight(date, kg)` (aynı gün varsa günceller), `deleteWeight(id)`
  - ayarlar: `getSettings` (varsayılan: `language: null`, `waterGoalMl: 2000`, `reminders: []`), `saveSettings`
  - yedek: `exportBackup(db): BackupFile`, `validateBackup(unknown): BackupFile | hata listesi`, `importBackup(db, BackupFile)` (tek transaction; mevcut veriyi değiştirir), `wipeAllData(db)`
- `DatabaseProvider` / `useDb()`: uygulama açılışında açar, migrate eder, hata durumunu bildirir.
- Kimlikler `expo-crypto` olmadan üretilebilir (`Date.now()` + rastgele); tarih/saat ISO metni.

### `src/domain/` (Dalga A, hesap ve dil ajanı)

- `calculateTargets(profile, today: LocalDate): Targets`: Mifflin-St Jeor BMR × aktivite katsayısı (1,2 / 1,375 / 1,55 / 1,725 / 1,9); amaç: ver −500, koru 0, al +300 kcal; alt sınır kadın 1200, erkek 1500 kcal; protein `weightKg × (ver 1,6 / koru 1,2 / al 1,6)` g; yağ enerjinin %30'u; karbonhidrat kalan enerji. Override varsa kcal/protein onu kullanır, diğerleri yeniden dağıtılır. Tam sayıya yuvarlanır.
- `nutrientsForGrams(per100g, grams): Nutrients` (null korunur), `sumNutrients(list): Nutrients` (bir öğe null ise o alan null), `gramsForPortion(gramsPerUnit, quantity)` (iki ondalık).
- `parseAmount(text)`: "1,5", "1.5", " 150 " → sayı; geçersiz veya ≤0 → null.
- Tarih: `todayInIstanbul(now?: Date): LocalDate`, `addDays(date, n)`, `daysBetween`, `weekRange(endDate)`; İstanbul UTC+3, yaz saati yok ama `Intl` ile hesaplanır.

### `src/i18n/` (Dalga A, hesap ve dil ajanı)

- `tr.ts` (kaynak) ve `en.ts`; anahtarlar iç içe nesne, `en` aynı anahtar ağacına sahip olmak zorunda (tip ile zorlanır).
- `t(key, params?)` basit `{name}` yer tutucuları; sayı biçimi `formatNumber(n, lang, digits)` (TR'de virgül).
- `I18nProvider` dili `Settings.language`'tan, yoksa cihaz dilinden (expo-localization; `en*` ise İngilizce, aksi Türkçe) alır. `useI18n()` → `{ lang, t, setLanguage }`.
- Dalga A'da ekranlar için başlangıç anahtarları: sekme adları, öğün adları, aktivite/amaç adları, ortak butonlar (Kaydet, Vazgeç, Sil, Ekle), boş/hata durumları, sağlık uyarısı, kaynak atıfları.

### `src/catalog/` (Dalga A, katalog ajanı)

- `scripts/sync-catalog.mjs`: `../catalog/dist/catalog.json` → `assets/catalog.json`; `--check` farklıysa hata verir (CI).
- `getCatalog(): CatalogItem[]`, `getCatalogItem(id)`, `searchCatalog(query, { kinds?, category?, limit? })`: Türkçe küçük harf (`tr` locale), aksan duyarsız eşleşme (ç→c vb.), ad ve takma adlarda; önce tam/önek eşleşme, sonra kelime başı, sonra içerir; boş sorguda kategoriye göre liste.
- `CATEGORY_LABELS: Record<string, { tr: string; en: string }>` (10 yemek kategorisi + `temel-gida` + `paketli`).

## Kurallar

- Tüm değerler yaklaşık gösterilir; null "Veri yok" olur, 0 sayılmaz.
- Kullanıcıya gösterilen gün İstanbul günüdür.
- Ağ isteği yapılmaz. Analitik, reklam veya izleme kütüphanesi eklenmez.
- Paket listesi (`package.json`) yalnız koordinatör tarafından değiştirilir.
- Her ajan yalnız kendisine atanan klasörde ve kendi test dosyalarında (`__tests__/<alan>-*.test.ts`) çalışır.
