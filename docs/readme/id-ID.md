# Live Translator Hub

> Mesin lokalisasi waktu nyata berbasis GUI untuk aplikasi desktop Cursor dan Claude — dengan penetrasi plugin Webview dan terjemahan asinkron berbasis AI.

[English](../../README.md) | [日本語](ja-JP.md) | [한국어](ko-KR.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Italiano](it-IT.md) | [Português](pt-BR.md) | [Português](pt-PT.md) | [Nederlands](nl-NL.md) | [Polski](pl-PL.md) | [Svenska](sv-SE.md) | [Dansk](da-DK.md) | [Suomi](fi-FI.md) | [Norsk](nb-NO.md) | [Čeština](cs-CZ.md) | [Slovenčina](sk-SK.md) | [Română](ro-RO.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Latviešu](lv-LV.md) | [Eesti](et-EE.md) | [Türkçe](tr-TR.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md)

## Ikhtisar Proyek

Live Translator Hub adalah **aplikasi desktop GUI Electron + React** yang menyediakan satu-klik sinisasi untuk dua alat pemrograman AI, Cursor dan Claude. Melalui inti runtime terjemahan yang terpadu, aplikasi ini mengelola penyebaran mesin, konfigurasi kunci API, dan pembuatan kamus untuk kedua aplikasi target dalam satu antarmuka.

Proyek ini merupakan peningkatan arsitektur dari [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub) — berevolusi dari skrip CLI menjadi GUI dengan panel status dan log waktu nyata, serta menggabungkan kemampuan sinisasi Cursor dan Claude ke dalam satu platform terpadu.

![Tangkapan Layar](image.png)
![Tangkapan Layar](image-1.png)

## Arsitektur

```
live-translator-ecosystem/          # Monorepo ruang kerja npm
├── packages/
│   ├── desktop-app/                # GUI Electron + React (Live Translator Hub)
│   │   ├── electron/main.js        # Proses utama, saluran IPC, dan persistensi konfigurasi
│   │   ├── electron/preload.js     # Jembatan komunikasi proses rendering
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # Inti runtime terjemahan (translator-engine.js)
│   ├── patcher-cursor/             # Patcher aplikasi Cursor
│   ├── patcher-claude/             # Patcher aplikasi Claude
│   └── dict-generator/             # Generator kamus AI
```

### Runtime Terjemahan

`packages/core/src/translator-engine.js` adalah satu-satunya runtime yang disuntikkan ke dalam aplikasi target — JavaScript browser murni, tanpa dependensi modul. Tanggung jawabnya meliputi:

- **Pencocokan Kamus**: Entri statis + pola regex
- **Jembatan Proksi Terjemahan AI**: Di lingkungan Webview, meneruskan permintaan terjemahan ke jendela utama melalui `postMessage`, melewati batasan jaringan CSP
- **Cache Terjemahan**: Cache persisten berbasis `localStorage` dengan nama kunci `live_i18n_cache_<nama_entitas>`
- **Pencarian Kamus Bersarang**: Mendukung mode `enableNestedDict`

## Fitur Unggulan

### Manajemen Terpadu Dua Mesin

Kelola status penyebaran sinisasi, versi kamus, dan aturan pemblokiran untuk Cursor dan Claude secara terpisah dalam satu antarmuka, tanpa perlu beralih alat.

### Penetrasi Webview di Semua Skenario

Melalui arsitektur Jembatan Terjemahan, kemampuan terjemahan AI dapat menembus dari jendela utama ke semua lapisan plugin Webview (misalnya Claude Code), mengatasi masalah pemblokiran jaringan di bawah kebijakan CSP yang ketat.

### Tata Letak Fungsional Empat Panel

| Panel | Fungsi |
| :--- | :--- |
| **Cursor Engine** | Menyebarkan/memulihkan sinisasi Cursor, mengelola aturan pemblokiran terpisah untuk jendela utama dan plugin Webview |
| **Claude Engine** | Menyebarkan/memulihkan sinisasi Claude, mengonfigurasi aturan lewati |
| **API Keys** | Mengelola kunci API untuk beberapa mesin terjemahan AI (mendukung OpenAI, Anthropic, Google Gemini, DeepL), kunci disimpan terenkripsi melalui Electron `safeStorage` |
| **Dict Generator** | Mengekstrak string UI dari kode sumber aplikasi target, menghasilkan kamus terjemahan secara massal melalui AI |

### Debugging Interaktif

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) untuk mengalihkan batas sorot garis putus-putus biru
- Dalam mode sorot, tahan `Option` (Mac) / `Alt` (Win) dan arahkan kursor ke teks bahasa Mandarin untuk melihat teks asli

### Aturan Pemblokiran Terpisah

Setiap entitas (jendela utama dan setiap plugin) memiliki kumpulan aturan pemblokiran yang sepenuhnya independen (pemilih CSS, pencocokan URL, pencocokan judul), memastikan area kode dan area interaksi inti tidak terpengaruh oleh terjemahan.

### Pembaruan Otomatis

Menyertakan `electron-updater`, mendukung pemeriksaan, pengunduhan, dan pemasangan pembaruan otomatis dalam aplikasi di macOS.

## Memulai Cepat

```bash
# Instal dependensi
npm install

# Mulai mode pengembangan GUI
npm run dev

# Bangun versi distribusi macOS
npm run build -w desktop-app
```

### Alur Penggunaan

1. Konfigurasikan kunci mesin AI di panel **API Keys**
2. Beralih ke panel **Cursor Engine** atau **Claude Engine**
3. Klik **Deploy** untuk menyebarkan sinisasi satu-klik
4. Mulai ulang aplikasi target agar perubahan berlaku

### Persyaratan Sistem

- macOS 13+ (disarankan)
- Node.js 18+
- Aplikasi desktop Cursor atau Claude sudah terinstal

## Keamanan

- **Penyimpanan Kunci API Terenkripsi**: Disimpan terenkripsi melalui Electron `safeStorage` ke `~/.live_translator_hub/api_keys.enc`, tidak ditulis ke file konfigurasi
- **Komunikasi Langsung**: Permintaan terjemahan langsung ke API vendor AI, tanpa server perantara
- **Isolasi Domain**: Aturan pemblokiran tidak menyentuh file kode sumber

---

*Proyek ini hanya untuk tujuan pertukaran pembelajaran. Kualitas terjemahan dipengaruhi oleh model AI yang dipilih.*
