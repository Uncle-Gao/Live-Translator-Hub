# Live Translator Hub

> GUI lokalizačný engine v reálnom čase pre desktopové aplikácie Cursor a Claude — s penetráciou pluginov Webview a asynchrónnym prekladom pomocou AI.

[English](../../README.md) | [日本語](ja-JP.md) | [한국어](ko-KR.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Italiano](it-IT.md) | [Português](pt-BR.md) | [Português](pt-PT.md) | [Nederlands](nl-NL.md) | [Polski](pl-PL.md) | [Svenska](sv-SE.md) | [Dansk](da-DK.md) | [Suomi](fi-FI.md) | [Norsk](nb-NO.md) | [Čeština](cs-CZ.md) | [Română](ro-RO.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Latviešu](lv-LV.md) | [Eesti](et-EE.md) | [Türkçe](tr-TR.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md)

## Prehľad projektu

Live Translator Hub je **desktopová aplikácia s GUI postavená na Electron + React**, ktorá poskytuje jednoduchú lokalizáciu do čínštiny pre dva nástroje na AI programovanie: Cursor a Claude. Prostredníctvom jednotného prekladového runtime jadra spravuje nasadenie enginov, konfiguráciu API kľúčov a generovanie slovníkov pre obe cieľové aplikácie v jednom rozhraní.

Tento projekt je architektonickým vylepšením [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub) – prechodom z CLI skriptu na GUI so stavovým panelom a živými logmi, pričom spája lokalizačné schopnosti pre Cursor a Claude do jednej jednotnej platformy.

![Snímka obrazovky](../../image.png)
![Snímka obrazovky](../../image-1.png)

## Architektúra

```
live-translator-ecosystem/          # npm workspaces monorepo
├── packages/
│   ├── desktop-app/                # Electron + React GUI (Live Translator Hub)
│   │   ├── electron/main.js        # Hlavný proces, IPC kanály a perzistencia konfigurácie
│   │   ├── electron/preload.js     # Komunikačný mostík pre renderovací proces
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # Prekladové runtime jadro (translator-engine.js)
│   ├── patcher-cursor/             # Patcher pre aplikáciu Cursor
│   ├── patcher-claude/             # Patcher pre aplikáciu Claude
│   └── dict-generator/             # Generátor AI slovníkov
```

### Prekladové runtime

`packages/core/src/translator-engine.js` je jediné runtime vstreknuté do cieľovej aplikácie – čistý prehliadačový JavaScript bez modulových závislostí. Zodpovednosti zahŕňajú:

- **Slovníkové vyhľadávanie**: Statické položky + regulárne výrazy
- **Mostík pre AI prekladový proxy**: V prostredí Webview používa `postMessage` na presmerovanie prekladových požiadaviek do hlavného okna, čím obchádza obmedzenia CSP týkajúce sa sieťového pripojenia
- **Prekladová vyrovnávacia pamäť**: Perzistentná vyrovnávacia pamäť založená na `localStorage` s kľúčom `live_i18n_cache_<názov_entity>`
- **Vnorené vyhľadávanie v slovníku**: Podporuje režim `enableNestedDict`

## Hlavné funkcie

### Jednotná správa dvoch enginov

Spravujte stav nasadenia lokalizácie, verzie slovníkov a pravidlá blokovania pre Cursor aj Claude v jednom rozhraní bez potreby prepínania nástrojov.

### Preniknutie do Webview vo všetkých scenároch

Prostredníctvom architektúry Translation Bridge môže schopnosť AI prekladu preniknúť z hlavného okna do všetkých vrstiev Webview pluginov (napr. Claude Code), čím rieši blokovanie sieťového pripojenia pri prísnych CSP politikách.

### Rozloženie funkcií do štyroch panelov

| Panel | Funkcia |
| :--- | :--- |
| **Cursor Engine** | Nasadenie/obnovenie lokalizácie Cursoru, správa pravidiel blokovania pre hlavné okno a Webview pluginy |
| **Claude Engine** | Nasadenie/obnovenie lokalizácie Claude, konfigurácia pravidiel preskakovania |
| **API Keys** | Správa API kľúčov pre viacero AI prekladových enginov (podpora OpenAI, Anthropic, Google Gemini, DeepL), kľúče sú šifrované pomocou Electron `safeStorage` |
| **Dict Generator** | Extrahovanie UI reťazcov zo zdrojového kódu cieľovej aplikácie a hromadné generovanie prekladových slovníkov pomocou AI |

### Interaktívne ladenie

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) prepína zvýraznenie modrým prerušovaným okrajom
- V režime zvýraznenia podržte `Option` (Mac) / `Alt` (Win) a umiestnite kurzor na čínsky text pre zobrazenie pôvodného textu

### Pravidlá blokovania podľa domén

Každá entita (hlavné okno a jednotlivé pluginy) má úplne nezávislú sadu pravidiel blokovania (CSS selektory, URL zhoda, zhoda názvu), čím sa zabezpečí, že oblasť kódu a kľúčové interakčné oblasti nie sú ovplyvnené prekladom.

### Automatické aktualizácie

Vstavaný `electron-updater` podporuje automatickú kontrolu, sťahovanie a inštaláciu aktualizácií v aplikácii na macOS.

## Rýchly štart

```bash
# Inštalácia závislostí
npm install

# Spustenie GUI v režime vývoja
npm run dev

# Zostavenie distribuovateľnej verzie pre macOS
npm run build -w desktop-app
```

### Pracovný postup

1. Nakonfigurujte kľúče AI enginu na paneli **API Keys**
2. Prepnite sa na panel **Cursor Engine** alebo **Claude Engine**
3. Kliknite na **Deploy** pre jednoduché nasadenie lokalizácie
4. Reštartujte cieľovú aplikáciu pre aplikovanie zmien

### Systémové požiadavky

- macOS 13+ (odporúčané)
- Node.js 18+
- Nainštalovaná desktopová aplikácia Cursor alebo Claude

## Bezpečnosť

- **Šifrované ukladanie API kľúčov**: Uložené šifrovane pomocou Electron `safeStorage` do `~/.live_translator_hub/api_keys.enc`, nezapisujú sa do konfiguračných súborov
- **Priama komunikácia**: Prekladové požiadavky smerujú priamo na API výrobcu AI, bez sprostredkujúcich serverov
- **Izolácia domén**: Pravidlá blokovania nezasahujú do zdrojových súborov

---

*Tento projekt slúži len na výmenu poznatkov a vzdelávacie účely. Kvalita prekladu závisí od zvoleného AI modelu.*
