# Mobil mimari (yerel uygulama)

Uygulama tamamen cihazda çalışır: sunucu, hesap ve ağ isteği yoktur. Kapsam: [proje durumu](../../docs/PROJECT_STATUS.md). Ortak tipler: [`src/types.ts`](../src/types.ts) (yalnız koordinatör değiştirir).

## Katmanlar

| Klasör | İçerik | Bağımlılık |
| --- | --- | --- |
| `src/db/` | expo-sqlite veritabanı, şema/migration, repository fonksiyonları, yedekleme/geri yükleme/silme, `DatabaseProvider` | `types.ts` |
| `src/domain/` | Saf fonksiyonlar: hedef hesabı, besin/porsiyon hesabı, toplamlar, İstanbul günü, sayı ayrıştırma | `types.ts` |
| `src/i18n/` | TR/EN sözlükleri, `I18nProvider`, `useI18n()`, biçimlendirme | `types.ts`, `domain/dates`, expo-localization |
| `src/catalog/` | Gömülü katalog (`assets/catalog.json`), Türkçe arama, kategori adları | `types.ts` |
| `src/ui/` | Tasarım değerleri ve ortak bileşenler (`Screen`, `Card`, `Button`, `TextField`, `ChoiceChips`, `ListRow`, `ProgressBar`, durum ekranları, `AmountInput`, `MealSlotPicker`, `DayNavigator`) | `domain`, `i18n` |
| `src/state/` | `AppStateProvider` / `useAppState()`: ayarlar, profil, hedefler, `dataVersion` | `db`, `domain` |
| `src/app/` | Expo Router yolları; her dosya bir `features/` ekranını dışa aktaran tek satırdır | `features` |
| `src/features/<alan>/` | Ekranlar ve o alana özel bileşenler (Dalga B) | hepsi |

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

## Dalga B: ekranlar

### Yollar ve sahiplik

| Yol | Ekran | Alan (sahip) |
| --- | --- | --- |
| `/onboarding` | `OnboardingScreen`: ilk açılışta profil + hesaplanan hedef | `features/profile` |
| `/profile` | `ProfileScreen`: profili ve hedef override'larını düzenleme | `features/profile` |
| `/` (sekme) | `TodayScreen`: gün seçimi, kalan kcal, makrolar, öğün grupları, su | `features/today` |
| `/entry/[id]` | `EntryEditScreen`: kaydın miktarını/öğününü/gününü değiştirme, silme | `features/today` |
| `/catalog` (sekme) | `CatalogScreen`: arama, kategoriler, favoriler, yemeklerim | `features/catalog` |
| `/food/[id]?date=&meal=` | `FoodDetailScreen`: 100 g değerleri, porsiyon, günlüğe ekleme, favori; `id` katalog kimliği veya `custom-…` | `features/catalog` |
| `/custom-food?id=` | `CustomFoodScreen`: kendi yemeğini oluşturma/düzenleme/silme | `features/catalog` |
| `/history` (sekme) | `HistoryScreen`: 7 günlük özet, güne dokununca o günü açar | `features/history` |
| `/weight` | `WeightScreen`: kilo kaydı ve basit grafik | `features/history` |
| `/settings` (sekme) | `SettingsScreen`: profil bağlantısı, dil, su hedefi, hatırlatıcılar, yedekle/geri yükle, tüm verileri sil, bağlantılar | `features/settings` |
| `/sources` | `SourcesScreen`: USDA ve Open Food Facts atıfları, yaklaşık değer açıklaması | `features/settings` |
| `/privacy` | `PrivacyScreen`: verinin yalnız cihazda kaldığını anlatan gizlilik metni | `features/settings` |

`src/app/**`, `src/ui/**`, `src/state/**`, `types.ts` ve paket listesi koordinatöre aittir. Her ekran ajanı yalnız kendi `src/features/<alan>/` klasörünü, kendi metin dosyasını `src/i18n/features/<alan>.ts` ve kendi testlerini `__tests__/<alan>-*.test.tsx` değiştirir. Başka alanın bileşenine ihtiyaç olursa kopyalamak yerine `src/ui` için koordinatöre öneri yazılır.

### Ortak kurallar

- Metinler `t()` ile: genel anahtarlar `src/i18n/tr.ts` içinde hazırdır (salt okunur); alana özel yeni metinler `features.<alan>.*` altına, Türkçe ve İngilizce birlikte eklenir.
- Veri: `useDb()` ile repository fonksiyonları; yazdıktan sonra `notifyDataChanged()`; okuyan ekranlar `dataVersion` değişince yeniden okur. Profil/ayar yalnız `useAppState()` üzerinden kaydedilir.
- Gün: `todayInIstanbul()`; tarih göstermek için `formatDate`; sayılar `formatKcal`/`formatGrams`/`formatNumber`. null değer "Veri yok" (`common.noData`) olur.
- Katalog ve kendi yemekleri: `getCatalogItem(id)` veya `getCustomFood(db, id)`; günlüğe eklerken ad ve 100 g değerleri anlık kopya olarak yazılır.
- Erişilebilirlik: her dokunulabilir öğenin etiketi var, en az 48 pt; renk tek bilgi kaynağı değil.
- Yükleniyor/boş/hata durumları `Loading`/`EmptyState`/`ErrorState` ile.
- Gezinme: `router.push("/food/" + id)` gibi; parametreler `useLocalSearchParams`.
