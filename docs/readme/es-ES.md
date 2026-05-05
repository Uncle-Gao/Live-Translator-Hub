# Live Translator Hub

> Un motor de localización en tiempo real con GUI para las aplicaciones de escritorio Cursor y Claude — con penetración de plugins Webview y traducción asíncrona por IA.

[English](../../README.md) | [日本語](ja-JP.md) | [한국어](ko-KR.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Italiano](it-IT.md) | [Português](pt-BR.md) | [Português](pt-PT.md) | [Nederlands](nl-NL.md) | [Polski](pl-PL.md) | [Svenska](sv-SE.md) | [Dansk](da-DK.md) | [Suomi](fi-FI.md) | [Norsk](nb-NO.md) | [Čeština](cs-CZ.md) | [Slovenčina](sk-SK.md) | [Română](ro-RO.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Latviešu](lv-LV.md) | [Eesti](et-EE.md) | [Türkçe](tr-TR.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md)

## Resumen del Proyecto

Live Translator Hub es una **aplicación de escritorio con GUI Electron + React** que proporciona un clic para la sinización de dos herramientas de programación de IA: Cursor y Claude. A través de un núcleo de tiempo de ejecución de traducción unificado, gestiona la implementación del motor, la configuración de claves API y la generación de diccionarios para ambas aplicaciones objetivo en una sola interfaz.

Este proyecto es una actualización arquitectónica de [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub): evolucionando de un script CLI a una GUI con panel de estado y registro en tiempo real, fusionando las capacidades de sinización de Cursor y Claude en una misma plataforma unificada.

![Captura de pantalla](image.png)
![Captura de pantalla](image-1.png)

## Arquitectura

```
live-translator-ecosystem/          # Monorepo de workspaces npm
├── packages/
│   ├── desktop-app/                # GUI Electron + React (Live Translator Hub)
│   │   ├── electron/main.js        # Proceso principal, canales IPC y persistencia de configuración
│   │   ├── electron/preload.js     # Puente de comunicación del proceso de renderizado
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # Núcleo de tiempo de ejecución de traducción (translator-engine.js)
│   ├── patcher-cursor/             # Parcheador de la aplicación Cursor
│   ├── patcher-claude/             # Parcheador de la aplicación Claude
│   └── dict-generator/             # Generador de diccionarios con IA
```

### Tiempo de Ejecución de Traducción

`packages/core/src/translator-engine.js` es el único tiempo de ejecución inyectado en las aplicaciones objetivo: JavaScript puro del navegador, sin dependencias de módulos. Sus responsabilidades incluyen:

- **Coincidencia de diccionario**: Entradas estáticas + patrones regex
- **Puente proxy de traducción con IA**: En entornos Webview, utiliza `postMessage` para reenviar solicitudes de traducción a la ventana principal, evitando las restricciones de red de CSP
- **Caché de traducción**: Caché persistente basada en `localStorage`, con clave `live_i18n_cache_<entity_name>`
- **Búsqueda en diccionario anidado**: Soporta el modo `enableNestedDict`

## Características Destacadas

### Gestión Unificada de Dos Motores

Gestiona el estado de implementación de sinización, versiones de diccionario y reglas de bloqueo para Cursor y Claude por separado en la misma interfaz, sin necesidad de cambiar de herramienta.

### Penetración de Webview en Todos los Escenarios

A través de la arquitectura Translation Bridge, la capacidad de traducción con IA puede penetrar desde la ventana principal hasta todos los niveles de plugins Webview (como Claude Code), resolviendo el problema de bloqueo de red bajo políticas CSP estrictas.

### Diseño de Cuatro Paneles

| Panel | Función |
| :--- | :--- |
| **Cursor Engine** | Implementar/restaurar la sinización de Cursor, gestionar reglas de bloqueo por dominio para la ventana principal y plugins Webview |
| **Claude Engine** | Implementar/restaurar la sinización de Claude, configurar reglas de omisión |
| **API Keys** | Gestionar claves API de múltiples motores de traducción con IA (compatible con OpenAI, Anthropic, Google Gemini, DeepL), almacenadas cifradas mediante `safeStorage` de Electron |
| **Dict Generator** | Extraer cadenas de UI del código fuente de la aplicación objetivo y generar diccionarios de traducción por lotes con IA |

### Depuración Interactiva

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) para alternar el borde resaltado azul punteado
- En modo resaltado, mantén presionado `Option` (Mac) / `Alt` (Win) y pasa el cursor sobre texto chino para ver el texto original

### Reglas de Bloqueo por Dominio

Cada entidad (ventana principal y cada plugin) tiene su propio conjunto completamente independiente de reglas de bloqueo (selectores CSS, coincidencia de URL, coincidencia de título), asegurando que las áreas de código y las zonas de interacción central no se vean afectadas por la traducción.

### Actualización Automática

Incluye `electron-updater`, compatible con la verificación, descarga e instalación automática de actualizaciones dentro de la aplicación en macOS.

## Inicio Rápido

```bash
# Instalar dependencias
npm install

# Iniciar modo de desarrollo GUI
npm run dev

# Construir versión distribuible para macOS
npm run build -w desktop-app
```

### Flujo de Uso

1. Configura las claves del motor de IA en el panel **API Keys**
2. Cambia al panel **Cursor Engine** o **Claude Engine**
3. Haz clic en **Deploy** para implementar la sinización con un solo clic
4. Reinicia la aplicación objetivo para que los cambios surtan efecto

### Requisitos del Sistema

- macOS 13+ (recomendado)
- Node.js 18+
- Aplicación de escritorio Cursor o Claude instalada

## Seguridad

- **Almacenamiento cifrado de claves API**: Se guardan cifradas mediante `safeStorage` de Electron en `~/.live_translator_hub/api_keys.enc`, sin escribir en archivos de configuración
- **Comunicación directa**: Las solicitudes de traducción llegan directamente a la API del proveedor de IA, sin servidores intermediarios
- **Aislamiento por dominio**: Las reglas de bloqueo no modifican los archivos de código fuente

---

*Este proyecto es solo para fines de aprendizaje e intercambio. La calidad de la traducción depende del modelo de IA seleccionado.*
