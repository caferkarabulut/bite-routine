# Proje durumu

## Karar (13 Kasım 2026)

Bite Routine, App Store ve Google Play'de yalnız Türkiye için yayımlanacak ücretsiz, cihazda çalışan bir kalori ve öğün günlüğüdür. Sunucu ve hesap yoktur. Bitirme projesinin Python backend'i, Next.js web istemcisi ve sonraki .NET API'si repodan kaldırıldı; Git geçmişinde durur. .NET API'nin USDA kaynak verisi `catalog/sources/` altına taşındı.

## İlk sürüm kapsamı

| Ekran | İçerik |
| --- | --- |
| İlk açılış / profil | Yaş, boy, kilo, cinsiyet, aktivite, amaç; otomatik kalori/protein hedefi, elle değiştirilebilir |
| Bugün | Hedefe göre kalori ve makrolar, öğünler, su |
| Katalog | Türk yemekleri, temel gıdalar, paketli ürünler; Türkçe arama (barkod yok); gram veya porsiyon ölçüsüyle ekleme |
| Kendi yemeğim | Ad ve besin değerleri elle; yalnız cihazda |
| Geçmiş, kilo, favoriler | 7 günlük özet, kilo kaydı ve grafiği |
| Ayarlar | Hatırlatıcı bildirimler, dil, yedekle/geri yükle, kaynaklar ve lisanslar, gizlilik, tüm verileri sil |

Kapsam dışı: hesap, senkronizasyon, barkod, fotoğrafla tahmin, abonelik, reklam.

## Fazlar

| Faz | İçerik | Durum |
| --- | --- | --- |
| 0 | Repo temizliği, Expo sürüm uyumu, belgeler | Tamamlandı |
| 1 | Veri hattı: 100 Türk yemeği tarifi, 80 USDA temel gıda, malzeme eşleştirme ve hesap programı, bağımsız denetim ([süreç](AI_WORKFLOW.md)) | Tamamlandı; Open Food Facts Türkiye paketli ürünleri ayrı teslim edilecek |
| 2 | Uygulama: yerel SQLite katmanı, TR/EN dil altyapısı, tüm ekranlar ([mimari](../mobile/docs/ARCHITECTURE.md)) | Kod tamam, 306 test; Simulator'da açılış doğrulandı, uçtan uca elle test bekliyor |
| 3 | Görsel tasarım turu | Bekliyor |
| 4 | Test: otomatik testler, Simulator, fiziksel cihazlar | Bekliyor |
| 5 | Yayın: gizlilik politikası, mağaza formları, Google Play 12 kişi / 14 gün kapalı test, gönderim | Bekliyor |

## Notlar

- Google Play hesabı kişisel ve yeni: yayından önce 12 test kullanıcısının 14 gün kapalı testte kalması gerekir. Kapalı test ilk çalışan sürümle başlatılabilir.
