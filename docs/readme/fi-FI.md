# Live Translator Hub

> GUI-pohjainen reaaliaikainen lokalisointimoottori Cursor- ja Claude-työpöytäsovelluksille — Webview-liitännäisten läpäisy ja AI-pohjainen asynkroninen käännös.

[English](../../README.md) | [中文](zh-CN.md) | [日本語](ja-JP.md) | [한국어](ko-KR.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Italiano](it-IT.md) | [Português](pt-BR.md) | [Português](pt-PT.md) | [Nederlands](nl-NL.md) | [Polski](pl-PL.md) | [Svenska](sv-SE.md) | [Dansk](da-DK.md) | [Norsk](nb-NO.md) | [Čeština](cs-CZ.md) | [Slovenčina](sk-SK.md) | [Română](ro-RO.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Latviešu](lv-LV.md) | [Eesti](et-EE.md) | [Türkçe](tr-TR.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md)

## Projektin Yleiskatsaus

Live Translator Hub on **Electron + React GUI -työpöytäsovellus**, joka tarjoaa yhden napsautuksen käännöksen kahteen AI-ohjelmointityökaluun: Cursor ja Claude. Yhdistetyn käännösajonaikaisen ytimen avulla voit hallita molempien kohdesovellusten moottorin käyttöönottoa, API-avainten määritystä ja sanakirjan luomista yhdestä käyttöliittymästä.

Tämä projekti on [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub) -arkkitehtuurin päivitysversio – CLI-skriptistä kehittynyt GUI, jossa on tilapaneeli ja reaaliaikaiset lokit, ja se yhdistää Cursorin ja Clauden käännösominaisuudet samalle yhtenäiselle alustalle.

![Kuvakaappaus](../../image.png)
![Kuvakaappaus](../../image-1.png)

## Arkkitehtuuri

```
live-translator-ecosystem/          # npm workspaces monorepo
├── packages/
│   ├── desktop-app/                # Electron + React GUI (Live Translator Hub)
│   │   ├── electron/main.js        # Pääprosessi, IPC-kanavat ja konfiguraation pysyvyys
│   │   ├── electron/preload.js     # Renderöintiprosessin viestintäsilta
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # Käännösajonaikainen ydin (translator-engine.js)
│   ├── patcher-cursor/             # Cursor-sovelluksen Patcher
│   ├── patcher-claude/             # Claude-sovelluksen Patcher
│   └── dict-generator/             # AI-sanakirjageneraattori
```

### Käännösajonaikainen ydin

`packages/core/src/translator-engine.js` on ainoa kohdesovellukseen injektoitu ajonaikainen ydin – puhdasta selaimen JavaScriptiä ilman moduuliriippuvuuksia. Sen vastuualueisiin kuuluu:

- **Sanakirjan täsmäys**: Staattiset termit + säännölliset lausekkeet
- **AI-käännösvälityssilta**: Webview-ympäristössä lähettää käännöspyynnöt `postMessage`-viestillä pääikkunaan, ohittaen CSP-verkkorajoitukset
- **Käännösvälimuisti**: `localStorage`-pohjainen pysyvä välimuisti, avaimen nimellä `live_i18n_cache_<entity_name>`
- **Sisäkkäinen sanakirjahaku**: Tukee `enableNestedDict`-tilaa

## Toimintojen Kohokohdat

### Kaksoismoottorin Yhdistetty Hallinta

Hallitse Cursorin ja Clauden käännöskäyttöönoton tilaa, sanakirjaversioita ja estosääntöjä samasta käyttöliittymästä ilman työkalujen vaihtamista.

### Kaikkien Skenaarioiden Webview-läpäisy

Translation Bridge -arkkitehtuurin avulla AI-käännösominaisuudet voivat tunkeutua pääikkunasta kaikkiin Webview-laajennusten tasoihin (kuten Claude Code), ratkaisten tiukkojen CSP-käytäntöjen aiheuttamat verkkorajoitukset.

### Neljän Paneelin Toimintojen Asettelu

| Paneeli | Toiminto |
| :--- | :--- |
| **Cursor Engine** | Ota käyttöön/palauta Cursorin käännös, hallitse pääikkunan ja Webview-laajennusten erillisiä estosääntöjä |
| **Claude Engine** | Ota käyttöön/palauta Clauden käännös, määritä ohitussäännöt |
| **API Keys** | Hallitse useiden AI-käännösmoottorien API-avaimia (tukee OpenAI, Anthropic, Google Gemini, DeepL), avaimet salattu Electron `safeStorage` -toiminnolla |
| **Dict Generator** | Poimi UI-merkkijonot kohdesovelluksen lähdekoodista ja luo AI:n avulla käännössanakirjoja erissä |

### Vuorovaikutteinen Virheenkorjaus

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) vaihtaa sinisen katkoviivan korostusreunuksen
- Korostustilassa pidä `Option` (Mac) / `Alt` (Win) -näppäintä painettuna ja vie hiiri kiinankielisen tekstin päälle nähdäksesi alkuperäisen tekstin

### Erilliset Estosäännöt

Jokaisella entiteetillä (pääikkuna ja jokainen laajennus) on täysin itsenäinen estosääntöjoukko (CSS-valitsimet, URL-osoitteen täsmäys, otsikon täsmäys), varmistaen, että koodialue ja keskeiset vuorovaikutusalueet eivät vaikuta käännökseen.

### Automaattiset Päivitykset

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
2. Siirry **Cursor Engine** tai **Claude Engine** -paneeliin
3. Napsauta **Deploy** ottaaksesi käännöksen käyttöön yhdellä napsautuksella
4. Käynnistä kohdesovellus uudelleen, jotta muutokset tulevat voimaan

### Järjestelmävaatimukset

- macOS 13+ (suositeltu)
- Node.js 18+
- Cursor tai Claude -työpöytäsovellus asennettuna

## Turvallisuus

- **API-avainten salattu tallennus**: Tallennetaan salattuna Electron `safeStorage` -toiminnolla tiedostoon `~/.live_translator_hub/api_keys.enc`, ei kirjoiteta konfiguraatiotiedostoon
- **Suora viestintä**: Käännöspyynnöt menevät suoraan AI-toimittajan API:lle, ei välityspalvelimia
- **Erillinen eristys**: Estosäännöt eivät kosketa lähdekooditiedostoja

---

*Tämä projekti on tarkoitettu vain oppimis- ja vaihtokäyttöön. Käännöksen laatuun vaikuttaa valittu AI-malli.*
