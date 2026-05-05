# Live Translator Hub

> Un motor de localizare în timp real cu GUI pentru aplicațiile desktop Cursor și Claude — cu penetrare a pluginurilor Webview și traducere asincronă AI.

[English](../../README.md) | [日本語](ja-JP.md) | [한국어](ko-KR.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Italiano](it-IT.md) | [Português](pt-BR.md) | [Português](pt-PT.md) | [Nederlands](nl-NL.md) | [Polski](pl-PL.md) | [Svenska](sv-SE.md) | [Dansk](da-DK.md) | [Suomi](fi-FI.md) | [Norsk](nb-NO.md) | [Čeština](cs-CZ.md) | [Slovenčina](sk-SK.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Latviešu](lv-LV.md) | [Eesti](et-EE.md) | [Türkçe](tr-TR.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md)

## Prezentare generală a proiectului

Live Translator Hub este o **aplicație desktop GUI Electron + React** care oferă traducere într-un singur clic pentru două instrumente de programare AI: Cursor și Claude. Printr-un nucleu unificat de runtime de traducere, gestionează implementarea motorului, configurarea cheilor API și generarea dicționarelor pentru ambele aplicații țintă dintr-o singură interfață.

Acest proiect este o versiune arhitecturală îmbunătățită a [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub) — evoluând de la un script CLI la o interfață GUI cu panou de stare și jurnal în timp real, unificând capacitățile de traducere pentru Cursor și Claude într-o singură platformă.


![Captură de ecran](image.png)
![Captură de ecran](image-1.png)
## Arhitectură

```
live-translator-ecosystem/          # Monorepo npm workspaces
├── packages/
│   ├── desktop-app/                # GUI Electron + React (Live Translator Hub)
│   │   ├── electron/main.js        # Proces principal, canale IPC și persistență configurare
│   │   ├── electron/preload.js     # Punte de comunicare pentru procesul de randare
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # Nucleu runtime de traducere (translator-engine.js)
│   ├── patcher-cursor/             # Patcher pentru aplicația Cursor
│   ├── patcher-claude/             # Patcher pentru aplicația Claude
│   └── dict-generator/             # Generator de dicționare AI
```

### Runtime de traducere

`packages/core/src/translator-engine.js` este singurul runtime injectat în aplicațiile țintă — JavaScript pur de browser, fără dependențe de module. Responsabilitățile includ:

- **Potrivire dicționar**: intrări statice + modele regex
- **Punte proxy de traducere AI**: în mediul Webview, folosește `postMessage` pentru a redirecționa cererile de traducere către fereastra principală, ocolind restricțiile CSP de rețea
- **Cache de traducere**: cache persistent bazat pe `localStorage`, cu cheia `live_i18n_cache_<entity_name>`
- **Căutare dicționar imbricat**: suportă modul `enableNestedDict`

## Caracteristici principale

### Gestionare unificată a două motoare

Gestionați starea de implementare a traducerii, versiunile dicționarelor și regulile de excludere pentru Cursor și Claude dintr-o singură interfață, fără a comuta între instrumente.

### Penetrare Webview în toate scenariile

Prin arhitectura Translation Bridge, capacitățile de traducere AI pot pătrunde din fereastra principală în toate pluginurile Webview (de exemplu, Claude Code), rezolvând blocarea rețelei sub politici CSP stricte.

### Aspect funcțional cu patru panouri

| Panou | Funcție |
| :--- | :--- |
| **Cursor Engine** | Implementează/restaurează traducerea Cursor, gestionează regulile de excludere pe domenii pentru fereastra principală și pluginurile Webview |
| **Claude Engine** | Implementează/restaurează traducerea Claude, configurează reguli de omitere |
| **API Keys** | Gestionează cheile API pentru mai multe motoare de traducere AI (suportă OpenAI, Anthropic, Google Gemini, DeepL), cheile sunt stocate criptat prin `safeStorage` al Electron |
| **Dict Generator** | Extrage șiruri UI din codul sursă al aplicației țintă și generează dicționare de traducere în loturi prin AI |

### Debugging interactiv

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) comută chenarul de evidențiere punctat albastru
- În modul de evidențiere, țineți apăsat `Option` (Mac) / `Alt` (Win) și plasați cursorul peste textul chinez pentru a vedea textul original

### Reguli de excludere pe domenii

Fiecare entitate (fereastra principală și fiecare plugin) are un set complet independent de reguli de excludere (selectoare CSS, potrivire URL, potrivire titlu), asigurând că zona de cod și zona de interacțiune principală nu sunt afectate de traducere.

### Actualizare automată

Include `electron-updater`, suportă verificarea, descărcarea și instalarea automată a actualizărilor în aplicație pe macOS.

## Începere rapidă

```bash
# Instalare dependențe
npm install

# Pornire mod dezvoltare GUI
npm run dev

# Construire versiune distribuibilă macOS
npm run build -w desktop-app
```

### Flux de utilizare

1. Configurați cheile motorului AI în panoul **API Keys**
2. Comutați la panoul **Cursor Engine** sau **Claude Engine**
3. Faceți clic pe **Deploy** pentru a implementa traducerea cu un singur clic
4. Reporniți aplicația țintă pentru ca modificările să intre în vigoare

### Cerințe de sistem

- macOS 13+ (recomandat)
- Node.js 18+
- Aplicația desktop Cursor sau Claude instalată

## Securitate

- **Stocare criptată a cheilor API**: criptate prin `safeStorage` al Electron și salvate în `~/.live_translator_hub/api_keys.enc`, fără a fi scrise în fișiere de configurare
- **Comunicare directă**: cererile de traducere ajung direct la API-ul furnizorului AI, fără servere intermediare
- **Izolare pe domenii**: regulile de excludere nu modifică fișierele sursă

---

*Acest proiect este destinat exclusiv schimbului de cunoștințe și învățării. Calitatea traducerii depinde de modelul AI selectat.*
