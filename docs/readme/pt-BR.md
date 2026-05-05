# Live Translator Hub

> Um mecanismo de localização em tempo real com GUI para os aplicativos desktop Cursor e Claude — com penetração de plugins Webview e tradução assíncrona por IA.

[English](../../README.md) | [日本語](ja-JP.md) | [한국어](ko-KR.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Italiano](it-IT.md) | [Português](pt-PT.md) | [Nederlands](nl-NL.md) | [Polski](pl-PL.md) | [Svenska](sv-SE.md) | [Dansk](da-DK.md) | [Suomi](fi-FI.md) | [Norsk](nb-NO.md) | [Čeština](cs-CZ.md) | [Slovenčina](sk-SK.md) | [Română](ro-RO.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Latviešu](lv-LV.md) | [Eesti](et-EE.md) | [Türkçe](tr-TR.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md) | [中文](zh-CN.md)

## Visão Geral do Projeto

O Live Translator Hub é um **aplicativo de desktop GUI Electron + React** que fornece tradução para chinês com um clique para duas ferramentas de programação AI: Cursor e Claude. Através de um kernel de runtime de tradução unificado, gerencia a implantação do mecanismo, configuração de chaves de API e geração de dicionários para ambos os aplicativos alvo em uma única interface.

Este projeto é uma versão atualizada da arquitetura do [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub) — evoluindo de scripts CLI para uma GUI com painel de status e logs em tempo real, unificando as capacidades de tradução do Cursor e do Claude em uma única plataforma.

![Captura de tela](../../image.png)
![Captura de tela](../../image-1.png)

## Arquitetura

```
live-translator-ecosystem/          # npm workspaces monorepo
├── packages/
│   ├── desktop-app/                # Electron + React GUI (Live Translator Hub)
│   │   ├── electron/main.js        # Processo principal, canais IPC e persistência de configuração
│   │   ├── electron/preload.js     # Ponte de comunicação do processo de renderização
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # Kernel de runtime de tradução (translator-engine.js)
│   ├── patcher-cursor/             # Patcher do aplicativo Cursor
│   ├── patcher-claude/             # Patcher do aplicativo Claude
│   └── dict-generator/             # Gerador de dicionários AI
```

### Runtime de Tradução

`packages/core/src/translator-engine.js` é o único runtime injetado nos aplicativos alvo — JavaScript puro do navegador, sem dependências de módulos. Responsabilidades incluem:

- **Correspondência de dicionário**: Entradas estáticas + padrões regex
- **Ponte de proxy de tradução AI**: No ambiente Webview, encaminha solicitações de tradução para a janela principal via `postMessage`, contornando restrições de rede CSP
- **Cache de tradução**: Cache persistente baseado em `localStorage`, com chave `live_i18n_cache_<entity_name>`
- **Pesquisa de dicionário aninhada**: Suporta modo `enableNestedDict`

## Destaques de Funcionalidades

### Gerenciamento Unificado de Dois Mecanismos

Gerencia o status de implantação da tradução, versões de dicionário e regras de bloqueio para Cursor e Claude separadamente na mesma interface, sem necessidade de alternar ferramentas.

### Penetração Webview em Todos os Cenários

Através da arquitetura Translation Bridge, a capacidade de tradução AI pode penetrar da janela principal para todos os níveis de plugins Webview (como Claude Code), resolvendo problemas de bloqueio de rede sob políticas CSP rigorosas.

### Layout de Quatro Painéis Funcionais

| Painel | Função |
| :--- | :--- |
| **Cursor Engine** | Implantar/restaurar tradução do Cursor, gerenciar regras de bloqueio por domínio para janela principal e plugins Webview |
| **Claude Engine** | Implantar/restaurar tradução do Claude, configurar regras de ignorar |
| **API Keys** | Gerenciar chaves de API para múltiplos mecanismos de tradução AI (suporta OpenAI, Anthropic, Google Gemini, DeepL), chaves criptografadas via `safeStorage` do Electron |
| **Dict Generator** | Extrair strings de UI do código-fonte do aplicativo alvo, gerar dicionários de tradução em lote via AI |

### Depuração Interativa

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) alterna borda de destaque azul tracejada
- No modo de destaque, mantenha pressionado `Option` (Mac) / `Alt` (Win) e passe o mouse sobre texto chinês para ver o texto original

### Regras de Bloqueio por Domínio

Cada entidade (janela principal e plugins individuais) possui conjuntos de regras de bloqueio totalmente independentes (seletores CSS, correspondência de URL, correspondência de título), garantindo que áreas de código e regiões de interação principal não sejam afetadas pela tradução.

### Atualização Automática

Inclui `electron-updater`, suporta verificação, download e instalação automática de atualizações no macOS dentro do aplicativo.

## Início Rápido

```bash
# Instalar dependências
npm install

# Iniciar modo de desenvolvimento GUI
npm run dev

# Construir versão distribuível para macOS
npm run build -w desktop-app
```

### Fluxo de Uso

1. Configure as chaves do mecanismo AI no painel **API Keys**
2. Alterne para o painel **Cursor Engine** ou **Claude Engine**
3. Clique em **Deploy** para implantar a tradução com um clique
4. Reinicie o aplicativo alvo para que as alterações entrem em vigor

### Requisitos de Sistema

- macOS 13+ (recomendado)
- Node.js 18+
- Aplicativo de desktop Cursor ou Claude instalado

## Segurança

- **Armazenamento criptografado de chaves de API**: Criptografado via `safeStorage` do Electron e salvo em `~/.live_translator_hub/api_keys.enc`, não gravado em arquivos de configuração
- **Comunicação direta**: Solicitações de tradução vão diretamente para a API do fornecedor AI, sem servidores intermediários
- **Isolamento por domínio**: Regras de bloqueio não tocam nos arquivos de código-fonte

---

*Este projeto é apenas para fins de aprendizado e troca. A qualidade da tradução é afetada pelo modelo AI selecionado.*
