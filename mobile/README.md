# Bite Routine mobil

Expo SDK 58, React Native 0.88, React 19.3, TypeScript ve Expo Router. Node 24 LTS kullanılır.

Uygulama tamamen cihazda çalışır: veriler SQLite'ta, katalog `assets/catalog.json` içinde gömülüdür. Katman ve ekran yapısı: [mimari](docs/ARCHITECTURE.md). Katalog güncellenince `npm run sync:catalog`.

## Çalıştırma

```sh
cd mobile
npm ci
npx expo run:ios      # geliştirme derlemesi (SQLite ve bildirim yerel modül ister)
npx expo run:android
```

Sonraki açılışlarda yalnız Metro yeterlidir:

```sh
npm run start:dev
npm run build:ios:device  # bağlı iPhone
```

`ios/` ve `android/` klasörleri Expo tarafından üretilir, git dışındadır ve elle düzenlenmez. Yerel Expo adresi açılmazsa `NODE_OPTIONS=--dns-result-order=ipv4first` ile başlatın.

## Kontroller

```sh
npm run check:catalog
npm run check:deps
npm run typecheck
npm run lint
npm test
npm run export:ios
npm run export:android
```

CI aynı adımları çalıştırır. Bu adımlar Metro paketlemesidir; native derleme veya cihaz testi değildir. Yeni paketleri yalnız `npx expo install <paket>` ile ekleyin.
