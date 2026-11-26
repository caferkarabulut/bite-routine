# Yayın

Komutları `mobile/` içinde, Node 24 ile uygulama sahibi çalıştırır. EAS CLI alt sınırı,
[güncel CLI belgesindeki](https://docs.expo.dev/eas/cli/) 27.9.0 sürümüdür.

## Yayın öncesi

- [ ] Aşağıdaki kontrollerin hepsi geçer:

  ```sh
  npx expo config --type public > /dev/null
  npm run check:deps
  npm run typecheck
  npm run lint
  npm test
  npm run check:catalog
  ```

- [ ] Türkçe dilde, uygulama kurulu iOS Simulator ve Android emülatörde Maestro
  paketinin tamamı geçer. Her cihazda ayrı ayrı, `maestro test --device <cihaz-kimliği> .maestro`
  çalıştırılır; gerçek kimlikler `xcrun simctl list devices booted` ve `adb devices` ile bulunur.
  Hazırlık ve akışlar: [Maestro](../.maestro/README.md).
- [ ] Fiziksel cihazlarda bildirim izni, günlük hatırlatıcılar, yeniden başlatma sonrası
  hatırlatıcılar ve yedekle/geri yükle doğrulanır; Android 12 ve altında depolama izni olmadan denenir.
- [ ] Mağaza kayıtları, gizlilik/veri güvenliği formları, ekran görüntüleri, besinlerin
  yaklaşık olduğu ve tıbbi tavsiye olmadığı açıklaması ve Open Food Facts atfı hazırdır.
  Dağıtım ülkesi yalnız Türkiye seçilir. Google Play kapalı test koşulu (12 kişi / 14 gün) tamamlanır.

## Hesap, derleme ve gönderim

Apple Developer ve Google Play hesapları ile mağazalardaki uygulama kayıtları hazır olmalıdır.
İlk bağlantı:

```sh
npx eas-cli@latest login
npx eas-cli@latest init
```

`init` sahibin hesabındaki projeyi bağlar; EAS proje kimliği bu aşamada oluşur.
İmzalama sorularında EAS yönetimini seç: iOS sertifikası/provisioning profili ve Android
keystore EAS üzerinde tutulur (`credentialsSource` varsayılanı `remote`). Yönetmek için
`npx eas-cli@latest credentials` kullanılır. Sertifika, keystore, API anahtarı,
`credentials.json` ve `.env` Git'e eklenmez. Gönderim için Apple kimlik doğrulamasını
etkileşimli tamamla; Google servis hesabı anahtarını EAS Credentials üzerinden yükle/ata.
`submit.production` bilerek boştur; hesap bilgileri ve anahtar yolları repoya yazılmaz.

```sh
npx eas-cli@latest build -p ios --profile production
npx eas-cli@latest build -p android --profile production
npx eas-cli@latest submit -p ios --profile production
npx eas-cli@latest submit -p android --profile production
```

Gönderimde ilgili platformun tamamlanan production derlemesini seç. iOS derlemesi varsayılan
store dağıtımı, Android derlemesi AAB'dir; preview APK mağazaya gönderilmez. Gönderimden sonra
App Store Connect/TestFlight ve Play Console'daki inceleme ve yayın adımlarını tamamla.

## Sürüm ve izin politikası

Kullanıcıya görünen `expo.version` (şimdi `0.1.0`) her yeni mağaza sürümü için elle artırılır.
`cli.appVersionSource: remote` ile `ios.buildNumber` ve `android.versionCode` EAS'te tutulur;
production `autoIncrement: true` bunları otomatik artırır. Yerel build numarası ekleme.
İlk derlemede yerel numara yoksa EAS 1 ile başlatır. Daha önce mağazaya yükleme yapıldıysa
önce `npx eas-cli@latest build:version:set` ile son mağaza numaralarını eşleştir.

FileSystem'in eklediği eski `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` izinleri
engellenir; yedekler uygulama önbelleği ve sistem dosya seçicisiyle işlenir.
`POST_NOTIFICATIONS` ve `RECEIVE_BOOT_COMPLETED` korunur. Günlük hatırlatıcılar varsayılan
best-effort teslimatı kullanır; kesin alarm izni istenmez ve pil optimizasyonuyla gecikebilir.
`INTERNET` geliştirme istemcisi/Metro için korunur; uygulama kodu ağ çağrısı yapmaz.
iOS yalnız telefon düzenini hedefler; özel şifreleme ve ağ çağrısı olmadığı için
`ITSAppUsesNonExemptEncryption: false` kullanılır.
