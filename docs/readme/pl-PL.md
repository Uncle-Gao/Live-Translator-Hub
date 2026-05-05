# Live Translator Hub

> Silnik lokalizacji w czasie rzeczywistym z GUI dla aplikacji desktopowych Cursor i Claude — z penetracją wtyczek Webview i asynchronicznym tłumaczeniem AI.

[English](../../README.md) | [日本語](ja-JP.md) | [한국어](ko-KR.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Italiano](it-IT.md) | [Português](pt-BR.md) | [Português](pt-PT.md) | [Nederlands](nl-NL.md) | [Svenska](sv-SE.md) | [Dansk](da-DK.md) | [Suomi](fi-FI.md) | [Norsk](nb-NO.md) | [Čeština](cs-CZ.md) | [Slovenčina](sk-SK.md) | [Română](ro-RO.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Latviešu](lv-LV.md) | [Eesti](et-EE.md) | [Türkçe](tr-TR.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md)

## Przegląd projektu

**Live Translator Hub** to aplikacja desktopowa **Electron + React GUI**, która zapewnia jednym kliknięciem sinizację dwóch narzędzi AI do programowania: Cursor i Claude. Dzięki ujednoliconemu rdzeniowi środowiska uruchomieniowego tłumaczenia, w jednym interfejsie zarządza się wdrażaniem silników, konfiguracją kluczy API i generowaniem słowników dla obu docelowych aplikacji.

Ten projekt jest ulepszoną architektonicznie wersją [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub) – ewolucją ze skryptu CLI w GUI z panelem stanu i logami na żywo, łączącą możliwości sinizacji Cursor i Claude w jedną ujednoliconą platformę.


![Zrzut ekranu](image.png)
![Zrzut ekranu](image-1.png)
## Architektura

```
live-translator-ecosystem/          # npm workspaces monorepo
├── packages/
│   ├── desktop-app/                # Electron + React GUI (Live Translator Hub)
│   │   ├── electron/main.js        # Proces główny, kanały IPC i trwała konfiguracja
│   │   ├── electron/preload.js     # Mostek komunikacyjny procesu renderowania
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # Rdzeń środowiska uruchomieniowego tłumaczenia (translator-engine.js)
│   ├── patcher-cursor/             # Patcher aplikacji Cursor
│   ├── patcher-claude/             # Patcher aplikacji Claude
│   └── dict-generator/             # Generator słowników AI
```

### Środowisko uruchomieniowe tłumaczenia

`packages/core/src/translator-engine.js` to jedyne środowisko uruchomieniowe wstrzykiwane do docelowych aplikacji – czysty JavaScript przeglądarkowy, bez zależności modułowych. Do jego obowiązków należą:

- **Dopasowywanie słownikowe**: statyczne wpisy + wzorce regularne
- **Mostek proxy tłumaczenia AI**: w środowisku Webview, za pomocą `postMessage` przekazuje żądania tłumaczenia do okna głównego, omijając ograniczenia sieciowe CSP
- **Pamięć podręczna tłumaczeń**: trwała pamięć podręczna oparta na `localStorage`, z kluczami `live_i18n_cache_<nazwa_encji>`
- **Wyszukiwanie w zagnieżdżonych słownikach**: obsługa trybu `enableNestedDict`

## Najważniejsze funkcje

### Ujednolicone zarządzanie dwoma silnikami

W jednym interfejsie zarządzaj stanem wdrożenia sinizacji, wersją słownika i regułami blokowania dla Cursor i Claude, bez konieczności przełączania narzędzi.

### Penetracja Webview we wszystkich scenariuszach

Dzięki architekturze Translation Bridge, możliwości tłumaczenia AI mogą przenikać z okna głównego do wszystkich warstw wtyczek Webview (np. Claude Code), rozwiązując problem blokowania dostępu do sieci w przypadku restrykcyjnych polityk CSP.

### Układ funkcjonalny czterech paneli

| Panel | Funkcja |
| :--- | :--- |
| **Cursor Engine** | Wdrażanie/przywracanie sinizacji Cursor, zarządzanie regułami blokowania dla okna głównego i wtyczek Webview |
| **Claude Engine** | Wdrażanie/przywracanie sinizacji Claude, konfiguracja reguł pomijania |
| **API Keys** | Zarządzanie kluczami API dla wielu silników tłumaczenia AI (obsługa OpenAI, Anthropic, Google Gemini, DeepL), klucze szyfrowane za pomocą `safeStorage` Electron |
| **Dict Generator** | Ekstrakcja ciągów UI z kodu źródłowego docelowej aplikacji, masowe generowanie słowników tłumaczeniowych przez AI |

### Debugowanie interaktywne

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) – przełączanie niebieskiej przerywanej ramki podświetlenia
- W trybie podświetlenia, przytrzymaj `Option` (Mac) / `Alt` (Win) i najedź na chiński tekst, aby zobaczyć oryginał

### Reguły blokowania dla domen

Każda encja (okno główne i poszczególne wtyczki) ma całkowicie niezależny zestaw reguł blokowania (selektory CSS, dopasowanie URL, dopasowanie tytułu), co gwarantuje, że obszar kodu i kluczowe interakcje nie zostaną naruszone przez tłumaczenie.

### Automatyczne aktualizacje

Wbudowany `electron-updater` obsługuje automatyczne sprawdzanie, pobieranie i instalowanie aktualizacji w aplikacji na macOS.

## Szybki start

```bash
# Instalacja zależności
npm install

# Uruchomienie trybu deweloperskiego GUI
npm run dev

# Budowanie wersji dystrybucyjnej dla macOS
npm run build -w desktop-app
```

### Proces użytkowania

1. W panelu **API Keys** skonfiguruj klucze silników AI
2. Przełącz na panel **Cursor Engine** lub **Claude Engine**
3. Kliknij **Deploy**, aby jednym kliknięciem wdrożyć sinizację
4. Uruchom ponownie docelową aplikację, aby zmiany zaczęły obowiązywać

### Wymagania systemowe

- macOS 13+ (zalecane)
- Node.js 18+
- Zainstalowana aplikacja desktopowa Cursor lub Claude

## Bezpieczeństwo

- **Szyfrowane przechowywanie kluczy API**: klucze są szyfrowane za pomocą `safeStorage` Electron i zapisywane w `~/.live_translator_hub/api_keys.enc`, nie są zapisywane w plikach konfiguracyjnych
- **Komunikacja bezpośrednia**: żądania tłumaczenia trafiają bezpośrednio do API dostawcy AI, bez serwera pośredniczącego
- **Izolacja domen**: reguły blokowania nie ingerują w pliki źródłowe

---

*Ten projekt służy wyłącznie do celów edukacyjnych i wymiany wiedzy. Jakość tłumaczenia zależy od wybranego modelu AI.*
