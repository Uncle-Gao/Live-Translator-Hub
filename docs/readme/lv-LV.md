# Live Translator Hub

> GUI balstīts reāllaika lokalizācijas dzinējs Cursor un Claude darbvirsmas lietotnēm — ar Webview spraudņu iespiešanos un AI balstītu asinhrono tulkošanu.

[English](../../README.md) | [日本語](ja-JP.md) | [한국어](ko-KR.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Italiano](it-IT.md) | [Português](pt-BR.md) | [Português](pt-PT.md) | [Nederlands](nl-NL.md) | [Polski](pl-PL.md) | [Svenska](sv-SE.md) | [Dansk](da-DK.md) | [Suomi](fi-FI.md) | [Norsk](nb-NO.md) | [Čeština](cs-CZ.md) | [Slovenčina](sk-SK.md) | [Română](ro-RO.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Eesti](et-EE.md) | [Türkçe](tr-TR.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md)

## Projekta pārskats

Live Translator Hub ir **Electron + React GUI darbvirsmas lietotne**, kas nodrošina vienas klikšķa lokalizāciju diviem AI programmēšanas rīkiem — Cursor un Claude. Izmantojot vienotu tulkošanas izpildlaika kodolu, vienā saskarnē tiek pārvaldīti abu mērķa lietotņu dzinēju izvietošana, API atslēgu konfigurācija un vārdnīcu ģenerēšana.

Šis projekts ir [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub) arhitektūras jauninājums — no CLI skripta evolūcija uz GUI ar statusa paneli un reāllaika žurnāliem, apvienojot Cursor un Claude lokalizācijas iespējas vienotā platformā.


## Arhitektūra

```
live-translator-ecosystem/          # npm workspaces monorepo
├── packages/
│   ├── desktop-app/                # Electron + React GUI (Live Translator Hub)
│   │   ├── electron/main.js        # Galvenais process, IPC kanāli un konfigurācijas saglabāšana
│   │   ├── electron/preload.js     # Renderēšanas procesa komunikācijas tilts
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # Tulkošanas izpildlaika kodols (translator-engine.js)
│   ├── patcher-cursor/             # Cursor lietotnes Patcher
│   ├── patcher-claude/             # Claude lietotnes Patcher
│   └── dict-generator/             # AI vārdnīcu ģenerators
```

### Tulkošanas izpildlaiks

`packages/core/src/translator-engine.js` ir vienīgais izpildlaiks, kas tiek ievadīts mērķa lietotnē — tīrs pārlūkprogrammas JS bez moduļu atkarībām. Tā pienākumi ietver:

- **Vārdnīcas atbilstība**: statiski vārdi + regulārās izteiksmes
- **AI tulkošanas starpnieka tilts**: Webview vidē, izmantojot `postMessage`, tulkošanas pieprasījumi tiek pārsūtīti uz galveno logu, apejot CSP tīkla ierobežojumus
- **Tulkošanas kešatmiņa**: uz `localStorage` balstīta pastāvīga kešatmiņa, atslēgas nosaukums `live_i18n_cache_<entity_name>`
- **Ligzdotā vārdnīcas meklēšana**: atbalsta `enableNestedDict` režīmu

## Funkciju izceļamie punkti

### Divu dzinēju vienota pārvaldība

Vienā saskarnē atsevišķi pārvaldiet Cursor un Claude lokalizācijas izvietošanas statusu, vārdnīcu versijas un bloķēšanas noteikumus, bez nepieciešamības pārslēgties starp rīkiem.

### Pilna Webview caurlaidība

Izmantojot Translation Bridge arhitektūru, AI tulkošanas iespējas var izplatīties no galvenā loga uz visiem Webview spraudņu līmeņiem (piemēram, Claude Code), risinot tīkla bloķēšanas problēmas stingras CSP politikas apstākļos.

### Četru paneļu funkcionālais izkārtojums

| Panelis | Funkcija |
| :--- | :--- |
| **Cursor Engine** | Izvietot/atjaunot Cursor lokalizāciju, pārvaldīt galvenā loga un Webview spraudņu domēnu bloķēšanas noteikumus |
| **Claude Engine** | Izvietot/atjaunot Claude lokalizāciju, konfigurēt izlaišanas noteikumus |
| **API Keys** | Pārvaldīt vairāku AI tulkošanas dzinēju API atslēgas (atbalsta OpenAI, Anthropic, Google Gemini, DeepL), atslēgas tiek šifrētas, izmantojot Electron `safeStorage` |
| **Dict Generator** | Iegūt UI virknes no mērķa lietotnes pirmkoda un izmantot AI, lai masveidā ģenerētu tulkošanas vārdnīcas |

### Interaktīvā atkļūdošana

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) — pārslēgt zilu punktētu izcelšanas apmali
- Izcelšanas režīmā turiet `Option` (Mac) / `Alt` (Win) un virziet kursoru virs ķīniešu teksta, lai skatītu oriģinālu

### Domēnu bloķēšanas noteikumi

Katram elementam (galvenajam logam un katram spraudnim) ir pilnīgi neatkarīgs bloķēšanas noteikumu kopums (CSS selektori, URL atbilstība, virsrakstu atbilstība), nodrošinot, ka koda apgabali un galvenās mijiedarbības zonas netiek ietekmētas tulkošanas laikā.

### Automātiskie atjauninājumi

Iebūvēts `electron-updater`, kas atbalsta automātisku atjauninājumu pārbaudi, lejupielādi un instalēšanu macOS lietotnē.

## Ātrais starts

```bash
# Instalēt atkarības
npm install

# Palaist GUI izstrādes režīmu
npm run dev

# Izveidot macOS izplatāmo versiju
npm run build -w desktop-app
```

### Lietošanas plūsma

1. **API Keys** panelī konfigurējiet AI dzinēja atslēgas
2. Pārslēdzieties uz **Cursor Engine** vai **Claude Engine** paneli
3. Noklikšķiniet uz **Deploy**, lai vienā klikšķī izvietotu lokalizāciju
4. Restartējiet mērķa lietotni, lai izmaiņas stātos spēkā

### Sistēmas prasības

- macOS 13+ (ieteicams)
- Node.js 18+
- Instalēta Cursor vai Claude darbvirsmas lietotne

## Drošība

- **API atslēgu šifrēta glabāšana**: izmantojot Electron `safeStorage`, atslēgas tiek šifrēti saglabātas `~/.live_translator_hub/api_keys.enc`, netiek ierakstītas konfigurācijas failos
- **Tiešā komunikācija**: tulkošanas pieprasījumi tiek nosūtīti tieši uz AI ražotāja API, bez starpniekserveriem
- **Domēnu izolācija**: bloķēšanas noteikumi neskar pirmkoda failus

---

*Šis projekts ir paredzēts tikai mācību un apmaiņas nolūkiem. Tulkošanas kvalitāti ietekmē izvēlētais AI modelis.*
