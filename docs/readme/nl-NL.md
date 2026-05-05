# Live Translator Hub

> Een GUI-aangedreven real-time lokalisatie-engine voor Cursor- en Claude-desktopapps — met Webview-plug-in-penetratie en AI-ondersteunde asynchrone vertaling.

[English](../../README.md) | [日本語](ja-JP.md) | [한국어](ko-KR.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Italiano](it-IT.md) | [Português](pt-BR.md) | [Português](pt-PT.md) | [Polski](pl-PL.md) | [Svenska](sv-SE.md) | [Dansk](da-DK.md) | [Suomi](fi-FI.md) | [Norsk](nb-NO.md) | [Čeština](cs-CZ.md) | [Slovenčina](sk-SK.md) | [Română](ro-RO.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Latviešu](lv-LV.md) | [Eesti](et-EE.md) | [Türkçe](tr-TR.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md)

## Projectoverzicht

Live Translator Hub is een **Electron + React GUI desktopapplicatie** die eenvoudige Chinese vertaling biedt voor twee AI-programmeertools: Cursor en Claude. Via een uniforme vertaalruntime-kernel beheer je de engine-implementatie, API-sleutelconfiguratie en woordenboekgeneratie voor beide doelapplicaties in één interface.

Dit project is een architectuurupgrade van [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub) – geëvolueerd van een CLI-script naar een GUI met statuspaneel en realtime logs, waarbij de vertaalmogelijkheden van Cursor en Claude worden samengevoegd in één uniform platform.

![Screenshot](../../image.png)
![Screenshot](../../image-1.png)

## Architectuur

```
live-translator-ecosystem/          # npm workspaces monorepo
├── packages/
│   ├── desktop-app/                # Electron + React GUI (Live Translator Hub)
│   │   ├── electron/main.js        # Hoofdproces, IPC-kanalen en configuratiepersistentie
│   │   ├── electron/preload.js     # Communicatiebrug voor renderproces
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # Vertaalruntime-kernel (translator-engine.js)
│   ├── patcher-cursor/             # Cursor-app Patcher
│   ├── patcher-claude/             # Claude-app Patcher
│   └── dict-generator/             # AI-woordenboekgenerator
```

### Vertaalruntime

`packages/core/src/translator-engine.js` is de enige runtime die in de doelapplicaties wordt geïnjecteerd – pure browser-JS, zonder module-afhankelijkheden. Verantwoordelijkheden omvatten:

- **Woordenboekmatching**: Statische termen + reguliere expressiepatronen
- **AI-vertaalproxybrug**: In Webview-omgevingen worden vertaalverzoeken via `postMessage` doorgestuurd naar het hoofdvenster, waarbij CSP-netwerkbeperkingen worden omzeild
- **Vertaalcache**: Persistente cache op basis van `localStorage`, met sleutelnaam `live_i18n_cache_<entity_name>`
- **Geneste woordenboekzoekopdracht**: Ondersteunt `enableNestedDict`-modus

## Hoogtepunten

### Uniform beheer van twee engines

Beheer de implementatiestatus, woordenboekversies en uitsluitingsregels voor zowel Cursor als Claude in één interface, zonder van tool te wisselen.

### Webview-penetratie in alle scenario's

Via de Translation Bridge-architectuur kan AI-vertaling vanuit het hoofdvenster doordringen tot alle lagen van Webview-plugins (zoals Claude Code), waarmee netwerkblokkades onder strikte CSP-beleid worden opgelost.

### Vierpaneel-functielay-out

| Paneel | Functie |
| :--- | :--- |
| **Cursor Engine** | Implementeer/herstel Cursor-vertaling, beheer domeinspecifieke uitsluitingsregels voor hoofdvenster en Webview-plugins |
| **Claude Engine** | Implementeer/herstel Claude-vertaling, configureer overslaanregels |
| **API Keys** | Beheer API-sleutels voor meerdere AI-vertaalengines (ondersteunt OpenAI, Anthropic, Google Gemini, DeepL), sleutels worden versleuteld opgeslagen via Electron `safeStorage` |
| **Dict Generator** | Extraheer UI-teksten uit de broncode van de doelapplicatie en genereer batchgewijs vertaalwoordenboeken via AI |

### Interactieve debugging

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) schakelt blauwe gestreepte markeringsranden in
- Houd in de markeringsmodus `Option` (Mac) / `Alt` (Win) ingedrukt en zweef over Chinese tekst om de originele tekst te zien

### Domeinspecifieke uitsluitingsregels

Elke entiteit (hoofdvenster en afzonderlijke plugins) heeft volledig onafhankelijke sets uitsluitingsregels (CSS-selectors, URL-matching, titelmatching), zodat codegebieden en kerninteractiezones niet door vertaling worden beïnvloed.

### Automatische updates

Ingebouwde `electron-updater`, ondersteunt automatisch controleren, downloaden en installeren van updates binnen de macOS-app.

## Snel starten

```bash
# Afhankelijkheden installeren
npm install

# GUI-ontwikkelmodus starten
npm run dev

# macOS-distributieversie bouwen
npm run build -w desktop-app
```

### Gebruiksprocedure

1. Configureer AI-enginesleutels in het **API Keys**-paneel
2. Schakel naar het **Cursor Engine**- of **Claude Engine**-paneel
3. Klik op **Deploy** om de vertaling in één keer te implementeren
4. Herstart de doelapplicatie om de wijzigingen door te voeren

### Systeemvereisten

- macOS 13+ (aanbevolen)
- Node.js 18+
- Cursor- of Claude-desktopapplicatie geïnstalleerd

## Beveiliging

- **Versleutelde API-sleutelopslag**: Opgeslagen via Electron `safeStorage` in `~/.live_translator_hub/api_keys.enc`, niet in configuratiebestanden
- **Directe communicatie**: Vertaalverzoeken gaan rechtstreeks naar de AI-leveranciers-API, zonder tussenliggende servers
- **Domeinisolatie**: Uitsluitingsregels raken geen broncodebestanden

---

*Dit project is uitsluitend bedoeld voor uitwisseling en leerdoeleinden. De vertaalkwaliteit wordt beïnvloed door het geselecteerde AI-model.*
