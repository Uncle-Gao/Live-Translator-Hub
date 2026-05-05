# Live Translator Hub

> GUI lokalizační engine v reálném čase pro desktopové aplikace Cursor a Claude — s penetrací pluginů Webview a asynchronním překladem pomocí AI.

[English](../../README.md) | [日本語](ja-JP.md) | [한국어](ko-KR.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Italiano](it-IT.md) | [Português](pt-BR.md) | [Português](pt-PT.md) | [Nederlands](nl-NL.md) | [Polski](pl-PL.md) | [Svenska](sv-SE.md) | [Dansk](da-DK.md) | [Suomi](fi-FI.md) | [Norsk](nb-NO.md) | [Slovenčina](sk-SK.md) | [Română](ro-RO.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Latviešu](lv-LV.md) | [Eesti](et-EE.md) | [Türkçe](tr-TR.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md)

## Přehled projektu

**Live Translator Hub** je desktopová aplikace s **Electron + React GUI**, která poskytuje jedním kliknutím lokalizaci do čínštiny pro dva nástroje AI programování: Cursor a Claude. Prostřednictvím jednotného překladového runtime jádra spravuje nasazení enginu, konfiguraci API klíčů a generování slovníků pro oba cílové aplikace v jednom rozhraní.

Tento projekt je architektonickým upgradem [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub) – přechodem z CLI skriptu na GUI s panelem stavu a živými logy, přičemž spojuje lokalizační schopnosti pro Cursor a Claude do jedné jednotné platformy.


## Architektura

```
live-translator-ecosystem/          # npm workspaces monorepo
├── packages/
│   ├── desktop-app/                # Electron + React GUI (Live Translator Hub)
│   │   ├── electron/main.js        # Hlavní proces, IPC kanály a perzistence konfigurace
│   │   ├── electron/preload.js     # Komunikační most pro renderovací proces
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # Překladové runtime jádro (translator-engine.js)
│   ├── patcher-cursor/             # Patcher pro aplikaci Cursor
│   ├── patcher-claude/             # Patcher pro aplikaci Claude
│   └── dict-generator/             # Generátor AI slovníků
```

### Překladové runtime

`packages/core/src/translator-engine.js` je jediné runtime vložené do cílových aplikací – čistý prohlížečový JS bez modulových závislostí. Mezi jeho povinnosti patří:

- **Párování slovníků**: Statické položky + regulární vzory
- **Proxy most pro AI překlad**: V prostředí Webview přesměrovává požadavky na překlad pomocí `postMessage` do hlavního okna, čímž obchází omezení CSP pro přístup k síti
- **Cache překladů**: Perzistentní cache založená na `localStorage`, klíč `live_i18n_cache_<entity_name>`
- **Vyhledávání ve vnořených slovnících**: Podpora režimu `enableNestedDict`

## Hlavní funkce

### Jednotná správa dvou enginů

V jednom rozhraní spravujte stav nasazení lokalizace, verze slovníků a pravidla blokování pro Cursor i Claude, aniž byste museli přepínat nástroje.

### Průnik do Webview ve všech scénářích

Díky architektuře Translation Bridge může schopnost AI překladu proniknout z hlavního okna do všech vrstev Webview pluginů (např. Claude Code), čímž řeší blokování přístupu k síti při přísných CSP politikách.

### Rozložení funkcí do čtyř panelů

| Panel | Funkce |
| :--- | :--- |
| **Cursor Engine** | Nasazení/obnovení lokalizace Cursoru, správa pravidel blokování pro hlavní okno a Webview pluginy |
| **Claude Engine** | Nasazení/obnovení lokalizace Claude, konfigurace pravidel přeskočení |
| **API Keys** | Správa API klíčů pro více AI překladových enginů (podpora OpenAI, Anthropic, Google Gemini, DeepL), klíče šifrovány pomocí Electron `safeStorage` |
| **Dict Generator** | Extrakce UI řetězců ze zdrojového kódu cílové aplikace a hromadné generování překladových slovníků pomocí AI |

### Interaktivní ladění

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) přepíná zvýraznění modrým přerušovaným rámečkem
- V režimu zvýraznění podržte `Option` (Mac) / `Alt` (Win) a najeďte na čínský text pro zobrazení originálu

### Pravidla blokování podle domén

Každá entita (hlavní okno a jednotlivé pluginy) má zcela nezávislou sadu pravidel blokování (CSS selektory, shoda URL, shoda názvu), což zajišťuje, že oblast kódu a klíčové interakční oblasti nejsou ovlivněny překladem.

### Automatické aktualizace

Integrovaný `electron-updater` podporuje automatickou kontrolu, stahování a instalaci aktualizací v aplikaci na macOS.

## Rychlý start

```bash
# Instalace závislostí
npm install

# Spuštění GUI v režimu vývoje
npm run dev

# Sestavení distribuovatelné verze pro macOS
npm run build -w desktop-app
```

### Pracovní postup

1. V panelu **API Keys** nakonfigurujte klíče AI enginu
2. Přepněte na panel **Cursor Engine** nebo **Claude Engine**
3. Klikněte na **Deploy** pro nasazení lokalizace jedním kliknutím
4. Restartujte cílovou aplikaci pro uplatnění změn

### Systémové požadavky

- macOS 13+ (doporučeno)
- Node.js 18+
- Nainstalovaná desktopová aplikace Cursor nebo Claude

## Bezpečnost

- **Šifrované ukládání API klíčů**: Uloženo šifrovaně pomocí Electron `safeStorage` do `~/.live_translator_hub/api_keys.enc`, nezapisuje se do konfiguračních souborů
- **Přímá komunikace**: Požadavky na překlad směřují přímo k API poskytovatele AI, bez prostředního serveru
- **Izolace domén**: Pravidla blokování se nedotýkají zdrojových souborů

---

*Tento projekt slouží pouze pro výměnu znalostí a učení. Kvalita překladu závisí na zvoleném AI modelu.*
