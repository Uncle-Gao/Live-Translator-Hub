# Live Translator Hub

> En GUI-drevet lokaliseringsmotor i realtid til Cursor- og Claude-desktopapps — med Webview-plugin-penetrering og AI-drevet asynkron oversættelse.

[English](../../README.md) | [中文](zh-CN.md) | [日本語](ja-JP.md) | [한국어](ko-KR.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Italiano](it-IT.md) | [Português](pt-BR.md) | [Português](pt-PT.md) | [Nederlands](nl-NL.md) | [Polski](pl-PL.md) | [Svenska](sv-SE.md) | [Suomi](fi-FI.md) | [Norsk](nb-NO.md) | [Čeština](cs-CZ.md) | [Slovenčina](sk-SK.md) | [Română](ro-RO.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Latviešu](lv-LV.md) | [Eesti](et-EE.md) | [Türkçe](tr-TR.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md)

## Projektoversigt

Live Translator Hub er en **Electron + React GUI desktop-applikation**, der tilbyder et-klik-sinisering af to AI-programmeringsværktøjer: Cursor og Claude. Gennem en ensartet oversættelsesruntimekerne administreres motorimplementering, API-nøglekonfiguration og ordbogsgenerering for begge målapplikationer i én grænseflade.

Dette projekt er en arkitektonisk opgradering af [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub) – fra et CLI-script til en GUI med statuspanel og realtidslogfiler, der samler siniseringskapaciteten for Cursor og Claude i én samlet platform.

![Skærmbillede](../../image.png)
![Skærmbillede](../../image-1.png)

## Arkitektur

```
live-translator-ecosystem/          # npm workspaces monorepo
├── packages/
│   ├── desktop-app/                # Electron + React GUI (Live Translator Hub)
│   │   ├── electron/main.js        # Hovedproces, IPC-kanal og konfigurationspersistens
│   │   ├── electron/preload.js     # Kommunikationsbro til renderingsproces
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # Oversættelsesruntimekerne (translator-engine.js)
│   ├── patcher-cursor/             # Cursor-applikationspatcher
│   ├── patcher-claude/             # Claude-applikationspatcher
│   └── dict-generator/             # AI-ordbogsgenerator
```

### Oversættelsesruntime

`packages/core/src/translator-engine.js` er den eneste runtime, der injiceres i målapplikationerne – ren browser-JS uden modulafhængigheder. Ansvarsområder omfatter:

- **Ordbogsmatchning**: Statiske poster + regulære udtryksmønstre
- **AI-oversættelsesproxybro**: I Webview-miljøer videresendes oversættelsesanmodninger via `postMessage` til hovedvinduet, hvilket omgår CSP-netværksbegrænsninger
- **Oversættelsescache**: Persistent cache baseret på `localStorage` med nøglenavn `live_i18n_cache_<entity_name>`
- **Indlejret ordbogssøgning**: Understøtter `enableNestedDict`-tilstand

## Funktionshøjdepunkter

### Dobbeltmotor, samlet styring

Administrer siniseringsimplementeringsstatus, ordbogsversioner og blokeringsregler for henholdsvis Cursor og Claude i én grænseflade uden at skifte værktøj.

### Webview-gennemtrængning i alle scenarier

Gennem Translation Bridge-arkitekturen kan AI-oversættelseskapaciteten trænge fra hovedvinduet ind i alle niveauer af Webview-plugins (f.eks. Claude Code), hvilket løser problemet med netværksblokering under strenge CSP-politikker.

### Firepanel-funktionslayout

| Panel | Funktion |
| :--- | :--- |
| **Cursor Engine** | Implementer/gendan Cursor-sinisering, administrer domænespecifikke blokeringsregler for hovedvindue og Webview-plugins |
| **Claude Engine** | Implementer/gendan Claude-sinisering, konfigurer springregler |
| **API Keys** | Administrer API-nøgler til flere AI-oversættelsesmotorer (understøtter OpenAI, Anthropic, Google Gemini, DeepL), nøgler krypteres via Electron `safeStorage` |
| **Dict Generator** | Udtræk UI-strenge fra målapplikationens kildekode, generér oversættelsesordbøger i batch via AI |

### Interaktiv debugging

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) skifter blå stiplet fremhævningsramme
- I fremhævningstilstand: Hold `Option` (Mac) / `Alt` (Win) nede og svæv over kinesisk tekst for at se originalteksten

### Domænespecifikke blokeringsregler

Hver enhed (hovedvindue og hvert plugin) har et fuldstændigt uafhængigt sæt blokeringsregler (CSS-vælgere, URL-matchning, titelmatchning), hvilket sikrer, at kodeområder og kerneinteraktionsområder ikke påvirkes af oversættelse.

### Automatisk opdatering

Indbygget `electron-updater` understøtter automatisk kontrol, download og installation af opdateringer i macOS-appen.

## Kom godt i gang

```bash
# Installer afhængigheder
npm install

# Start GUI-udviklingstilstand
npm run dev

# Byg macOS-distribuerbar version
npm run build -w desktop-app
```

### Arbejdsgang

1. Konfigurer AI-motor-nøgler i panelet **API Keys**
2. Skift til panelet **Cursor Engine** eller **Claude Engine**
3. Klik på **Deploy** for at implementere sinisering med ét klik
4. Genstart målapplikationen for at aktivere

### Systemkrav

- macOS 13+ (anbefales)
- Node.js 18+
- Cursor- eller Claude-desktopapplikation installeret

## Sikkerhed

- **Krypteret API-nøglelagring**: Gemmes krypteret via Electron `safeStorage` i `~/.live_translator_hub/api_keys.enc`, skrives ikke til konfigurationsfiler
- **Direkte kommunikation**: Oversættelsesanmodninger går direkte til AI-leverandørens API, ingen mellemservere
- **Domæneisolering**: Blokeringsregler rører ikke kildekodefiler

---

*Dette projekt er kun til udveksling og læring. Oversættelseskvaliteten afhænger af den valgte AI-model.*
