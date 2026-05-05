# Live Translator Hub

> Cursor と Claude デスクトップアプリ向け GUI リアルタイムローカライゼーションエンジン — Webview プラグインの透過と AI 非同期翻訳対応。

[English](../../README.md) | [한국어](ko-KR.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Italiano](it-IT.md) | [Português](pt-BR.md) | [Português](pt-PT.md) | [Nederlands](nl-NL.md) | [Polski](pl-PL.md) | [Svenska](sv-SE.md) | [Dansk](da-DK.md) | [Suomi](fi-FI.md) | [Norsk](nb-NO.md) | [Čeština](cs-CZ.md) | [Slovenčina](sk-SK.md) | [Română](ro-RO.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Latviešu](lv-LV.md) | [Eesti](et-EE.md) | [Türkçe](tr-TR.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md)

## プロジェクト概要

Live Translator Hub は **Electron + React GUI デスクトップアプリケーション**であり、Cursor と Claude の2つのAIプログラミングツールに対してワンクリックでの日本語化を提供します。統一された翻訳ランタイムカーネルを通じて、1つのインターフェースで2つのターゲットアプリケーションのエンジン展開、APIキー設定、辞書生成を管理します。

本プロジェクトは [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub) のアーキテクチャアップグレード版です——CLIスクリプトからステータスパネルとリアルタイムログを備えたGUIへと進化し、Cursor と Claude の日本語化機能を1つの統一プラットフォームに統合しました。


## アーキテクチャ

```
live-translator-ecosystem/          # npm workspaces monorepo
├── packages/
│   ├── desktop-app/                # Electron + React GUI (Live Translator Hub)
│   │   ├── electron/main.js        # メインプロセス、IPCチャネルと設定の永続化
│   │   ├── electron/preload.js     # レンダラープロセス通信ブリッジ
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # 翻訳ランタイムカーネル (translator-engine.js)
│   ├── patcher-cursor/             # Cursor アプリケーション Patcher
│   ├── patcher-claude/             # Claude アプリケーション Patcher
│   └── dict-generator/             # AI辞書ジェネレーター
```

### 翻訳ランタイム

`packages/core/src/translator-engine.js` はターゲットアプリケーションに注入される唯一のランタイムです——純粋なブラウザJSであり、モジュール依存関係はありません。責務は以下の通りです：

- **辞書マッチング**：静的エントリ + 正規表現パターン
- **AI翻訳プロキシブリッジ**：Webview環境において `postMessage` を介して翻訳リクエストをメインウィンドウに転送し、CSPによるネットワーク制限を回避
- **翻訳キャッシュ**：`localStorage` に基づく永続化キャッシュ。キー名は `live_i18n_cache_<entity_name>`
- **ネスト辞書検索**：`enableNestedDict` モードをサポート

## 機能ハイライト

### デュアルエンジン統合管理

同一インターフェース内でCursorとClaudeの日本語化デプロイ状態、辞書バージョン、ブロックルールをそれぞれ管理でき、ツールを切り替える必要はありません。

### 全シナリオWebview透過

Translation Bridgeアーキテクチャにより、AI翻訳機能はメインウィンドウからすべての階層のWebviewプラグイン（Claude Codeなど）に透過的に到達でき、厳格なCSPポリシー下でのネットワーク遮断問題を解決します。

### 4パネル機能レイアウト

| パネル | 機能 |
| :--- | :--- |
| **Cursor Engine** | Cursorの日本語化をデプロイ/復元、メインウィンドウとWebviewプラグインのドメイン別ブロックルールを管理 |
| **Claude Engine** | Claudeの日本語化をデプロイ/復元、スキップルールを設定 |
| **API Keys** | 複数のAI翻訳エンジンのAPIキーを管理（OpenAI、Anthropic、Google Gemini、DeepLに対応）。キーはElectron `safeStorage` で暗号化保存 |
| **Dict Generator** | ターゲットアプリケーションのソースコードからUI文字列を抽出し、AIで一括翻訳辞書を生成 |

### インタラクティブデバッグ

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) で青色点線ハイライト枠を切り替え
- ハイライトモード中に `Option` (Mac) / `Alt` (Win) を押しながら中国語にホバーすると原文を表示

### ドメイン別ブロックルール

各エンティティ（メインウィンドウと各プラグイン）は完全に独立したブロックルールセット（CSSセレクター、URLマッチング、タイトルマッチング）を持ち、コード領域やコアインタラクション領域が翻訳の影響を受けないようにします。

### 自動更新

`electron-updater` を内蔵し、macOSアプリ内での自動チェック、ダウンロード、更新インストールをサポートします。

## クイックスタート

```bash
# 依存関係のインストール
npm install

# GUI開発モードの起動
npm run dev

# macOS配布可能バージョンのビルド
npm run build -w desktop-app
```

### 使用手順

1. **API Keys** パネルでAIエンジンのキーを設定
2. **Cursor Engine** または **Claude Engine** パネルに切り替え
3. **Deploy** をクリックしてワンクリックで日本語化をデプロイ
4. ターゲットアプリケーションを再起動して反映

### システム要件

- macOS 13+（推奨）
- Node.js 18+
- Cursor または Claude デスクトップアプリケーションがインストールされていること

## セキュリティ

- **APIキーの暗号化保存**：Electron `safeStorage` を介して `~/.live_translator_hub/api_keys.enc` に暗号化保存され、設定ファイルには書き込まれません
- **直接通信**：翻訳リクエストはAIベンダーのAPIに直接到達し、中継サーバーは介在しません
- **ドメイン分離**：ブロックルールはソースコードファイルに影響を与えません

---

*本プロジェクトは交流学習目的でのみ提供されています。翻訳品質は選択されたAIモデルに依存します。*
