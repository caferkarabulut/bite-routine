# Mobil doğrulama (iOS + Android, Release + Maestro)

Bir dalı "bitti" saymadan önce bu sırayla koşulur. Komutlar `mobile/` içinden. Bu Mac'e özgü değerler (simülatör, AVD, JDK yolu) en altta.

## 0. Önce bak

- Başka derleme ya da test var mı: `pgrep -fl "[x]codebuild|[e]xpo run|[m]aestro test|[g]radlew"` boş olmalı. Doluysa bekle; başka oturumun ya da işçinin sürecini öldürme. Boşta duran Gradle daemon'u (`java ... GradleDaemon`) sorun değil.
- Aynı anda tek derleme ve tek Maestro koşusu. Paralel iOS derlemesi + Android emülatörü ANR penceresi açar; iki Maestro akışları bozar.
- Uzun komutlar (derleme, tam Maestro paketi) arka planda koşulur; bitişi bildirimle beklenir, döngüyle yoklanmaz. Ön planda 10 dakikayı geçebilecek komut çalıştırılmaz.

## 1. Birim kapıları

```sh
npm run check:deps && npm run typecheck && npm run lint && npm test
```

## 2. iOS Release (iPhone 17, tr-TR)

```sh
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8          # yoksa CocoaPods ASCII-8BIT hatası
xcrun simctl boot 2B9ADD03-24A3-45F1-B184-D5B641679907 2>/dev/null
CI=1 npx expo prebuild -p ios --clean < /dev/null   # yalnız ios/ yoksa (yeni worktree) ya da native ayar değiştiyse
npx expo run:ios -d 2B9ADD03-24A3-45F1-B184-D5B641679907 --configuration Release --no-bundler < /dev/null
.maestro/run.sh 2B9ADD03-24A3-45F1-B184-D5B641679907              # varsayılan 9 akış
.maestro/run.sh 2B9ADD03-24A3-45F1-B184-D5B641679907 design-tour  # ekran değiştiyse
```

## 3. Android Release (yalnız iOS koşuları bittikten sonra)

```sh
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home
export ANDROID_HOME=$HOME/Library/Android/sdk        # yoksa yeni worktree'de "SDK location not found"
CI=1 npx expo prebuild -p android --clean < /dev/null   # yalnız android/ yoksa
npx expo run:android -d emulator-5554 --variant release --no-bundler < /dev/null
.maestro/run.sh emulator-5554 onboarding add-food search-turkish edit-delete-entry custom-food unsaved-changes water history-weight settings android-back
```

Emülatör kapalıysa: `$ANDROID_HOME/emulator/emulator -avd bite-routine-pixel -no-snapshot-save &` ve `adb wait-for-device`.

## 4. Sonucu okuma

- `run.sh` her akış için `PASS`/`FAIL` yazar; günlük ve ekran görüntüleri `.maestro/screenshots/<zaman>/` altında.
- Bir kez kalan akış tekrar koşulur. Tekrarda geçerse "kararsız" diye not edilir; iki kez kalan akış gerçek hatadır.
- Derleme hata verdiyse Maestro koşulmaz (eski kurulu uygulamayı yeni seçicilerle test eder, sonuç anlamsız olur).
- Ekran görüntüsü: `xcrun simctl io <udid> screenshot <dosya>.png`, `adb exec-out screencap -p > <dosya>.png`. Gezinmek için geçici bir Maestro akışı yazılır, iş bitince silinir.

## 5. Bitince

- Kullanılmayan simülatör ve emülatörü kapat (MacBook Air fansız, boşta da ısınır): `xcrun simctl shutdown all`, `adb -s emulator-5554 emu kill`. Sonraki doğrulama gerekiyorsa açık bırak.

## Bu Mac'in değerleri

| Ne | Değer |
|---|---|
| iOS simülatörü | "iPhone 17", UDID `2B9ADD03-24A3-45F1-B184-D5B641679907`, iOS 27.2, tr-TR |
| Yedek iOS simülatörü | "iPhone 17 Pro (TR)", UDID `93B134AD-5280-4931-AAD5-857B26EEDF3C` |
| Android | AVD `bite-routine-pixel`, `emulator-5554`, tr-TR |
| JDK | `/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home` |
| Android SDK | `$HOME/Library/Android/sdk` |

iOS 27.1 runtime yalnız iPhone Duo destekler; tasarım doğrulaması Duo'da yapılmaz (kullanıcı kararı, 2026-11-27).
