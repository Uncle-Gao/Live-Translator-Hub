# Live Translator Hub

> Un moteur de localisation en temps réel avec GUI pour les applications de bureau Cursor et Claude — avec pénétration des plugins Webview et traduction asynchrone par IA.

[English](../../README.md) | [日本語](ja-JP.md) | [한국어](ko-KR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Italiano](it-IT.md) | [Português](pt-BR.md) | [Português](pt-PT.md) | [Nederlands](nl-NL.md) | [Polski](pl-PL.md) | [Svenska](sv-SE.md) | [Dansk](da-DK.md) | [Suomi](fi-FI.md) | [Norsk](nb-NO.md) | [Čeština](cs-CZ.md) | [Slovenčina](sk-SK.md) | [Română](ro-RO.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Latviešu](lv-LV.md) | [Eesti](et-EE.md) | [Türkçe](tr-TR.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md) | [中文](zh-CN.md)

## Aperçu du projet

Live Translator Hub est une **application de bureau GUI Electron + React** qui fournit une sinisation en un clic pour deux outils de programmation IA : Cursor et Claude. Grâce à un noyau d'exécution de traduction unifié, elle gère le déploiement des moteurs, la configuration des clés API et la génération de dictionnaires pour les deux applications cibles depuis une seule interface.

Ce projet est une version améliorée de l'architecture de [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub) — passant d'un script CLI à une GUI avec panneau d'état et journaux en temps réel, fusionnant les capacités de sinisation de Cursor et Claude en une plateforme unique.

![Capture d'écran](../../image.png)
![Capture d'écran](../../image-1.png)

## Architecture

```
live-translator-ecosystem/          # Monorepo npm workspaces
├── packages/
│   ├── desktop-app/                # GUI Electron + React (Live Translator Hub)
│   │   ├── electron/main.js        # Processus principal, canaux IPC et persistance de configuration
│   │   ├── electron/preload.js     # Pont de communication du processus de rendu
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # Noyau d'exécution de traduction (translator-engine.js)
│   ├── patcher-cursor/             # Patcher pour l'application Cursor
│   ├── patcher-claude/             # Patcher pour l'application Claude
│   └── dict-generator/             # Générateur de dictionnaires IA
```

### Moteur d'exécution de traduction

`packages/core/src/translator-engine.js` est le seul runtime injecté dans les applications cibles — pur JavaScript navigateur, sans dépendances de modules. Ses responsabilités incluent :

- **Correspondance de dictionnaire** : entrées statiques + motifs regex
- **Pont proxy de traduction IA** : dans l'environnement Webview, utilise `postMessage` pour transférer les requêtes de traduction à la fenêtre principale, contournant les restrictions CSP réseau
- **Cache de traduction** : cache persistant basé sur `localStorage`, avec la clé `live_i18n_cache_<entity_name>`
- **Recherche de dictionnaire imbriqué** : prend en charge le mode `enableNestedDict`

## Points forts

### Gestion unifiée des deux moteurs

Gérez l'état de déploiement de sinisation, les versions de dictionnaire et les règles de blocage pour Cursor et Claude depuis la même interface, sans changer d'outil.

### Pénétration Webview tous scénarios

Grâce à l'architecture Translation Bridge, la capacité de traduction IA peut pénétrer de la fenêtre principale à tous les niveaux de plugins Webview (comme Claude Code), contournant les problèmes d'interception réseau sous des politiques CSP strictes.

### Disposition fonctionnelle à quatre panneaux

| Panneau | Fonction |
| :--- | :--- |
| **Cursor Engine** | Déployer/restaurer la sinisation de Cursor, gérer les règles de blocage par domaine pour la fenêtre principale et les plugins Webview |
| **Claude Engine** | Déployer/restaurer la sinisation de Claude, configurer les règles de saut |
| **API Keys** | Gérer les clés API de plusieurs moteurs de traduction IA (prend en charge OpenAI, Anthropic, Google Gemini, DeepL), les clés sont stockées cryptées via Electron `safeStorage` |
| **Dict Generator** | Extraire les chaînes UI du code source de l'application cible et générer des dictionnaires de traduction par lots via IA |

### Débogage interactif

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) pour basculer la bordure de surbrillance en pointillés bleus
- En mode surbrillance, maintenez `Option` (Mac) / `Alt` (Win) et survolez le texte chinois pour voir le texte original

### Règles de blocage par domaine

Chaque entité (fenêtre principale et chaque plugin) possède un ensemble de règles de blocage totalement indépendant (sélecteurs CSS, correspondance d'URL, correspondance de titre), garantissant que les zones de code et les zones d'interaction principales ne sont pas affectées par la traduction.

### Mise à jour automatique

Intègre `electron-updater`, prend en charge la vérification, le téléchargement et l'installation automatiques des mises à jour dans l'application macOS.

## Démarrage rapide

```bash
# Installer les dépendances
npm install

# Lancer le mode développement GUI
npm run dev

# Construire la version distribuable macOS
npm run build -w desktop-app
```

### Flux d'utilisation

1. Configurez les clés du moteur IA dans le panneau **API Keys**
2. Passez au panneau **Cursor Engine** ou **Claude Engine**
3. Cliquez sur **Deploy** pour déployer la sinisation en un clic
4. Redémarrez l'application cible pour appliquer les changements

### Configuration système requise

- macOS 13+ (recommandé)
- Node.js 18+
- Application de bureau Cursor ou Claude installée

## Sécurité

- **Stockage crypté des clés API** : sauvegardées cryptées via Electron `safeStorage` dans `~/.live_translator_hub/api_keys.enc`, non écrites dans les fichiers de configuration
- **Communication directe** : les requêtes de traduction vont directement aux API des fournisseurs IA, sans serveur intermédiaire
- **Isolation par domaine** : les règles de blocage ne touchent pas les fichiers source

---

*Ce projet est destiné à des fins d'apprentissage et d'échange uniquement. La qualité de la traduction dépend du modèle IA sélectionné.*
