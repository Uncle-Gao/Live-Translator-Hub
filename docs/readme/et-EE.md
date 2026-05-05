# Live Translator Hub

> GUI-põhine reaalajas lokaliseerimismootor Cursori ja Claude'i töölauarakendustele — Webview pluginatega läbistamise ja AI-põhise asünkroonse tõlkega.

[English](../../README.md) | [日本語](ja-JP.md) | [한국어](ko-KR.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Italiano](it-IT.md) | [Português](pt-BR.md) | [Português](pt-PT.md) | [Nederlands](nl-NL.md) | [Polski](pl-PL.md) | [Svenska](sv-SE.md) | [Dansk](da-DK.md) | [Suomi](fi-FI.md) | [Norsk](nb-NO.md) | [Čeština](cs-CZ.md) | [Slovenčina](sk-SK.md) | [Română](ro-RO.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Latviešu](lv-LV.md) | [Türkçe](tr-TR.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md)

## Projekti ülevaade

Live Translator Hub on **Electron + React GUI töölauarakendus**, mis pakub ühe klõpsuga tõlkimist kahele AI programmeerimistööriistale: Cursor ja Claude. Ühtse tõlke käitusaja tuuma kaudu haldab see ühes liideses kahe sihtrakenduse mootorite juurutamist, API võtmete konfigureerimist ja sõnastike genereerimist.

See projekt on [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub) arhitektuuriline uuendus – CLI skriptidest arenenud GUI-ks, millel on olekupaneel ja reaalajas logid, ning mis ühendab Cursori ja Claude'i tõlkimisvõimalused üheks ühtseks platvormiks.

![Kuvatõmmis](../../image.png)
![Kuvatõmmis](../../image-1.png)

## Arhitektuur

```
live-translator-ecosystem/          # npm tööruumide monorepo
├── packages/
│   ├── desktop-app/                # Electron + React GUI (Live Translator Hub)
│   │   ├── electron/main.js        # Põhiprotsess, IPC kanalid ja konfiguratsiooni püsistamine
│   │   ├── electron/preload.js     # Renderdusprotsessi suhtlussild
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # Tõlke käitusaja tuum (translator-engine.js)
│   ├── patcher-cursor/             # Cursori rakenduse paikaja
│   ├── patcher-claude/             # Claude'i rakenduse paikaja
│   └── dict-generator/             # AI sõnastike generaator
```

### Tõlke käitusaeg

`packages/core/src/translator-engine.js` on ainus käitusaeg, mis süstitakse sihtrakendusse – puhas brauseri JavaScript, ilma moodulisõltuvusteta. Ülesanded hõlmavad:

- **Sõnastiku sobitamine**: staatilised kirjed + regulaaravaldise mustrid
- **AI tõlke puhversild**: Webview keskkonnas edastab `postMessage` kaudu tõlkepäringud põhiaknasse, möödudes CSP võrgupiirangutest
- **Tõlke vahemälu**: `localStorage`-põhine püsiv vahemälu, võtme nimega `live_i18n_cache_<entity_name>`
- **Pesastatud sõnastiku otsing**: toetab `enableNestedDict` režiimi

## Funktsioonide esiletõstmised

### Kahe mootori ühtne haldus

Ühes liideses saab eraldi hallata Cursori ja Claude'i tõlkimise juurutamise olekut, sõnastiku versioone ja blokeerimisreegleid, ilma et peaks tööriistu vahetama.

### Kõikide stseenide Webview läbimurre

Tõlke puhversilla arhitektuuri kaudu saab AI tõlkevõimekus tungida põhiaknast kõikidesse Webview pluginatesse (nt Claude Code), lahendades range CSP poliitika põhjustatud võrgu blokeerimise probleemid.

### Nelja paneeli funktsionaalne paigutus

| Paneel | Funktsioon |
| :--- | :--- |
| **Cursor Engine** | Cursori tõlkimise juurutamine/taastamine, põhiakna ja Webview pluginate domeenipõhiste blokeerimisreeglite haldamine |
| **Claude Engine** | Claude'i tõlkimise juurutamine/taastamine, vahelejätmise reeglite konfigureerimine |
| **API Keys** | Mitme AI tõlkemootori API võtmete haldamine (toetab OpenAI, Anthropic, Google Gemini, DeepL), võtmed krüpteeritakse Electron `safeStorage` abil |
| **Dict Generator** | UI stringide eraldamine sihtrakenduse lähtekoodist ja AI abil tõlkesõnastike hulgigeneerimine |

### Interaktiivne silumine

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) lülitab sinise katkendjoonega esiletõstmise raami
- Esiletõstmise režiimis hoidke all `Option` (Mac) / `Alt` (Win) ja hõljutage hiirt hiina keele kohal, et näha originaalteksti

### Domeenipõhised blokeerimisreeglid

Igal üksusel (põhiaken ja iga plugin) on täiesti sõltumatud blokeerimisreeglite komplektid (CSS selektorid, URL-i sobitamine, pealkirja sobitamine), tagades, et koodialad ja põhilised interaktsioonialad ei ole tõlkimisest mõjutatud.

### Automaatne uuendamine

Sisseehitatud `electron-updater` toetab macOS-i rakendusesisest automaatset uuenduste kontrollimist, allalaadimist ja paigaldamist.

## Kiire alustamine

```bash
# Sõltuvuste paigaldamine
npm install

# GUI arendusrežiimi käivitamine
npm run dev

# macOS-i levitatava versiooni ehitamine
npm run build -w desktop-app
```

### Kasutusprotsess

1. **API Keys** paneelil konfigureerige AI mootori võtmed
2. Lülituge **Cursor Engine** või **Claude Engine** paneelile
3. Klõpsake **Deploy**, et ühe klõpsuga tõlge juurutada
4. Taaskäivitage sihtrakendus, et muudatused jõustuksid

### Süsteeminõuded

- macOS 13+ (soovitatav)
- Node.js 18+
- Cursori või Claude'i töölauarakendus on paigaldatud

## Turvalisus

- **API võtmete krüpteeritud salvestamine**: Krüpteeritakse Electron `safeStorage` abil ja salvestatakse faili `~/.live_translator_hub/api_keys.enc`, mitte konfiguratsioonifaili
- **Otsesuhtlus**: Tõlkepäringud lähevad otse AI tootja API-le, ilma vaheserverita
- **Domeenipõhine isoleerimine**: Blokeerimisreeglid ei puuduta lähtekoodifaile

---

*See projekt on mõeldud ainult õppimiseks ja suhtlemiseks. Tõlke kvaliteeti mõjutab valitud AI mudel.*
