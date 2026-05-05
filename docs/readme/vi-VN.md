# Live Translator Hub

> Công cụ bản địa hóa thời gian thực có GUI cho ứng dụng desktop Cursor và Claude — với khả năng xuyên thấu plugin Webview và dịch thuật bất đồng bộ bằng AI.

[English](../../README.md) | [日本語](ja-JP.md) | [한국어](ko-KR.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Italiano](it-IT.md) | [Português](pt-BR.md) | [Português](pt-PT.md) | [Nederlands](nl-NL.md) | [Polski](pl-PL.md) | [Svenska](sv-SE.md) | [Dansk](da-DK.md) | [Suomi](fi-FI.md) | [Norsk](nb-NO.md) | [Čeština](cs-CZ.md) | [Slovenčina](sk-SK.md) | [Română](ro-RO.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Latviešu](lv-LV.md) | [Eesti](et-EE.md) | [Türkçe](tr-TR.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md)

## Tổng quan dự án

Live Translator Hub là một **ứng dụng desktop GUI Electron + React**, cung cấp khả năng Hán hóa một chạm cho hai công cụ lập trình AI là Cursor và Claude. Thông qua một nhân thời gian chạy dịch thuật thống nhất, quản lý việc triển khai engine, cấu hình khóa API và tạo từ điển cho cả hai ứng dụng mục tiêu trong một giao diện duy nhất.

Dự án này là phiên bản nâng cấp kiến trúc của [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub) — từ một script CLI phát triển thành GUI với bảng trạng thái và nhật ký thời gian thực, đồng thời hợp nhất khả năng Hán hóa của Cursor và Claude thành một nền tảng thống nhất.

![Ảnh chụp màn hình](image.png)
![Ảnh chụp màn hình](image-1.png)

## Kiến trúc

```
live-translator-ecosystem/          # npm workspaces monorepo
├── packages/
│   ├── desktop-app/                # GUI Electron + React (Live Translator Hub)
│   │   ├── electron/main.js        # Tiến trình chính, kênh IPC và lưu trữ cấu hình
│   │   ├── electron/preload.js     # Cầu nối giao tiếp tiến trình render
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # Nhân thời gian chạy dịch thuật (translator-engine.js)
│   ├── patcher-cursor/             # Patcher ứng dụng Cursor
│   ├── patcher-claude/             # Patcher ứng dụng Claude
│   └── dict-generator/             # Trình tạo từ điển AI
```

### Thời gian chạy dịch thuật

`packages/core/src/translator-engine.js` là thời gian chạy duy nhất được tiêm vào ứng dụng mục tiêu — JavaScript thuần trình duyệt, không phụ thuộc module. Trách nhiệm bao gồm:

- **Khớp từ điển**: Mục từ tĩnh + mẫu biểu thức chính quy
- **Cầu nối proxy dịch AI**: Trong môi trường Webview, chuyển tiếp yêu cầu dịch đến cửa sổ chính qua `postMessage`, vượt qua giới hạn mạng của CSP
- **Bộ nhớ đệm dịch**: Bộ nhớ đệm bền vững dựa trên `localStorage`, khóa là `live_i18n_cache_<entity_name>`
- **Tra cứu từ điển lồng nhau**: Hỗ trợ chế độ `enableNestedDict`

## Điểm nổi bật

### Quản lý thống nhất hai engine

Quản lý trạng thái triển khai Hán hóa, phiên bản từ điển và quy tắc chặn cho Cursor và Claude riêng biệt trong cùng một giao diện, không cần chuyển đổi công cụ.

### Xuyên thấu Webview mọi tình huống

Thông qua kiến trúc Translation Bridge, khả năng dịch AI có thể xuyên thấu từ cửa sổ chính đến tất cả các plugin Webview nhiều lớp (ví dụ: Claude Code), giải quyết vấn đề chặn mạng trong môi trường CSP nghiêm ngặt.

### Bố cục chức năng bốn bảng

| Bảng | Chức năng |
| :--- | :--- |
| **Cursor Engine** | Triển khai/Khôi phục Hán hóa Cursor, quản lý quy tắc chặn riêng cho cửa sổ chính và plugin Webview |
| **Claude Engine** | Triển khai/Khôi phục Hán hóa Claude, cấu hình quy tắc bỏ qua |
| **API Keys** | Quản lý khóa API cho nhiều engine dịch AI (hỗ trợ OpenAI, Anthropic, Google Gemini, DeepL), khóa được mã hóa lưu trữ qua Electron `safeStorage` |
| **Dict Generator** | Trích xuất chuỗi UI từ mã nguồn ứng dụng mục tiêu, tạo hàng loạt từ điển dịch qua AI |

### Gỡ lỗi tương tác

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) chuyển đổi viền đánh dấu màu xanh nét đứt
- Trong chế độ đánh dấu, giữ `Option` (Mac) / `Alt` (Win) và di chuột qua chữ Hán để xem văn bản gốc

### Quy tắc chặn theo miền

Mỗi thực thể (cửa sổ chính và các plugin khác nhau) có bộ quy tắc chặn hoàn toàn độc lập (bộ chọn CSS, khớp URL, khớp tiêu đề), đảm bảo vùng mã và vùng tương tác cốt lõi không bị ảnh hưởng bởi bản dịch.

### Cập nhật tự động

Tích hợp `electron-updater`, hỗ trợ tự động kiểm tra, tải xuống và cài đặt bản cập nhật trong ứng dụng trên macOS.

## Bắt đầu nhanh

```bash
# Cài đặt phụ thuộc
npm install

# Khởi động chế độ phát triển GUI
npm run dev

# Xây dựng phiên bản phân phối macOS
npm run build -w desktop-app
```

### Quy trình sử dụng

1. Cấu hình khóa engine AI trong bảng **API Keys**
2. Chuyển đến bảng **Cursor Engine** hoặc **Claude Engine**
3. Nhấp **Deploy** để triển khai Hán hóa một chạm
4. Khởi động lại ứng dụng mục tiêu để có hiệu lực

### Yêu cầu hệ thống

- macOS 13+ (khuyến nghị)
- Node.js 18+
- Ứng dụng desktop Cursor hoặc Claude đã được cài đặt

## Bảo mật

- **Lưu trữ khóa API mã hóa**: Được mã hóa và lưu vào `~/.live_translator_hub/api_keys.enc` qua Electron `safeStorage`, không ghi vào tệp cấu hình
- **Giao tiếp trực tiếp**: Yêu cầu dịch đến thẳng API của nhà cung cấp AI, không có máy chủ trung gian
- **Cách ly theo miền**: Quy tắc chặn không chạm vào tệp mã nguồn

---

*Dự án này chỉ dành cho mục đích trao đổi và học tập. Chất lượng dịch thuật phụ thuộc vào mô hình AI được chọn.*
