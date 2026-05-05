# Live Translator Hub

> Enjin penyetempatan masa nyata berasaskan GUI untuk aplikasi desktop Cursor dan Claude — dengan penembusan pemalam Webview dan terjemahan tak segerak berasaskan AI.

[English](../../README.md) | [日本語](ja-JP.md) | [한국어](ko-KR.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Italiano](it-IT.md) | [Português](pt-BR.md) | [Português](pt-PT.md) | [Nederlands](nl-NL.md) | [Polski](pl-PL.md) | [Svenska](sv-SE.md) | [Dansk](da-DK.md) | [Suomi](fi-FI.md) | [Norsk](nb-NO.md) | [Čeština](cs-CZ.md) | [Slovenčina](sk-SK.md) | [Română](ro-RO.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Latviešu](lv-LV.md) | [Eesti](et-EE.md) | [Türkçe](tr-TR.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [हिन्दी](hi-IN.md)

## Gambaran Projek

Live Translator Hub ialah aplikasi **desktop GUI Electron + React** yang menyediakan terjemahan satu klik untuk dua alat pengaturcaraan AI, Cursor dan Claude. Melalui teras masa jalan terjemahan bersatu, ia menguruskan penggunaan enjin, konfigurasi kunci API, dan penjanaan kamus untuk kedua-dua aplikasi sasaran dalam satu antara muka.

Projek ini merupakan peningkatan seni bina [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub) — berkembang daripada skrip CLI kepada GUI dengan panel status dan log masa nyata, serta menggabungkan keupayaan terjemahan Cursor dan Claude ke dalam satu platform bersatu.

![Tangkapan skrin](../../image.png)
![Tangkapan skrin](../../image-1.png)

## Seni Bina

```
live-translator-ecosystem/          # npm workspaces monorepo
├── packages/
│   ├── desktop-app/                # GUI Electron + React (Live Translator Hub)
│   │   ├── electron/main.js        # Proses utama, saluran IPC & kegigihan konfigurasi
│   │   ├── electron/preload.js     # Jambatan komunikasi proses rendering
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # Teras masa jalan terjemahan (translator-engine.js)
│   ├── patcher-cursor/             # Patcher aplikasi Cursor
│   ├── patcher-claude/             # Patcher aplikasi Claude
│   └── dict-generator/             # Penjana kamus AI
```

### Masa Jalan Terjemahan

`packages/core/src/translator-engine.js` ialah satu-satunya masa jalan yang disuntik ke dalam aplikasi sasaran — JS pelayar tulen, tanpa kebergantungan modul. Tanggungjawabnya termasuk:

- **Padanan kamus**: Entri statik + corak regex
- **Jambatan proksi terjemahan AI**: Dalam persekitaran Webview, hantar permintaan terjemahan ke tetingkap utama melalui `postMessage`, memintas sekatan rangkaian CSP
- **Cache terjemahan**: Cache kekal berdasarkan `localStorage`, dengan nama kunci `live_i18n_cache_<entity_name>`
- **Carian kamus bersarang**: Menyokong mod `enableNestedDict`

## Sorotan Ciri

### Pengurusan Bersatu Dua Enjin

Urus status penggunaan, versi kamus, dan peraturan sekatan untuk terjemahan Cursor dan Claude dalam antara muka yang sama, tanpa perlu menukar alat.

### Penembusan Webview Semua Senario

Melalui seni bina Jambatan Terjemahan, keupayaan terjemahan AI boleh menembusi dari tetingkap utama ke semua peringkat pemalam Webview (seperti Claude Code), menyelesaikan masalah sekatan rangkaian di bawah dasar CSP yang ketat.

### Susun Atur Empat Panel Berfungsi

| Panel | Fungsi |
| :--- | :--- |
| **Cursor Engine** | Gunakan/pulihkan terjemahan Cursor, urus peraturan sekatan domain berasingan untuk tetingkap utama & pemalam Webview |
| **Claude Engine** | Gunakan/pulihkan terjemahan Claude, konfigurasikan peraturan langkau |
| **API Keys** | Urus kunci API untuk pelbagai enjin terjemahan AI (sokongan OpenAI, Anthropic, Google Gemini, DeepL), kunci disulitkan melalui `safeStorage` Electron |
| **Dict Generator** | Ekstrak rentetan UI daripada kod sumber aplikasi sasaran, hasilkan kamus terjemahan secara pukal melalui AI |

### Penyahpepijatan Interaktif

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) untuk togol sempadan sorotan biru bertitik
- Dalam mod sorotan, tahan `Option` (Mac) / `Alt` (Win) dan tuding pada teks Cina untuk melihat teks asal

### Peraturan Sekatan Domain Berasingan

Setiap entiti (tetingkap utama & setiap pemalam) mempunyai set peraturan sekatan bebas sepenuhnya (pemilih CSS, padanan URL, padanan tajuk), memastikan kawasan kod & kawasan interaksi teras tidak terjejas oleh terjemahan.

### Kemas Kini Automatik

Mengandungi `electron-updater` terbina dalam, menyokong semakan, muat turun & pemasangan kemas kini automatik dalam aplikasi macOS.

## Mulakan Pantas

```bash
# Pasang kebergantungan
npm install

# Mulakan mod pembangunan GUI
npm run dev

# Bina versi boleh edar macOS
npm run build -w desktop-app
```

### Aliran Penggunaan

1. Konfigurasikan kunci enjin AI dalam panel **API Keys**
2. Tukar ke panel **Cursor Engine** atau **Claude Engine**
3. Klik **Deploy** untuk menggunakan terjemahan satu klik
4. Mulakan semula aplikasi sasaran untuk kesan berkuat kuasa

### Keperluan Sistem

- macOS 13+ (disyorkan)
- Node.js 18+
- Aplikasi desktop Cursor atau Claude telah dipasang

## Keselamatan

- **Penyimpanan kunci API disulitkan**: Disulitkan melalui `safeStorage` Electron dan disimpan ke `~/.live_translator_hub/api_keys.enc`, tidak ditulis ke fail konfigurasi
- **Komunikasi terus**: Permintaan terjemahan terus ke API vendor AI, tanpa pelayan perantara
- **Pengasingan domain**: Peraturan sekatan tidak menyentuh fail sumber

---

*Projek ini hanya untuk tujuan pembelajaran dan perkongsian. Kualiti terjemahan dipengaruhi oleh model AI yang dipilih.*
