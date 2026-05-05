# Live Translator Hub

> Cursor 및 Claude 데스크톱 앱을 위한 GUI 실시간 로컬라이제이션 엔진 — Webview 플러그인 침투 및 AI 비동기 번역 지원.

[English](../../README.md) | [日本語](ja-JP.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Italiano](it-IT.md) | [Português](pt-BR.md) | [Português](pt-PT.md) | [Nederlands](nl-NL.md) | [Polski](pl-PL.md) | [Svenska](sv-SE.md) | [Dansk](da-DK.md) | [Suomi](fi-FI.md) | [Norsk](nb-NO.md) | [Čeština](cs-CZ.md) | [Slovenčina](sk-SK.md) | [Română](ro-RO.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Latviešu](lv-LV.md) | [Eesti](et-EE.md) | [Türkçe](tr-TR.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md)

## 프로젝트 개요

Live Translator Hub는 **Electron + React GUI 데스크톱 애플리케이션**으로, Cursor와 Claude 두 AI 프로그래밍 도구에 원클릭 한글화를 제공합니다. 통합된 번역 런타임 커널을 통해 하나의 인터페이스에서 두 대상 애플리케이션의 엔진 배포, API 키 구성 및 사전 생성을 관리합니다.

이 프로젝트는 [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub)의 아키텍처 업그레이드 버전입니다. CLI 스크립트에서 상태 패널과 실시간 로그를 갖춘 GUI로 진화했으며, Cursor와 Claude의 한글화 기능을 하나의 통합 플랫폼으로 병합했습니다.

![스크린샷](image.png)
![스크린샷](image-1.png)

## 아키텍처

```
live-translator-ecosystem/          # npm workspaces monorepo
├── packages/
│   ├── desktop-app/                # Electron + React GUI (Live Translator Hub)
│   │   ├── electron/main.js        # 메인 프로세스, IPC 채널 및 설정 영속화
│   │   ├── electron/preload.js     # 렌더러 프로세스 통신 브리지
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # 번역 런타임 커널 (translator-engine.js)
│   ├── patcher-cursor/             # Cursor 애플리케이션 Patcher
│   ├── patcher-claude/             # Claude 애플리케이션 Patcher
│   └── dict-generator/             # AI 사전 생성기
```

### 번역 런타임

`packages/core/src/translator-engine.js`는 대상 애플리케이션에 주입되는 유일한 런타임입니다. 순수 브라우저 JS이며 모듈 종속성이 없습니다. 책임은 다음과 같습니다:

- **사전 매칭**: 정적 단어 + 정규식 패턴
- **AI 번역 프록시 브리지**: Webview 환경에서 `postMessage`를 통해 번역 요청을 메인 창으로 전달하여 CSP 네트워크 제한 우회
- **번역 캐시**: `localStorage` 기반 영속화 캐시, 키 이름은 `live_i18n_cache_<entity_name>`
- **중첩 사전 조회**: `enableNestedDict` 모드 지원

## 기능 하이라이트

### 이중 엔진 통합 관리

동일한 인터페이스에서 Cursor와 Claude의 한글화 배포 상태, 사전 버전 및 차단 규칙을 각각 관리할 수 있어 도구 전환이 필요 없습니다.

### 전 시나리오 Webview 침투

Translation Bridge 아키텍처를 통해 AI 번역 기능이 메인 창에서 모든 계층의 Webview 플러그인(예: Claude Code)까지 침투할 수 있어, 엄격한 CSP 정책 하에서의 네트워크 차단 문제를 해결합니다.

### 4패널 기능 레이아웃

| 패널 | 기능 |
| :--- | :--- |
| **Cursor Engine** | Cursor 한글화 배포/복구, 메인 창 및 Webview 플러그인의 도메인별 차단 규칙 관리 |
| **Claude Engine** | Claude 한글화 배포/복구, 건너뛰기 규칙 구성 |
| **API Keys** | 여러 AI 번역 엔진의 API 키 관리 (OpenAI, Anthropic, Google Gemini, DeepL 지원), 키는 Electron `safeStorage`로 암호화 저장 |
| **Dict Generator** | 대상 애플리케이션 소스에서 UI 문자열 추출, AI를 통해 일괄 번역 사전 생성 |

### 대화형 디버깅

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) 파란색 점선 강조 테두리 전환
- 강조 모드에서 `Option` (Mac) / `Alt` (Win)을 누른 상태로 중국어 위에 마우스를 올리면 원문 확인 가능

### 도메인별 차단 규칙

각 엔터티(메인 창 및 각 플러그인)는 완전히 독립적인 차단 규칙 집합(CSS 선택자, URL 매칭, 제목 매칭)을 가지므로 코드 영역과 핵심 상호작용 영역이 번역의 영향을 받지 않습니다.

### 자동 업데이트

내장된 `electron-updater`를 통해 macOS 애플리케이션 내에서 자동으로 업데이트를 확인, 다운로드 및 설치할 수 있습니다.

## 빠른 시작

```bash
# 종속성 설치
npm install

# GUI 개발 모드 시작
npm run dev

# macOS 배포 가능 버전 빌드
npm run build -w desktop-app
```

### 사용 흐름

1. **API Keys** 패널에서 AI 엔진 키 구성
2. **Cursor Engine** 또는 **Claude Engine** 패널로 전환
3. **Deploy** 클릭하여 원클릭 한글화 배포
4. 대상 애플리케이션 재시작하여 적용

### 시스템 요구 사항

- macOS 13+ (권장)
- Node.js 18+
- Cursor 또는 Claude 데스크톱 애플리케이션 설치됨

## 보안

- **API 키 암호화 저장**: Electron `safeStorage`를 통해 `~/.live_translator_hub/api_keys.enc`에 암호화 저장, 설정 파일에 기록되지 않음
- **직접 통신**: 번역 요청이 AI 공급업체 API에 직접 도달, 중계 서버 없음
- **도메인 격리**: 차단 규칙이 소스 파일을 건드리지 않음

---

*본 프로젝트는 학습 및 교류 목적으로만 사용됩니다. 번역 품질은 선택한 AI 모델에 따라 달라집니다.*
