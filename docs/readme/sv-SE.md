# Live Translator Hub

> En GUI-driven lokaliseringsmotor i realtid för Cursor- och Claude-skrivbordsappar — med Webview-plugin-penetrering och AI-driven asynkron översättning.

[English](../../README.md) | [日本語](ja-JP.md) | [한국어](ko-KR.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Italiano](it-IT.md) | [Português](pt-BR.md) | [Português](pt-PT.md) | [Nederlands](nl-NL.md) | [Polski](pl-PL.md) | [Dansk](da-DK.md) | [Suomi](fi-FI.md) | [Norsk](nb-NO.md) | [Čeština](cs-CZ.md) | [Slovenčina](sk-SK.md) | [Română](ro-RO.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Latviešu](lv-LV.md) | [Eesti](et-EE.md) | [Türkçe](tr-TR.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md)

## Projektöversikt

Live Translator Hub är en **Electron + React GUI-skrivbordsapplikation** som erbjuder ett-klicks-översättning till kinesiska för två AI-programmeringsverktyg: Cursor och Claude. Genom en enhetlig översättningsruntime-kärna hanteras motorinstallation, API-nyckelkonfiguration och ordboksgenerering för båda målapplikationerna från ett enda gränssnitt.

Detta projekt är en arkitektonisk uppgradering av [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub) – från CLI-skript till ett GUI med statuspanel och realtidsloggar, som slår samman översättningskapaciteten för Cursor och Claude till en gemensam plattform.


## Arkitektur

```
live-translator-ecosystem/          # npm workspaces monorepo
├── packages/
│   ├── desktop-app/                # Electron + React GUI (Live Translator Hub)
│   │   ├── electron/main.js        # Huvudprocess, IPC-kanaler och konfigurationspersistens
│   │   ├── electron/preload.js     # Kommunikationsbrygga för renderingsprocess
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # Översättningsruntime-kärna (translator-engine.js)
│   ├── patcher-cursor/             # Patcher för Cursor-applikation
│   ├── patcher-claude/             # Patcher för Claude-applikation
│   └── dict-generator/             # AI-ordboksgenerator
```

### Översättningsruntime

`packages/core/src/translator-engine.js` är den enda runtime som injiceras i målapplikationerna – ren webbläsar-JS, inga modulberoenden. Ansvar inkluderar:

- **Ordboksmatchning**: Statiska poster + regex-mönster
- **AI-översättningsproxybrygga**: I Webview-miljö vidarebefordras översättningsförfrågningar via `postMessage` till huvudfönstret, vilket kringgår CSP-begränsningar för nätverksåtkomst
- **Översättningscache**: Beständig cache baserad på `localStorage`, med nyckelnamn `live_i18n_cache_<entity_name>`
- **Nästlad ordbokssökning**: Stöd för `enableNestedDict`-läge

## Funktioner

### Enhetlig hantering av två motorer

Hantera distributionsstatus, ordboksversioner och blockeringsregler för Cursor och Claude från samma gränssnitt – inget verktygsbyte krävs.

### Webview-genomträngning i alla scenarier

Genom Translation Bridge-arkitekturen kan AI-översättningskapaciteten tränga igenom från huvudfönstret till alla nivåer av Webview-plugins (t.ex. Claude Code), vilket löser problem med nätverksblockering under strikta CSP-policyer.

### Fyrpanelsfunktionslayout

| Panel | Funktion |
| :--- | :--- |
| **Cursor Engine** | Distribuera/återställ Cursor-översättning, hantera domänspecifika blockeringsregler för huvudfönster och Webview-plugins |
| **Claude Engine** | Distribuera/återställ Claude-översättning, konfigurera hoppregler |
| **API Keys** | Hantera API-nycklar för flera AI-översättningsmotorer (stöd för OpenAI, Anthropic, Google Gemini, DeepL), nycklar krypteras med Electron `safeStorage` |
| **Dict Generator** | Extrahera UI-strängar från målapplikationens källkod, generera översättningsordböcker i batch via AI |

### Interaktiv felsökning

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) växlar blå streckad markeringsram
- I markeringsläge, håll `Option` (Mac) / `Alt` (Win) och sväva över kinesisk text för att se originaltext

### Domänspecifika blockeringsregler

Varje entitet (huvudfönster och varje plugin) har helt oberoende uppsättningar blockeringsregler (CSS-väljare, URL-matchning, titelmatchning), vilket säkerställer att kodområden och kärninteraktionsområden inte påverkas av översättning.

### Automatiska uppdateringar

Inbyggd `electron-updater` stödjer automatisk kontroll, nedladdning och installation av uppdateringar i macOS-applikationen.

## Snabbstart

```bash
# Installera beroenden
npm install

# Starta GUI-utvecklingsläge
npm run dev

# Bygg macOS-distribuerbar version
npm run build -w desktop-app
```

### Användningsflöde

1. Konfigurera AI-motorernas nycklar i panelen **API Keys**
2. Växla till panelen **Cursor Engine** eller **Claude Engine**
3. Klicka på **Deploy** för att distribuera översättningen med ett klick
4. Starta om målapplikationen för att aktivera

### Systemkrav

- macOS 13+ (rekommenderas)
- Node.js 18+
- Cursor eller Claude-skrivbordsapplikation installerad

## Säkerhet

- **Krypterad lagring av API-nycklar**: Krypteras med Electron `safeStorage` och sparas i `~/.live_translator_hub/api_keys.enc`, skrivs inte till konfigurationsfiler
- **Direkt kommunikation**: Översättningsförfrågningar går direkt till AI-leverantörens API, ingen mellanhandsserver
- **Domänisolering**: Blockeringsregler påverkar inte källkodsfilerna

---

*Detta projekt är endast avsett för utbildnings- och inlärningssyfte. Översättningskvaliteten påverkas av den valda AI-modellen.*
