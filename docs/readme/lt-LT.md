# Live Translator Hub

> GUI pagrįstas realaus laiko lokalizacijos variklis Cursor ir Claude darbalaukio programoms — su Webview įskiepių skverbimu ir AI pagrįstu asinchroniniu vertimu.

[English](../../README.md) | [日本語](ja-JP.md) | [한국어](ko-KR.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Italiano](it-IT.md) | [Português](pt-BR.md) | [Português](pt-PT.md) | [Nederlands](nl-NL.md) | [Polski](pl-PL.md) | [Svenska](sv-SE.md) | [Dansk](da-DK.md) | [Suomi](fi-FI.md) | [Norsk](nb-NO.md) | [Čeština](cs-CZ.md) | [Slovenčina](sk-SK.md) | [Română](ro-RO.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Latviešu](lv-LV.md) | [Eesti](et-EE.md) | [Türkçe](tr-TR.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md)

## Projekto apžvalga

„Live Translator Hub“ yra **„Electron + React GUI“ darbalaukio programa**, skirta vienu paspaudimu išversti į kinų kalbą dvi AI programavimo priemones – „Cursor“ ir „Claude“. Naudodama vieningą vertimo vykdymo branduolį, programa vienoje sąsajoje valdo abiejų tikslinių programų variklių diegimą, API raktų konfigūraciją ir žodynų generavimą.

Šis projektas yra [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub) architektūrinis atnaujinimas – nuo CLI scenarijaus iki GUI su būsenos skydeliu ir realaus laiko žurnalais, sujungiant „Cursor“ ir „Claude“ vertimo galimybes į vieną bendrą platformą.


## Architektūra

```
live-translator-ecosystem/          # npm workspaces monorepo
├── packages/
│   ├── desktop-app/                # Electron + React GUI (Live Translator Hub)
│   │   ├── electron/main.js        # Pagrindinis procesas, IPC kanalai ir konfigūracijos išsaugojimas
│   │   ├── electron/preload.js     # Atvaizdavimo proceso ryšio tiltas
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # Vertimo vykdymo branduolys (translator-engine.js)
│   ├── patcher-cursor/             # „Cursor“ programos taisymo įrankis
│   ├── patcher-claude/             # „Claude“ programos taisymo įrankis
│   └── dict-generator/             # AI žodynų generatorius
```

### Vertimo vykdymo branduolys

`packages/core/src/translator-engine.js` yra vienintelis vykdymo branduolys, įterpiamas į tikslinę programą – grynas naršyklės JS, be modulių priklausomybių. Jo atsakomybės apima:

- **Žodynų atitikimas**: statiniai įrašai + reguliariųjų išraiškų šablonai
- **AI vertimo tarpininko tiltas**: „Webview“ aplinkoje naudoja `postMessage` vertimo užklausoms perduoti į pagrindinį langą, apeinant CSP tinklo apribojimus
- **Vertimo talpykla**: nuolatinė talpykla, pagrįsta `localStorage`, raktas: `live_i18n_cache_<entity_name>`
- **Įdėtinė žodynų paieška**: palaiko `enableNestedDict` režimą

## Funkcijų akcentai

### Vieningas dviejų variklių valdymas

Toje pačioje sąsajoje atskirai valdykite „Cursor“ ir „Claude“ vertimo diegimo būseną, žodynų versijas ir blokavimo taisykles, nereikia keisti įrankių.

### Visų scenarijų „Webview“ prasiskverbimas

Naudojant vertimo tilto architektūrą, AI vertimo galimybės gali prasiskverbti iš pagrindinio lango į visų lygių „Webview“ papildinius (pvz., „Claude Code“), išsprendžiant tinklo blokavimo problemas, kylančias dėl griežtų CSP strategijų.

### Keturių skydelių funkcinis išdėstymas

| Skydelis | Funkcija |
| :--- | :--- |
| **Cursor Engine** | Diegti / atkurti „Cursor“ vertimą, valdyti pagrindinio lango ir „Webview“ papildinių domenų blokavimo taisykles |
| **Claude Engine** | Diegti / atkurti „Claude“ vertimą, konfigūruoti praleidimo taisykles |
| **API Keys** | Valdyti kelių AI vertimo variklių API raktus (palaiko OpenAI, Anthropic, Google Gemini, DeepL), raktai šifruojami naudojant Electron `safeStorage` |
| **Dict Generator** | Iš tikslinės programos šaltinio kodo išgauti UI eilutes, naudojant AI masiškai generuoti vertimo žodynus |

### Interaktyvus derinimas

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) – perjungti mėlyną punktyrinį paryškinimo rėmelį
- Paryškinimo režimu laikykite `Option` (Mac) / `Alt` (Win) ir užveskite pelę ant kinų kalbos teksto, kad pamatytumėte originalą

### Domenų blokavimo taisyklės

Kiekvienas objektas (pagrindinis langas ir kiekvienas papildinys) turi visiškai nepriklausomą blokavimo taisyklių rinkinį (CSS selektoriai, URL atitikimas, pavadinimo atitikimas), užtikrinant, kad kodo sritis ir pagrindinės sąveikos sritys nebūtų paveiktos vertimo.

### Automatinis atnaujinimas

Integruotas `electron-updater`, palaikantis automatinį naujinimų tikrinimą, atsisiuntimą ir diegimą macOS programoje.

## Greita pradžia

```bash
# Įdiegti priklausomybes
npm install

# Paleisti GUI kūrimo režimą
npm run dev

# Sukurti macOS platinamą versiją
npm run build -w desktop-app
```

### Naudojimo eiga

1. Skydelyje **API Keys** sukonfigūruokite AI variklio raktus
2. Pereikite į skydelį **Cursor Engine** arba **Claude Engine**
3. Spustelėkite **Deploy**, kad vienu paspaudimu įdiegtumėte vertimą
4. Paleiskite iš naujo tikslinę programą, kad pakeitimai įsigaliotų

### Sistemos reikalavimai

- macOS 13+ (rekomenduojama)
- Node.js 18+
- Įdiegta „Cursor“ arba „Claude“ darbalaukio programa

## Saugumas

- **Šifruotas API raktų saugojimas**: naudojant Electron `safeStorage` šifruojama ir išsaugoma `~/.live_translator_hub/api_keys.enc`, nerašoma į konfigūracijos failus
- **Tiesioginis ryšys**: vertimo užklausos siunčiamos tiesiai į AI gamintojo API, be tarpinių serverių
- **Domenų izoliacija**: blokavimo taisyklės neliečia šaltinio kodo failų

---

*Šis projektas skirtas tik mokymosi ir keitimosi žiniomis tikslais. Vertimo kokybė priklauso nuo pasirinkto AI modelio.*
