# Live Translator Hub

> GUI-pohjainen reaaliaikainen lokalisointimoottori Cursor- ja Claude-työpöytäsovelluksille — Webview-liitännäisten läpäisy ja AI-pohjainen asynkroninen käännös.

[English](../../README.md) | [日本語](ja-JP.md) | [한국어](ko-KR.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Italiano](it-IT.md) | [Português](pt-BR.md) | [Português](pt-PT.md) | [Nederlands](nl-NL.md) | [Polski](pl-PL.md) | [Svenska](sv-SE.md) | [Dansk](da-DK.md) | [Norsk](nb-NO.md) | [Čeština](cs-CZ.md) | [Slovenčina](sk-SK.md) | [Română](ro-RO.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Latviešu](lv-LV.md) | [Eesti](et-EE.md) | [Türkçe](tr-TR.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md)

## Projektin Yleiskatsaus

Live Translator Hub on **Electron + React GUI -työpöytäsovellus**, joka tarjoaa yhden napsautuksen käännöksen Cursor- ja Claude-AI-ohjelmointityökaluille. Yhdistetyn käännösajonaikaisen ytimen avulla hallitaan kahden kohdesovelluksen moottorin käyttöönottoa, API-avainten määritystä ja sanakirjan luomista yhdessä käyttöliittymässä.

Tämä projekti on [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub):n arkkitehtuuripäivitys – CLI-skriptistä kehittynyt GUI, jossa on tilapaneeli ja reaaliaikainen loki, ja joka yhdistää Cursorin ja Clauden käännösominaisuudet samalle yhtenäiselle alustalle.


## Arkkitehtuuri

```
live-translator-ecosystem/          # npm workspaces monorepo
├── packages/
│   ├── desktop-app/                # Electron + React GUI (Live Translator Hub)
│   │   ├── electron/main.js        # Pääprosessi, IPC-kanavat ja konfiguraation pysyväistallennus
│   │   ├── electron/preload.js     # Renderöintiprosessin viestintäsilta
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # Käännösajonaikainen ydin (translator-engine.js)
│   ├── patcher-cursor/             # Cursor-sovelluksen Patcher
│   ├── patcher-claude/             # Claude-sovelluksen Patcher
│   └── dict-generator/             # AI-sanakirjageneraattori
```

### Käännösajonaikainen ydin

`packages/core/src/translator-engine.js` on ainoa kohdesovellukseen injektoitu ajonaikainen ydin – puhdasta selaimen JavaScriptiä, ilman moduuliriippuvuuksia. Vastuualueita ovat:

- **Sanakirjahaku**: Staattiset termit + säännölliset lausekkeet
- **AI-käännösvälityssilta**: Webview-ympäristössä lähettää käännöspyynnöt `postMessage`:n kautta pääikkunaan, ohittaen CSP:n verkkorajoitukset
- **Käännösvälimuisti**: `localStorage`-pohjainen pysyvä välimuisti, avaimen nimellä `live_i18n_cache_<entity_name>`
- **Sisäkkäinen sanakirjahaku**: Tukee `enableNestedDict`-tilaa

## Toiminnallisuudet

### Kaksoismoottorin yhtenäinen hallinta

Hallitse Cursorin ja Clauden käännöksen käyttöönoton tilaa, sanakirjaversioita ja estosääntöjä samassa käyttöliittymässä ilman työkalujen vaihtoa.

### Webview-läpäisy kaikissa skenaarioissa

Translation Bridge -arkkitehtuurin avulla AI-käännösominaisuudet voivat tunkeutua pääikkunasta kaikkiin Webview-laajennusten tasoihin (kuten Claude Code), ratkaisten tiukkojen CSP-käytäntöjen aiheuttamat verkkorajoitukset.

### Neljän paneelin toimintasijoittelu

| Paneeli | Toiminto |
| :--- | :--- |
| **Cursor Engine** | Ota käyttöön/palauta Cursorin käännös, hallitse pääikkunan ja Webview-laajennusten erillisiä estosääntöjä |
| **Claude Engine** | Ota käyttöön/palauta Clauden käännös, määritä ohitussäännöt |
| **API Keys** | Hallitse useiden AI-käännösmoottorien API-avaimia (tukee OpenAI, Anthropic, Google Gemini, DeepL), avaimet salattu Electron `safeStorage`:lla |
| **Dict Generator** | Poimi UI-merkkijonot kohdesovelluksen lähdekoodista ja luo AI:n avulla käännössanakirjoja erissä |

### Vuorovaikutteinen virheenkorjaus

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) vaihtaa sinisen katkoviivan korostusreunuksen
- Korostustilassa pidä `Option` (Mac) / `Alt` (Win) -näppäintä painettuna ja vie hiiri kiinankielisen tekstin päälle nähdäksesi alkuperäisen tekstin

### Erilliset estosäännöt

Jokaisella entiteetillä (pääikkuna ja jokainen laajennus) on täysin itsenäinen estosääntöjoukko (CSS-valitsimet, URL-osoitteen vastaavuus, otsikon vastaavuus), varmistaen, että koodialue ja ydintoiminnallisuudet eivät vaikuta käännökseen.

### Automaattiset päivitykset

Sisäänrakennettu `electron-updater`, tukee macOS-sovelluksen sisäistä automaattista tarkistusta, latausta ja päivitysten asennusta.

## Pika-aloitus

```bash
# Asenna riippuvuudet
npm install

# Käynnistä GUI-kehitystila
npm run dev

# Rakenna macOS-jakeluversio
npm run build -w desktop-app
```

### Käyttöprosessi

1. Määritä AI-moottorin avaimet **API Keys** -paneelissa
2. Siirry **Cursor Engine**- tai **Claude Engine** -paneeliin
3. Napsauta **Deploy** ottaaksesi käännöksen käyttöön yhdellä napsautuksella
4. Käynnistä kohdesovellus uudelleen, jotta muutokset tulevat voimaan

### Järjestelmävaatimukset

- macOS 13+ (suositeltu)
- Node.js 18+
- Cursor- tai Claude-työpöytäsovellus asennettuna

## Turvallisuus

- **API-avainten salattu tallennus**: Tallennetaan salattuna Electron `safeStorage`:n avulla tiedostoon `~/.live_translator_hub/api_keys.enc`, ei kirjoiteta konfiguraatiotiedostoihin
- **Suora viestintä**: Käännöspyynnöt menevät suoraan AI-toimittajan API:lle, ilman välityspalvelimia
- **Erillinen eristys**: Estosäännöt eivät kosketa lähdekooditiedostoja

---

*Tämä projekti on tarkoitettu vain oppimis- ja vaihtokäyttöön. Käännöksen laatu riippuu valitusta AI-mallista.*
