# Live Translator Hub

> Um motor de localização em tempo real com GUI para as aplicações de desktop Cursor e Claude — com penetração de plugins Webview e tradução assíncrona por IA.

[English](../../README.md) | [日本語](ja-JP.md) | [한국어](ko-KR.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Italiano](it-IT.md) | [Português](pt-BR.md) | [Nederlands](nl-NL.md) | [Polski](pl-PL.md) | [Svenska](sv-SE.md) | [Dansk](da-DK.md) | [Suomi](fi-FI.md) | [Norsk](nb-NO.md) | [Čeština](cs-CZ.md) | [Slovenčina](sk-SK.md) | [Română](ro-RO.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Latviešu](lv-LV.md) | [Eesti](et-EE.md) | [Türkçe](tr-TR.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md)

## Visão Geral do Projeto

O Live Translator Hub é uma **aplicação desktop GUI Electron + React** que fornece tradução para chinês com um clique para duas ferramentas de programação AI: Cursor e Claude. Através de um kernel de runtime de tradução unificado, gerencia a implantação do motor, configuração de chaves de API e geração de dicionários para ambas as aplicações alvo numa única interface.

Este projeto é uma versão arquiteturalmente atualizada do [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub) — evoluindo de um script CLI para uma GUI com painel de estado e logs em tempo real, unificando as capacidades de tradução do Cursor e do Claude na mesma plataforma.


## Arquitetura

```
live-translator-ecosystem/          # npm workspaces monorepo
├── packages/
│   ├── desktop-app/                # GUI Electron + React (Live Translator Hub)
│   │   ├── electron/main.js        # Processo principal, canais IPC e persistência de configuração
│   │   ├── electron/preload.js     # Ponte de comunicação do processo de renderização
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # Kernel de runtime de tradução (translator-engine.js)
│   ├── patcher-cursor/             # Patcher da aplicação Cursor
│   ├── patcher-claude/             # Patcher da aplicação Claude
│   └── dict-generator/             # Gerador de dicionários AI
```

### Runtime de Tradução

`packages/core/src/translator-engine.js` é o único runtime injetado nas aplicações alvo — JavaScript puro para navegador, sem dependências de módulos. As suas responsabilidades incluem:

- **Correspondência de dicionário**: entradas estáticas + padrões regex
- **Ponte de proxy de tradução AI**: no ambiente Webview, encaminha pedidos de tradução para a janela principal via `postMessage`, contornando as restrições de rede CSP
- **Cache de tradução**: cache persistente baseado em `localStorage`, com chave `live_i18n_cache_<entity_name>`
- **Pesquisa em dicionário aninhado**: suporta modo `enableNestedDict`

## Destaques de Funcionalidades

### Gestão Unificada de Dois Motores

Numa única interface, gere o estado de implantação da tradução, versões de dicionário e regras de bloqueio para Cursor e Claude separadamente, sem necessidade de alternar entre ferramentas.

### Penetração Webview em Todos os Cenários

Através da arquitetura Translation Bridge, a capacidade de tradução AI pode penetrar da janela principal para todos os níveis de plugins Webview (como Claude Code), resolvendo problemas de bloqueio de rede sob políticas CSP rigorosas.

### Layout de Quatro Painéis

| Painel | Função |
| :--- | :--- |
| **Cursor Engine** | Implantar/restaurar tradução do Cursor, gerir regras de bloqueio por domínio para a janela principal e plugins Webview |
| **Claude Engine** | Implantar/restaurar tradução do Claude, configurar regras de omissão |
| **API Keys** | Gerir chaves de API para múltiplos motores de tradução AI (suporta OpenAI, Anthropic, Google Gemini, DeepL), chaves armazenadas encriptadas via `safeStorage` do Electron |
| **Dict Generator** | Extrair strings de UI do código fonte da aplicação alvo e gerar dicionários de tradução em lote via AI |

### Depuração Interativa

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) alterna a borda de destaque azul tracejada
- No modo de destaque, mantenha premido `Option` (Mac) / `Alt` (Win) e passe o rato sobre texto chinês para ver o texto original

### Regras de Bloqueio por Domínio

Cada entidade (janela principal e cada plugin) possui um conjunto de regras de bloqueio totalmente independente (seletores CSS, correspondência de URL, correspondência de título), garantindo que as áreas de código e interação principal não sejam afetadas pela tradução.

### Atualização Automática

Inclui `electron-updater`, suporta verificação, download e instalação automática de atualizações na aplicação macOS.

## Início Rápido

```bash
# Instalar dependências
npm install

# Iniciar modo de desenvolvimento GUI
npm run dev

# Construir versão distribuível para macOS
npm run build -w desktop-app
```

### Fluxo de Utilização

1. Configure as chaves do motor AI no painel **API Keys**
2. Mude para o painel **Cursor Engine** ou **Claude Engine**
3. Clique em **Deploy** para implantar a tradução com um clique
4. Reinicie a aplicação alvo para que as alterações tenham efeito

### Requisitos de Sistema

- macOS 13+ (recomendado)
- Node.js 18+
- Aplicação desktop Cursor ou Claude instalada

## Segurança

- **Armazenamento encriptado de chaves de API**: encriptado via `safeStorage` do Electron e guardado em `~/.live_translator_hub/api_keys.enc`, não escrito em ficheiros de configuração
- **Comunicação direta**: os pedidos de tradução vão diretamente para a API do fornecedor AI, sem servidores intermediários
- **Isolamento por domínio**: as regras de bloqueio não tocam nos ficheiros de código fonte

---

*Este projeto destina-se apenas a fins de aprendizagem e troca de conhecimentos. A qualidade da tradução é influenciada pelo modelo AI selecionado.*
