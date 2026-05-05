# Live Translator Hub

> GUI-alapú valós idejű lokalizációs motor Cursor és Claude asztali alkalmazásokhoz — Webview bővítmények áthatolásával és AI-alapú aszinkron fordítással.

[English](../../README.md) | [日本語](ja-JP.md) | [한국어](ko-KR.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Italiano](it-IT.md) | [Português](pt-BR.md) | [Português](pt-PT.md) | [Nederlands](nl-NL.md) | [Polski](pl-PL.md) | [Svenska](sv-SE.md) | [Dansk](da-DK.md) | [Suomi](fi-FI.md) | [Norsk](nb-NO.md) | [Čeština](cs-CZ.md) | [Slovenčina](sk-SK.md) | [Română](ro-RO.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Latviešu](lv-LV.md) | [Eesti](et-EE.md) | [Türkçe](tr-TR.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md)

## Projekt Áttekintés

A Live Translator Hub egy **Electron + React GUI asztali alkalmazás**, amely egyetlen kattintással teszi lehetővé a Cursor és Claude AI programozási eszközök kínai nyelvű lokalizációját. Egy egységes fordító futásidejű magon keresztül egyetlen felületen kezeli a két célalkalmazás motorjának telepítését, API-kulcsok konfigurálását és szótárgenerálást.

Ez a projekt a [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub) architekturális továbbfejlesztése – CLI szkriptből állapotpanellel és valós idejű naplózással rendelkező GUI-vá fejlődött, és a Cursor és Claude lokalizációs képességeit egyesíti egy közös platformon.


## Architektúra

```
live-translator-ecosystem/          # npm workspaces monorepo
├── packages/
│   ├── desktop-app/                # Electron + React GUI (Live Translator Hub)
│   │   ├── electron/main.js        # Főfolyamat, IPC csatornák és konfiguráció perzisztencia
│   │   ├── electron/preload.js     # Renderelő folyamat kommunikációs híd
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # Fordító futásidejű mag (translator-engine.js)
│   ├── patcher-cursor/             # Cursor alkalmazás Patcher
│   ├── patcher-claude/             # Claude alkalmazás Patcher
│   └── dict-generator/             # AI szótárgenerátor
```

### Fordító futásidejű mag

A `packages/core/src/translator-engine.js` az egyetlen futásidejű komponens, amely a célalkalmazásokba injektálódik – tiszta böngésző JavaScript, modul függőségek nélkül. Feladatai:

- **Szótárillesztés**: Statikus szócikkek + reguláris kifejezés minták
- **AI fordítás proxy híd**: Webview környezetben a `postMessage` segítségével továbbítja a fordítási kéréseket a főablakba, megkerülve a CSP hálózati korlátozásokat
- **Fordítási gyorsítótár**: `localStorage` alapú perzisztens gyorsítótár, kulcsnév: `live_i18n_cache_<entity_name>`
- **Beágyazott szótár keresés**: Támogatja az `enableNestedDict` módot

## Funkciók Kiemelései

### Két motor egységes kezelése

Egyetlen felületen kezelheti a Cursor és Claude lokalizációs telepítési állapotát, szótárverzióit és kizárási szabályait, anélkül hogy eszközt kellene váltania.

### Teljes körű Webview áthatolás

A Translation Bridge architektúrán keresztül az AI fordítási képesség a főablakból az összes Webview bővítmény rétegébe (pl. Claude Code) áthatol, megoldva a szigorú CSP szabályzatok által okozott hálózati blokkolást.

### Négy panel funkció elrendezés

| Panel | Funkció |
| :--- | :--- |
| **Cursor Engine** | Cursor lokalizáció telepítése/visszaállítása, főablak és Webview bővítmények tartományonkénti kizárási szabályainak kezelése |
| **Claude Engine** | Claude lokalizáció telepítése/visszaállítása, kihagyási szabályok konfigurálása |
| **API Keys** | Több AI fordítási motor API-kulcsainak kezelése (OpenAI, Anthropic, Google Gemini, DeepL támogatás), a kulcsok Electron `safeStorage` segítségével titkosítva tárolva |
| **Dict Generator** | UI szövegek kinyerése a célalkalmazás forráskódjából, AI által tömegesen generált fordítási szótárak |

### Interaktív hibakeresés

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) kék szaggatott vonalú kiemelő keret be-/kikapcsolása
- Kiemelő módban tartsa lenyomva az `Option` (Mac) / `Alt` (Win) billentyűt, és vigye az egeret a kínai szöveg fölé az eredeti szöveg megtekintéséhez

### Tartományonkénti kizárási szabályok

Minden entitás (főablak és egyes bővítmények) teljesen független kizárási szabálykészlettel rendelkezik (CSS szelektorok, URL illesztés, cím illesztés), biztosítva, hogy a kódterület és a fő interakciós terület ne legyen érintve a fordítástól.

### Automatikus frissítés

Beépített `electron-updater`, támogatja a macOS alkalmazáson belüli automatikus frissítés keresést, letöltést és telepítést.

## Gyors Kezdés

```bash
# Függőségek telepítése
npm install

# GUI fejlesztői mód indítása
npm run dev

# macOS terjeszthető verzió építése
npm run build -w desktop-app
```

### Használati Folyamat

1. Az **API Keys** panelen konfigurálja az AI motor kulcsait
2. Váltson a **Cursor Engine** vagy **Claude Engine** panelre
3. Kattintson a **Deploy** gombra a lokalizáció egy kattintással történő telepítéséhez
4. Indítsa újra a célalkalmazást a változások életbe lépéséhez

### Rendszerkövetelmények

- macOS 13+ (ajánlott)
- Node.js 18+
- Cursor vagy Claude asztali alkalmazás telepítve

## Biztonság

- **API-kulcsok titkosított tárolása**: Electron `safeStorage` segítségével titkosítva tárolva a `~/.live_translator_hub/api_keys.enc` fájlban, nem kerül be a konfigurációs fájlba
- **Közvetlen kommunikáció**: Fordítási kérések közvetlenül az AI szolgáltató API-jához érkeznek, nincs közvetítő szerver
- **Tartományi elkülönítés**: A kizárási szabályok nem érintik a forráskód fájlokat

---

*Ez a projekt kizárólag tanulási és megosztási célokat szolgál. A fordítás minőségét a kiválasztott AI modell befolyásolja.*
