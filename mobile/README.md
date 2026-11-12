# Bite Routine mobil

Expo SDK 58, React Native 0.88, React 19.3, TypeScript ve Expo Router. Node 24 LTS kullanılır.

> Geçiş aşaması: mevcut ekranlar (katalog, giriş/kayıt, günlük ekleme/düzenleme) hâlâ kaldırılmış .NET API'sine bağlıdır. Faz 2'de yerel SQLite veritabanına ve uygulamaya gömülü kataloğa geçirilecek; kapsam için [proje durumu](../docs/PROJECT_STATUS.md).

## Çalıştırma

```sh
cd mobile
npm ci
npm run ios       # Expo Go ile iOS Simulator
npm run android   # Expo Go ile Android
```

Native modül eklendiğinde Expo Go yetmez; geliştirme derlemesi gerekir:

```sh
npx expo run:ios          # Simulator
npm run build:ios:device  # bağlı iPhone
npm run start:dev
```

`ios/` ve `android/` klasörleri Expo tarafından üretilir, git dışındadır ve elle düzenlenmez. Yerel Expo adresi açılmazsa `NODE_OPTIONS=--dns-result-order=ipv4first` ile başlatın.

## Kontroller

```sh
npm run check:deps
npm run typecheck
npm run lint
npm test
npm run export:ios
npm run export:android
```

CI aynı adımları çalıştırır. Bu adımlar Metro paketlemesidir; native derleme veya cihaz testi değildir. Yeni paketleri yalnız `npx expo install <paket>` ile ekleyin.
