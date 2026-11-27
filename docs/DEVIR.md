# Bite Routine — devir notu

> Yeni oturum (bu makine, başka makine, Codex, ikinci hesap) **önce bunu okur**, sonra [`AGENTS.md`](../AGENTS.md)'ye uyar. Durum değişen her turun sonunda bir kez güncellenir. Geçmiş: [`DEVIR-gunluk.md`](DEVIR-gunluk.md). Kapsam ve fazlar: [`PROJECT_STATUS.md`](PROJECT_STATUS.md).

**Son güncelleme:** 2026-11-27 21:20 (Europe/Istanbul) — Claude Opus 5.5 (yönetici, Faz 3.4 oturumu), ana hesap, bu Mac

## ▶ BURADAN DEVAM ET

> Yalnız şu anki durum yazılır; en çok ~25 satır, her seferinde üstüne yazılır. Biten iş günlüğe taşınır.

- **Şu an:** Faz 3.4 marka görselleri tasarımda. İkon F6 seçildi (KARARLAR 2026-11-27). Tuval "Marka" sayfasında F6 ile açılış ekranı (4 seçenek), tanıtım sayfaları (4 sayfa, TR + EN) ve mağaza çerçeveleri (2 yön, App Store 3 + Play 1) çizildi; kullanıcı onayı bekleniyor. Kullanıcı isteği: tasarımlar bitmeden başka göreve geçilmez; kod (PNG, `app.json`, tanıtım ekranları) onaydan sonra Codex Sol'a. İkon geometrisi ve tuval üreticisi: `docs/marka/gen_marka.py`, `docs/marka/gen_marka2.py` (henüz commit edilmedi).
- **Git:** `main`'de #48–#54 (Bugün, Katalog + detay, Ekle düğmesi + "Senin eklediğin", Geçmiş + Kilo, Ayarlar + Profil + Onboarding). Açık: #55 `feat/product-form` (katalog sırası, son eklenenler, genişletilmiş ürün formu, ekleyen migration v2; R2 review iki tur, P0/P1 yok) ve bu notu taşıyan Kilo grafiği PR'ı.
- **Çalışan işçi:** bu oturumda yok. 18:03'te başka bir Claude oturumunun doğrulama zinciri (kapılar → iOS Release + Maestro → Android Release + Maestro) çalışıyordu; bitip bitmediği doğrulanmadı. Derleme başlatmadan önce `pgrep -fl "[x]codebuild|[m]aestro|[g]radle"`.
- **Kullanıcı kararı bekleyen:** yok. Hesap kararı verildi (v1 hesapsız + sağlam yedek; `docs/arastirma/2026-11-27-hesap-ve-yedek.md`). Destek/gizlilik sayfaları ayrı public repoya taşındı: `caferkarabulut/bite-routine-site`, canlı adres `https://caferkarabulut.github.io/bite-routine-site/` (privacy/, support/ 200 döndü). Kod reposunu private yapmak kullanıcıda; `chore/site-repo` PR'ı (eski `docs/` sayfalarını siler, uygulamadaki GitHub düğmesini gizlilik politikası bağlantısına çevirir) merge edilmeden yapılmamalı.
- **Kota:** masaüstü uygulamasında `mcp__ccd_session_mgmt__get_usage`. Kod işleri Codex Sol (high); cihaz/hata ayıklama `sonnet-worker-high`.
- **Tasarım tuvali:** https://claude.ai/artifact/Qw7AjeWyQT9SW7QadBahM5 (sürüm 15; "Kömür ve adaçayı" sayfası onaylı ekranlar, "Marka" sayfası ikon/açılış/tanıtım/mağaza).
- **Palet:** bg #f4f1ea, yüzey #fbf9f4, birincil/metin #1f1f1c, kum #e8e2d3, adaçayı #9db39a (yalnız süs), yeşil metin #4a6647, soluk metin #5c584f, su #5a7f99.
- **Dikkat:** PR'lar hep doğrudan `main`'e (üst üste PR tuzağı, AGENTS). Aynı anda tek derleme/Maestro. Codex sandbox'ı Maestro koşamaz: cihaz doğrulaması yöneticide ya da Claude işçisinde. Yeni worktree'de Android derlemesi `ANDROID_HOME` ister (`mobile/docs/DOGRULAMA.md`). `.claude/worktrees/` temizlendi (2026-11-27; 10 worktree ve yerel dalları silindi, uzak dallar duruyor).
- **Açık küçük notlar:** #55 review P2'leri (porsiyon başına makro toplamı ve porsiyon gramı geçersiz değerleri için test boşluğu; son eklenenler sorgusu tüm günlüğü tarıyor). Katalog kategorisinde 300 satır sanallaştırılmamış. Faz 3.5'te ele alınır.

## Sıradaki işler (öncelik sırasıyla)

0. Yedek sağlamlaştırma (KARARLAR 2026-11-27): Android otomatik yedek doğrulaması, iOS iCloud otomatik yedek + ilk açılışta geri yükleme, Ayarlar'da "son yedek". R3 (yedekleme/geri yükleme): Claude yazarsa Sol review + kullanıcı onayı. Tanıtım sayfası 2 bu özelliğe dayanıyor; özellik çıkmadan o metin yayımlanmaz.

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
