# Bite Routine — devir notu

> Yeni oturum (bu makine, başka makine, Codex, ikinci hesap) **önce bunu okur**, sonra [`AGENTS.md`](../AGENTS.md)'ye uyar. Durum değişen her turun sonunda bir kez güncellenir. Geçmiş: [`DEVIR-gunluk.md`](DEVIR-gunluk.md). Kapsam ve fazlar: [`PROJECT_STATUS.md`](PROJECT_STATUS.md).

**Son güncelleme:** 2026-11-27 18:30 (Europe/Istanbul) — Claude Opus 5.5 (yönetici), ana hesap, bu Mac

## ▶ BURADAN DEVAM ET

> Yalnız şu anki durum yazılır; en çok ~25 satır, her seferinde üstüne yazılır. Biten iş günlüğe taşınır.

- **Şu an:** Faz 3.3 (ekran tasarımı) bitti. Sıradaki: Faz 3.4 marka görselleri (ikon, açılış ekranı, ilk açılış tanıtım sayfaları, mağaza görselleri). Yeni oturum talimatı: [`docs/YENI-OTURUM-PROMPT.md`](YENI-OTURUM-PROMPT.md).
- **Git:** `main`'de #48–#54 (Bugün, Katalog + detay, Ekle düğmesi + "Senin eklediğin", Geçmiş + Kilo, Ayarlar + Profil + Onboarding). Açık: #55 `feat/product-form` (katalog sırası, son eklenenler, genişletilmiş ürün formu, ekleyen migration v2; R2 review iki tur, P0/P1 yok) ve bu notu taşıyan Kilo grafiği PR'ı.
- **Çalışan işçi:** yok. Simülatör ve emülatör kapalı.
- **Kullanıcı kararı bekleyen:** uygulama ikonu yönü (A kalori halkası — yönetici önerisi, B tabak/kaşık, C "B" monogramı; yeni oturum hepsini ve varyantlarını tuvalde çizecek).
- **Kota:** masaüstü uygulamasında `mcp__ccd_session_mgmt__get_usage`. Kod işleri Codex Sol (high); cihaz/hata ayıklama `sonnet-worker-high`.
- **Tasarım tuvali:** https://claude.ai/artifact/Qw7AjeWyQT9SW7QadBahM5 (sürüm 10; "Kömür ve adaçayı" sayfası onaylı ekranlar).
- **Palet:** bg #f4f1ea, yüzey #fbf9f4, birincil/metin #1f1f1c, kum #e8e2d3, adaçayı #9db39a (yalnız süs), yeşil metin #4a6647, soluk metin #5c584f, su #5a7f99.
- **Dikkat:** PR'lar hep doğrudan `main`'e (üst üste PR tuzağı, AGENTS). Aynı anda tek derleme/Maestro. Codex sandbox'ı Maestro koşamaz: cihaz doğrulaması yöneticide ya da Claude işçisinde. Yeni worktree'de Android derlemesi `ANDROID_HOME` ister (`mobile/docs/DOGRULAMA.md`). `.claude/worktrees/` altındaki eski iş worktree'leri (dalları merge edildi) temizlenebilir.
- **Açık küçük notlar:** #55 review P2'leri (porsiyon başına makro toplamı ve porsiyon gramı geçersiz değerleri için test boşluğu; son eklenenler sorgusu tüm günlüğü tarıyor). Katalog kategorisinde 300 satır sanallaştırılmamış. Faz 3.5'te ele alınır.

## Sıradaki işler (öncelik sırasıyla)

1. #55 ve bu PR'ın merge'i (kullanıcı).
2. Faz 3.4 (yeni oturum): ikon + adaptive/monochrome katmanlar + bildirim ikonu, açılış ekranı, ilk açılış tanıtım sayfaları, mağaza görseli çerçeveleri.
3. Faz 3.5: erişilebilirlik/kontrast/büyük metin; katalog listesinin sanallaştırılması; #55 P2 test boşlukları; design-tour "sonra" görüntüleri.
4. Fiziksel cihaz testi (Faz 4) — ertelendi.
5. Hesap işleri: EAS, App Store Connect, Play Console, kapalı test.

## Kullanıcı tercihleri (onaylı — yeniden sorma)

- Opus yönetici; kodu ağırlıklı olarak Sonnet yazar, Codex de kullanılır; görev dağılımı yöneticide (2026-11-13). Ayrıntı: AGENTS.md "Yürütme düzeni".
- Commit, PR ve dosyalarda yapay zekâ imzası yok (2026-11-13).
- Ajan düzeni dosyaları (CLAUDE.md, DEVIR, KARARLAR) repoya commit edilir (2026-11-13).
- İşler en yüksek verimle, paralel ajanlarla yürütülür (2026-11-26).
- Tasarım doğrulaması Duo değil standart iPhone simülatöründe (2026-11-27).
- Destek e-postası biteroutine0@gmail.com (2026-11-27).

## Geçici (kaybolabilir)

- yok
