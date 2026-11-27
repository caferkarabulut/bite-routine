# Yeni oturum talimatı — Faz 3.4: marka görselleri

Aşağıdaki metni yeni Claude Code oturumuna (bu proje klasöründe) olduğu gibi yapıştır.

---

Bite Routine projesinde Faz 3.4'e başlıyoruz: uygulamanın marka görselleri. Önce `docs/DEVIR.md` "▶ BURADAN DEVAM ET" bölümünü ve `AGENTS.md`'yi oku, `git pull --ff-only` yap; kararları yeniden sorma.

Bağlam:
- Tasarım dili onaylı: "Kömür ve adaçayı" paleti (zemin #f4f1ea, yüzey #fbf9f4, kömür #1f1f1c, kum #e8e2d3, adaçayı #9db39a yalnız süs, yeşil metin #4a6647, soluk metin #5c584f, su #5a7f99), Nunito, büyük köşeler. Bütün ekranlar bu dille yeniden yapıldı (Bugün, Katalog, yemek detayı, Geçmiş, Kilo, Ayarlar, Profil, Onboarding, kendi ürününü ekle).
- Tasarım tuvali: https://claude.ai/artifact/Qw7AjeWyQT9SW7QadBahM5 ("Kömür ve adaçayı" sayfası onaylı ekranlar). Yeni görselleri bu tuvale yeni bir sayfa ("Marka") olarak ekle.
- Uygulamada şu an Expo'nun şablon ikonu ve açılış ekranı var; mağazaya gönderilemez.

İstediğim (tasarımı sen yap, tuvalde; aklına gelebilecek her varyantı çiz, yan yana karşılaştırılabilir olsun):
1. Logo / uygulama ikonu: en az şu yönler ve her birinin 2–3 varyantı — A kalori halkası (Bugün'deki halka), B tabak/kaşık, C "B" monogramı, ayrıca senin önereceğin başka yönler. Her ikonu gerçek boyutlarda da göster (1024, 180, 60, 40 px) ve açık/koyu zemin üzerinde; iOS için tek parça, Android için adaptive (ön plan + arka plan) ve monochrome (Android 13 tematik ikon) katmanları; bildirim ikonu (Android, tek renk).
2. Açılış ekranı (splash): her ikon yönüyle uyumlu, açık zemin; expo-splash-screen kısıtlarına uygun (ortada ikon, düz arka plan).
3. İlk kez yükleyenler için tanıtım sayfaları (onboarding'den önce 3–4 sayfa): ne işe yarar (kalori ve öğün günlüğü), verilerin yalnız telefonda kalması / hesap yok, Türk yemekleri kataloğu ve kendi ürününü ekleme, değerlerin yaklaşık olduğu ve tıbbi tavsiye olmadığı. Sayfa göstergesi, "Geç" ve "Devam"; metinler Türkçe (İngilizcesi de yazılsın).
4. Mağaza görselleri için ön çalışma: App Store ve Google Play ekran görüntüsü çerçeveleri (başlık + ekran) için 2 yön.

Çalışma düzeni (AGENTS.md "Yürütme düzeni" ve opus-orchestration skill'i; önceki oturumdaki gibi): sen yöneticisin ve tek dağıtıcısın. Tasarımı sen (Claude) tuvalde yap; ben yön seçince seçilen ikonun/splash'in PNG'lerini üretip (`mobile/assets/`, `app.json` ayarları) kodlamayı Codex Sol'a (`gpt-6.1-sol`, high) ver; tanıtım sayfalarının kodu da Codex Sol'a. Simülatör/emülatör gerektiren hata ayıklama ve cihaz doğrulaması Claude işçilerine (`sonnet-worker-high`); R2/R3 işlerde karşı aileden review (Codex yazdıysa Sonnet, Claude yazdıysa Sol). Her Codex işinin son mesajını, `git status`'unu ve dosya kapsamını kontrol et, kancayla commit et; dağıtımları `olcum` ile kaydet. Boşta simülatör/emülatörü kapat (MacBook Air fansız). Cihaz doğrulaması `mobile/docs/DOGRULAMA.md` (yerel skill `mobil-dogrula`) ile iOS + Android. Kotayı `mcp__ccd_session_mgmt__get_usage` ile oku. Her PR doğrudan `main`'e açılır (üst üste PR yok). Commit/PR'da yapay zekâ imzası yok.

İlk adım: tuvalde "Marka" sayfasını aç, ikon yönlerini çiz, bana bağlantıyı ver ve hangi yönü seçeceğimi sor.
