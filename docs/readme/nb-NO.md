# Live Translator Hub

> En GUI-drevet lokaliseringsmotor i sanntid for Cursor- og Claude-skrivebordsapper — med Webview-plugin-penetrering og AI-drevet asynkron oversettelse.

[English](../../README.md) | [中文](zh-CN.md) | [日本語](ja-JP.md) | [한국어](ko-KR.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Italiano](it-IT.md) | [Português](pt-BR.md) | [Português](pt-PT.md) | [Nederlands](nl-NL.md) | [Polski](pl-PL.md) | [Svenska](sv-SE.md) | [Dansk](da-DK.md) | [Suomi](fi-FI.md) | [Čeština](cs-CZ.md) | [Slovenčina](sk-SK.md) | [Română](ro-RO.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Latviešu](lv-LV.md) | [Eesti](et-EE.md) | [Türkçe](tr-TR.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md)

## Prosjektoversikt

Live Translator Hub er en **Electron + React GUI-skrivebordsapplikasjon** som gir ett-klikks kinesisk oversettelse for to AI-programmeringsverktøy: Cursor og Claude. Gjennom en enhetlig oversettelsesruntime-kjerne administreres motorutrulling, API-nøkkelkonfigurasjon og ordbokgenerering for begge målapplikasjonene i ett grensesnitt.

Dette prosjektet er en arkitektonisk oppgradering av [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub) – fra et CLI-skript til en GUI med statuspanel og sanntidslogger, og slår sammen oversettelsesfunksjonaliteten for Cursor og Claude til én enhetlig plattform.

![Skjermbilde](../../image.png)
![Skjermbilde](../../image-1.png)

## Arkitektur

```
live-translator-ecosystem/          # npm workspaces monorepo
├── packages/
│   ├── desktop-app/                # Electron + React GUI (Live Translator Hub)
│   │   ├── electron/main.js        # Hovedprosess, IPC-kanaler og konfigurasjonspersistens
│   │   ├── electron/preload.js     # Kommunikasjonsbro for gjengivelsesprosess
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # Oversettelsesruntime-kjerne (translator-engine.js)
│   ├── patcher-cursor/             # Cursor-applikasjonspatcher
│   ├── patcher-claude/             # Claude-applikasjonspatcher
│   └── dict-generator/             # AI-ordbokgenerator
```

### Oversettelsesruntime

`packages/core/src/translator-engine.js` er den eneste runtime som injiseres i målapplikasjonene – ren nettleser-JS, ingen modulavhengigheter. Ansvarsområder inkluderer:

- **Ordbokmatching**: Statiske oppføringer + regulære uttrykksmønstre
- **AI-oversettelsesproxybro**: I Webview-miljøer videresendes oversettelsesforespørsler via `postMessage` til hovedvinduet, og omgår CSP-nettverksbegrensninger
- **Oversettelsesbuffer**: Vedvarende buffer basert på `localStorage`, med nøkkelnavn `live_i18n_cache_<entity_name>`
- **Nestet ordboksøk**: Støtter `enableNestedDict`-modus

## Funksjonshøydepunkter

### Enhetlig administrasjon av to motorer

Administrer utrullingsstatus, ordbokversjoner og blokkeringsregler for både Cursor og Claude i samme grensesnitt, uten å måtte bytte verktøy.

### Webview-gjennomtrengning i alle scenarier

Gjennom Translation Bridge-arkitekturen kan AI-oversettelsesfunksjonalitet trenge gjennom fra hovedvinduet til alle nivåer av Webview-plugins (f.eks. Claude Code), og løser nettverksblokkering under strenge CSP-policyer.

### Firepanelers funksjonslayout

| Panel | Funksjon |
| :--- | :--- |
| **Cursor Engine** | Utrull/gjenopprett Cursor-oversettelse, administrer domene-spesifikke blokkeringsregler for hovedvindu og Webview-plugins |
| **Claude Engine** | Utrull/gjenopprett Claude-oversettelse, konfigurer hoppregler |
| **API Keys** | Administrer API-nøkler for flere AI-oversettelsesmotorer (støtter OpenAI, Anthropic, Google Gemini, DeepL), nøkler lagres kryptert via Electron `safeStorage` |
| **Dict Generator** | Trekk ut UI-strenger fra målapplikasjonens kildekode, generer oversettelsesordbøker i batch via AI |

### Interaktiv feilsøking

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) for å slå av/på blå stiplet ramme
- I uthevet modus, hold `Option` (Mac) / `Alt` (Win) og hold musepekeren over kinesisk tekst for å se originalteksten

### Domene-spesifikke blokkeringsregler

Hver enhet (hovedvindu og individuelle plugins) har helt uavhengige sett med blokkeringsregler (CSS-velgere, URL-matching, tittelmatching), som sikrer at kodeområder og kjerninteraksjonssoner ikke påvirkes av oversettelse.

### Automatiske oppdateringer

Innebygd `electron-updater`, støtter automatisk sjekk, nedlasting og installasjon av oppdateringer i macOS-appen.

## Kom i gang

```bash
# Installer avhengigheter
npm install

# Start GUI-utviklingsmodus
npm run dev

# Bygg distribuerbar macOS-versjon
npm run build -w desktop-app
```

### Bruksflyt

1. Konfigurer AI-motor-nøkler i **API Keys**-panelet
2. Bytt til **Cursor Engine**- eller **Claude Engine**-panelet
3. Klikk **Deploy** for å rulle ut oversettelsen med ett klikk
4. Start målapplikasjonen på nytt for å aktivere

### Systemkrav

- macOS 13+ (anbefalt)
- Node.js 18+
- Cursor- eller Claude-skrivebordsapplikasjon installert

## Sikkerhet

- **Kryptert lagring av API-nøkler**: Lagres kryptert via Electron `safeStorage` til `~/.live_translator_hub/api_keys.enc`, skrives ikke til konfigurasjonsfiler
- **Direkte kommunikasjon**: Oversettelsesforespørsler går direkte til AI-leverandørens API, ingen mellomliggende servere
- **Domeneisolering**: Blokkeringsregler berører ikke kildekodefiler

---

*Dette prosjektet er kun til utveksling og læringsformål. Oversettelseskvaliteten påvirkes av den valgte AI-modellen.*
