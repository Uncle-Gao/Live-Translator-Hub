# Live Translator Hub

> Un motore di localizzazione in tempo reale con GUI per le app desktop Cursor e Claude — con penetrazione dei plugin Webview e traduzione asincrona AI.

[English](../../README.md) | [日本語](ja-JP.md) | [한국어](ko-KR.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Português](pt-BR.md) | [Português](pt-PT.md) | [Nederlands](nl-NL.md) | [Polski](pl-PL.md) | [Svenska](sv-SE.md) | [Dansk](da-DK.md) | [Suomi](fi-FI.md) | [Norsk](nb-NO.md) | [Čeština](cs-CZ.md) | [Slovenčina](sk-SK.md) | [Română](ro-RO.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Latviešu](lv-LV.md) | [Eesti](et-EE.md) | [Türkçe](tr-TR.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md)

## Panoramica del Progetto

Live Translator Hub è un'applicazione desktop **Electron + React GUI** che fornisce la localizzazione in cinese con un clic per due strumenti di programmazione AI: Cursor e Claude. Attraverso un kernel runtime di traduzione unificato, gestisce in un'unica interfaccia la distribuzione dei motori, la configurazione delle chiavi API e la generazione dei dizionari per entrambe le applicazioni target.

Questo progetto è un aggiornamento architetturale di [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub) – evoluto da script CLI a una GUI con pannello di stato e log in tempo reale, unificando le capacità di localizzazione di Cursor e Claude in un'unica piattaforma.


## Architettura

```
live-translator-ecosystem/          # npm workspaces monorepo
├── packages/
│   ├── desktop-app/                # Electron + React GUI (Live Translator Hub)
│   │   ├── electron/main.js        # Processo principale, canali IPC e persistenza configurazione
│   │   ├── electron/preload.js     # Ponte di comunicazione per il processo di rendering
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # Kernel runtime di traduzione (translator-engine.js)
│   ├── patcher-cursor/             # Patcher per l'applicazione Cursor
│   ├── patcher-claude/             # Patcher per l'applicazione Claude
│   └── dict-generator/             # Generatore di dizionari AI
```

### Runtime di Traduzione

`packages/core/src/translator-engine.js` è l'unico runtime iniettato nelle applicazioni target – puro JavaScript browser, senza dipendenze da moduli. Le sue responsabilità includono:

- **Corrispondenza dizionario**: voci statiche + pattern regex
- **Ponte proxy di traduzione AI**: nell'ambiente Webview, utilizza `postMessage` per inoltrare le richieste di traduzione alla finestra principale, bypassando le restrizioni di rete CSP
- **Cache di traduzione**: cache persistente basata su `localStorage`, con chiave `live_i18n_cache_<entity_name>`
- **Ricerca dizionario annidato**: supporta la modalità `enableNestedDict`

## Punti Salienti delle Funzionalità

### Gestione Unificata dei Due Motori

Gestisci lo stato di distribuzione della localizzazione, le versioni del dizionario e le regole di blocco per Cursor e Claude dalla stessa interfaccia, senza dover cambiare strumento.

### Penetrazione Webview in Tutti gli Scenari

Grazie all'architettura Translation Bridge, la capacità di traduzione AI può penetrare dalla finestra principale a tutti i livelli dei plugin Webview (es. Claude Code), risolvendo i problemi di blocco di rete sotto politiche CSP restrittive.

### Layout Funzionale a Quattro Pannelli

| Pannello | Funzione |
| :--- | :--- |
| **Cursor Engine** | Distribuisci/Ripristina la localizzazione di Cursor, gestisci le regole di blocco per dominio per finestra principale e plugin Webview |
| **Claude Engine** | Distribuisci/Ripristina la localizzazione di Claude, configura le regole di salto |
| **API Keys** | Gestisci le chiavi API per più motori di traduzione AI (supporta OpenAI, Anthropic, Google Gemini, DeepL), le chiavi sono crittografate tramite Electron `safeStorage` |
| **Dict Generator** | Estrae stringhe UI dall'applicazione target e genera in batch dizionari di traduzione tramite AI |

### Debug Interattivo

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) per attivare/disattivare il bordo evidenziato blu tratteggiato
- In modalità evidenziazione, tieni premuto `Option` (Mac) / `Alt` (Win) e passa il mouse sul testo cinese per vedere il testo originale

### Regole di Blocco per Dominio

Ogni entità (finestra principale e singoli plugin) possiede un set di regole di blocco completamente indipendente (selettori CSS, corrispondenza URL, corrispondenza titolo), garantendo che le aree di codice e le zone di interazione principale non vengano influenzate dalla traduzione.

### Aggiornamento Automatico

Include `electron-updater`, supporta il controllo automatico, il download e l'installazione degli aggiornamenti all'interno dell'applicazione macOS.

## Avvio Rapido

```bash
# Installa le dipendenze
npm install

# Avvia la modalità di sviluppo GUI
npm run dev

# Crea la versione distribuibile per macOS
npm run build -w desktop-app
```

### Flusso di Utilizzo

1. Configura le chiavi del motore AI nel pannello **API Keys**
2. Passa al pannello **Cursor Engine** o **Claude Engine**
3. Clicca su **Deploy** per distribuire la localizzazione con un clic
4. Riavvia l'applicazione target per rendere effettive le modifiche

### Requisiti di Sistema

- macOS 13+ (consigliato)
- Node.js 18+
- Applicazione desktop Cursor o Claude installata

## Sicurezza

- **Archiviazione crittografata delle chiavi API**: salvate crittografate tramite Electron `safeStorage` in `~/.live_translator_hub/api_keys.enc`, non scritte nei file di configurazione
- **Comunicazione diretta**: le richieste di traduzione vanno direttamente alle API dei fornitori AI, senza server intermedi
- **Isolamento per dominio**: le regole di blocco non toccano i file sorgente

---

*Questo progetto è solo per scopi di apprendimento e scambio. La qualità della traduzione è influenzata dal modello AI selezionato.*
