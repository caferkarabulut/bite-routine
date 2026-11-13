# Mağaza gönderim belgeleri

- [App Store Connect](app-store.md): iOS ürün sayfası, gizlilik, yaş derecelendirmesi ve inceleme bilgileri. tr-TR ve en-US alanları hazırdır.
- [Google Play Console](google-play.md): Android mağaza açıklaması, Data safety, IARC, hedef kitle, sağlık uygulaması bildirimi ve test planı. tr-TR ve en-US alanları hazırdır.

Bundle/package kimliği: `com.biteroutine.mobile`. Uygulama adı: `Bite Routine`. Yayın ülkesi: yalnız Türkiye.

## Sahip için sıralı kontrol listesi

1. Son iOS ve Android derlemelerini gerçek cihazlarda gözden geçirin; ekran görüntülerini alın ve mağaza içerikleriyle özelliklerin eşleştiğini doğrulayın. Proje durumu belgesinde fiziksel cihaz ve uçtan uca kontroller bekliyor.
2. Her iki konsolda uygulama kaydını açın ve kimliği `com.biteroutine.mobile` olarak doğrulayın. Dil alanlarını tr-TR ve en-US olarak ekleyin; kullanılabilirliği Türkiye ile sınırlayın.
3. [App Store belgesindeki](app-store.md) alanları yapıştırın. Apple gizlilik yanıtını, yaş derecelendirmesi sorularını ve kategori önerisini uygulamanın son derlemesiyle karşılaştırın. Export compliance yanıtı `app.json`'daki `ITSAppUsesNonExemptEncryption: false` ile verilir; yeni bir şifreleme veya ağ bağımlılığı eklendiyse yeniden değerlendirin.
4. Apple destek URL'sini gönderimden önce gözden geçirin: Apple'ın destek URL'si için resmi açıklaması, kullanıcıya gerçek iletişim bilgisi sunulmasını bekliyor. Mevcut GitHub Issues tek destek kanalıdır; sahibin bu koşulun karşılandığını doğrulaması gerekir.
5. [Google Play belgesindeki](google-play.md) listeleme, Data safety, IARC, hedef kitle ve Health apps declaration alanlarını doldurun. Zorunlu destek e-postası için gerçek adresi uygulama sahibi eklemelidir; taslakta adres uydurulmamıştır.
6. Google Play kapalı testini başlatın. Yeni kişisel geliştirici hesabı için en az 12 test kullanıcısının kesintisiz 14 gün katılmış olması gerekir. Test süresini, katılımı ve geri bildirimleri kaydedin; ardından üretim erişimi başvurusunu yapın.
7. Gizlilik ve destek bağlantılarını, kaynak atıflarını ve tüm mağaza metnini önizleyin. Uygulama verilerinin yalnız cihazda tutulduğunu, yedeklemenin kullanıcı tarafından başlatıldığını ve reklam olmadığını doğrulayın.
8. Her iki mağazanın değerlendirme notlarını, gizlilik formlarını, derecelendirme sonuçlarını ve yüklenen derlemeyi yeniden kontrol edin; yalnız ondan sonra gönderim yapın.

## Resmi kaynaklar

Kaynaklar 13 Kasım 2026 tarihinde kontrol edildi. Ayrıntılı, alan bazlı kaynak listeleri ilgili mağaza belgesinin sonundadır. Konsol ekranları hesap türüne veya değişen arayüze göre farklılaşabilir; göndermeden önce son ekrandaki yönergeleri esas alın.
