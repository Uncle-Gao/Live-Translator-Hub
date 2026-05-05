# Live Translator Hub

> GUI lokalizačný engine v reálnom čase pre desktopové aplikácie Cursor a Claude — s penetráciou pluginov Webview a asynchrónnym prekladom pomocou AI.

[English](../../README.md) | [日本語](ja-JP.md) | [한국어](ko-KR.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Italiano](it-IT.md) | [Português](pt-BR.md) | [Português](pt-PT.md) | [Nederlands](nl-NL.md) | [Polski](pl-PL.md) | [Svenska](sv-SE.md) | [Dansk](da-DK.md) | [Suomi](fi-FI.md) | [Norsk](nb-NO.md) | [Čeština](cs-CZ.md) | [Română](ro-RO.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Latviešu](lv-LV.md) | [Eesti](et-EE.md) | [Türkçe](tr-TR.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md)

## Prehľad projektu

Live Translator Hub je **Electron + React GUI desktopová aplikácia**, ktorá poskytuje jednoduchú lokalizáciu do čínštiny pre dva nástroje AI programovania: Cursor a Claude. Prostredníctvom jednotného prekladového runtime jadra spravuje nasadenie enginu, konfiguráciu API kľúčov a generovanie slovníkov pre obe cieľové aplikácie v jednom rozhraní.

Tento projekt je architektonickým vylepšením [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub) – prechodom z CLI skriptu na GUI so stavovým panelom a živými logmi, pričom spája lokalizačné schopnosti pre Cursor a Claude do jednej jednotnej platformy.


![Snímka obrazovky](image.png)
![Snímka obrazovky](image-1.png)
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

`packages/core/src/translator-engine.js` je jediné runtime vstrekované do cieľových aplikácií – čistý prehliadačový JavaScript bez modulových závislostí. Zodpovednosti zahŕňajú:

- **Slovníkové vyhľadávanie**: Statické položky + regulárne vzory
- **Most pre AI prekladový proxy**: V prostredí Webview používa `postMessage` na presmerovanie prekladových požiadaviek do hlavného okna, čím obchádza obmedzenia CSP pre sieťový prístup
- **Vyrovnávacia pamäť prekladov**: Perzistentná vyrovnávacia pamäť založená na `localStorage`, kľúč `live_i18n_cache_<entity_name>`
- **Vnorené slovníkové vyhľadávanie**: Podporuje režim `enableNestedDict`

## Hlavné funkcie

### Jednotná správa dvoch enginov

Spravujte stav nasadenia lokalizácie, verzie slovníkov a pravidlá blokovania pre Cursor aj Claude v jednom rozhraní bez potreby prepínania nástrojov.

### Preniknutie Webview vo všetkých scenároch

Prostredníctvom architektúry Translation Bridge môže schopnosť AI prekladu preniknúť z hlavného okna do všetkých úrovní Webview pluginov (napr. Claude Code), čím rieši blokovanie sieťového prístupu pri prísnych CSP politikách.

### Rozloženie štyroch panelov

| Panel | Funkcia |
| :--- | :--- |
| **Cursor Engine** | Nasadenie/obnovenie lokalizácie Cursor, správa pravidiel blokovania pre hlavné okno a Webview pluginy |
| **Claude Engine** | Nasadenie/obnovenie lokalizácie Claude, konfigurácia pravidiel preskočenia |
| **API Keys** | Správa API kľúčov pre viacero AI prekladových enginov (podpora OpenAI, Anthropic, Google Gemini, DeepL), kľúče šifrované pomocou Electron `safeStorage` |
| **Dict Generator** | Extrahovanie UI reťazcov z cieľových aplikácií a hromadné generovanie prekladových slovníkov pomocou AI |

### Interaktívne ladenie

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) prepína modrý prerušovaný zvýrazňovací rámček
- V režime zvýraznenia podržte `Option` (Mac) / `Alt` (Win) a umiestnite kurzor na čínsky text pre zobrazenie pôvodného textu

### Pravidlá blokovania podľa domén

Každá entita (hlavné okno a jednotlivé pluginy) má úplne nezávislú sadu pravidiel blokovania (CSS selektory, URL zhoda, zhoda názvu), čím sa zabezpečuje, že oblasť kódu a kľúčové interakčné oblasti nie sú ovplyvnené prekladom.

### Automatické aktualizácie

Vstavaný `electron-updater` podporuje automatickú kontrolu, sťahovanie a inštaláciu aktualizácií v aplikácii pre macOS.

## Rýchly štart

```bash
# Inštalácia závislostí
npm install

# Spustenie GUI vývojového režimu
npm run dev

# Zostavenie distribuovateľnej verzie pre macOS
npm run build -w desktop-app
```

### Postup použitia

1. Nakonfigurujte kľúče AI enginu v paneli **API Keys**
2. Prepnite na panel **Cursor Engine** alebo **Claude Engine**
3. Kliknite na **Deploy** pre jednoduché nasadenie lokalizácie
4. Reštartujte cieľovú aplikáciu pre aktiváciu

### Systémové požiadavky

- macOS 13+ (odporúčané)
- Node.js 18+
- Nainštalovaná desktopová aplikácia Cursor alebo Claude

## Bezpečnosť

- **Šifrované ukladanie API kľúčov**: Uložené šifrované pomocou Electron `safeStorage` do `~/.live_translator_hub/api_keys.enc`, nezapisujú sa do konfiguračných súborov
- **Priama komunikácia**: Prekladové požiadavky smerujú priamo na API výrobcu AI, bez sprostredkovateľského servera
- **Izolácia domén**: Pravidlá blokovania nezasahujú do zdrojových súborov

---

*Tento projekt slúži len na vzdelávacie účely. Kvalita prekladu závisí od zvoleného AI modelu.*
