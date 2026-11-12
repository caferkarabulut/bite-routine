# Bite Routine çalışma notları

## Ürün

- Ürün yalnız iOS ve Android mobil uygulamadır (`mobile/`, Expo). Sunucu, hesap, abonelik ve reklam yoktur; tüm kullanıcı verisi cihazda (SQLite) tutulur.
- Yalnız Türkiye mağazalarında yayımlanır. Türkçe ana dil, İngilizce ikinci dil. Birimler gram/kcal; günler Europe/Istanbul.
- Kapsam ve fazlar: [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md). Kapsam dışı özellik ekleme.

## Besin verisi kuralı

- Yemekler için yapay zekâ yalnız tarif üretir (malzeme + gram, pişmiş ağırlık, porsiyon ölçüleri). Besin değerleri her zaman `catalog/` altındaki program tarafından kaynak tablolardan (USDA FoodData Central, CC0) hesaplanır. Yapay zekânın yazdığı kcal/makro sayısı yayımlanmaz.
- Paketli ürünler Open Food Facts Türkiye verisidir (ODbL): uygulamada ve mağaza sayfasında atıf zorunludur.
- Uygulamada değerlerin yaklaşık olduğu ve tıbbi tavsiye olmadığı belirtilir.

## Çalışma kuralları

- Başlamadan önce Git durumunu ve `docs/PROJECT_STATUS.md` dosyasını oku; yerel değişiklikleri koru.
- Paralel çalışan ajanlar aynı dosyaya aynı anda dokunmaz; her ajana önceden dosya seti veya ayrı worktree atanır.
- Commit, PR ve kod/belge dosyalarına yapay zekâ aracı imzası veya "ile yapıldı" notu eklenmez.
- İmzalama sertifikası, keystore, mağaza API anahtarı veya `.env` dosyası commit edilmez.
- `mobile/` içinde iş bitmeden: `npm run check:deps`, `npm run typecheck`, `npm run lint`, `npm test`. Expo API'leri için `mobile/AGENTS.md` kurallarına uy.
- Commit mesajları kısa; PR açıklaması yapılan değişikliği ve doğrulamayı birkaç cümleyle anlatır. Merge ve mağazaya gönderim yalnız açık görev kapsamında yapılır.
- Sonuçta çalışan kontrolleri, kalan engeli ve gereken manuel işlemi kısa raporla.
