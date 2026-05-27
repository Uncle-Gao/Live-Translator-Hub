# 屏蔽规则可视化拾取面板 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在翻译引擎调试模式中，通过 `Alt+Click` 拾取元素选择器；右上角悬浮面板显示当前屏蔽规则、预览覆盖区域（红色高亮）、还原/重译文本；一键复制已选规则供粘贴到 Hub 的 SkipChipInput。

**架构：** 全部改动集中在 `packages/core/src/translator-engine.js` 一个文件。新增两个模块级 Set 控制运行时屏蔽逻辑（`panelBypassSelectors` / `panelSkipSelectors`），同时 hook 进现有 `isExcluded` 函数。面板随调试模式开关出现/消失；Alt+Click（捕获阶段）拦截链接跳转并弹出选择器候选浮窗；规则复制格式为换行分隔的纯选择器文本，与 Hub 的 SkipChipInput 粘贴逻辑完全兼容。

**技术栈：** 纯浏览器 JS，DOM API，`navigator.clipboard`，`document.execCommand` 兜底

---

## 文件清单

| 操作 | 路径 | 职责 |
|------|------|------|
| 修改 | `packages/core/src/translator-engine.js` | 全部实现 |

> 本项目无测试文件（CLAUDE.md 明确说明）。验证步骤为：在 Hub 中重新部署 Cursor，在 Cursor DevTools Console 中观察日志，在 UI 中手动交互验证。

---

## 背景知识（执行前必读）

### Hub 的 SkipChipInput 粘贴行为

`packages/desktop-app/src/components/CursorPanel/SkipRules/SkipChipInput.jsx`：

- `handlePaste` → 识别含逗号/换行/HTML 标签的粘贴内容 → 调 `parseInput`
- `parseInput` 支持：HTML 片段（提取 class/id）、裸类名（自动加 `.`）、逗号/换行分隔
- `addItems` 自动去重：已存在的规则不会重复添加
- **disabled 状态仅为本地 React state**，不在 config 中存储

**复制格式结论：** 换行分隔的纯选择器字符串（如 `.monaco-editor\n.view-lines`）即可被 Hub 正确解析。面板只复制**已勾选**的规则。

### `isExcluded` 当前实现（约第 393 行）

```js
function isExcluded(node) {
  const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  for (const selector of SKIP_SELECTORS) {      // 来自部署时注入的配置
    try { if (el.closest(selector)) return true; } catch (e) {}
  }
  return false;
}
```

本计划在此函数插入两条额外检查：
- **`panelBypassSelectors`**（Set）：包含"被取消勾选的继承规则"→ 即使 SKIP_SELECTORS 命中，也放行翻译
- **`panelSkipSelectors`**（Set）：包含"已勾选的拾取规则"→ 额外拦截翻译

### 翻译元素的数据属性

- `processNode` 在翻译成功后：`parentElement.setAttribute('data-i18n-original', raw)` + 修改文本节点内容为译文
- `processTitle` 在翻译 title 后：`el.setAttribute('data-i18n-original-title', title)`
- 还原原文：通过 `data-i18n-original` + `getTranslation(original)` 逆向操作文本节点

---

## 任务 1：CSS — 面板、红色覆盖、候选浮窗、Toast

**文件：** 修改 `packages/core/src/translator-engine.js`

- [ ] **步骤 1：找到 DEBUG_STYLE 的末尾**

  定位（约第 92–94 行）：
  ```
      border: 1px solid rgba(255,255,255,0.1); max-width: 450px;
      word-break: break-word; line-height: 1.4;
    }
  `;
  ```

- [ ] **步骤 2：在反引号前追加 pick mode 相关 CSS**

  替换为：
  ```js
      border: 1px solid rgba(255,255,255,0.1); max-width: 450px;
      word-break: break-word; line-height: 1.4;
    }
    .i18n-skip-preview {
      outline: 2px dashed #ef4444 !important;
      outline-offset: 1px !important;
      background-color: rgba(239, 68, 68, 0.12) !important;
    }
    #i18n-skip-panel {
      position: fixed; top: 12px; right: 12px; z-index: 2147483647;
      width: 280px; max-height: 480px;
      background: rgba(15, 23, 42, 0.96); border: 1px solid rgba(239,68,68,0.4);
      border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.6);
      display: flex; flex-direction: column; font-family: monospace;
      font-size: 11px; color: #e2e8f0; overflow: hidden;
    }
    #i18n-panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 10px; background: rgba(239,68,68,0.15);
      border-bottom: 1px solid rgba(239,68,68,0.2); flex-shrink: 0;
      font-size: 11px; font-weight: bold; color: #fca5a5;
    }
    #i18n-panel-close {
      background: none; border: none; color: #94a3b8; cursor: pointer;
      font-size: 13px; line-height: 1; padding: 0 2px;
    }
    #i18n-panel-close:hover { color: #ef4444; }
    #i18n-panel-body {
      flex: 1; overflow-y: auto; padding: 6px 0;
    }
    .i18n-panel-section {
      padding: 2px 10px 4px; font-size: 10px;
      color: rgba(148,163,184,0.5); text-transform: uppercase; letter-spacing: 0.05em;
    }
    .i18n-rule-item {
      display: flex; align-items: center; gap: 6px;
      padding: 3px 10px; cursor: default;
    }
    .i18n-rule-item:hover { background: rgba(255,255,255,0.04); }
    .i18n-rule-checkbox { cursor: pointer; flex-shrink: 0; accent-color: #ef4444; }
    .i18n-rule-label {
      flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      color: #cbd5e1; font-size: 11px;
    }
    .i18n-rule-label.inherited { color: #64748b; }
    .i18n-rule-lock { color: #475569; font-size: 10px; flex-shrink: 0; }
    .i18n-rule-delete {
      background: none; border: none; color: #475569; cursor: pointer;
      font-size: 11px; line-height: 1; padding: 0 2px; flex-shrink: 0;
    }
    .i18n-rule-delete:hover { color: #ef4444; }
    #i18n-panel-footer {
      display: flex; gap: 6px; padding: 8px 10px;
      border-top: 1px solid rgba(255,255,255,0.06); flex-shrink: 0;
    }
    #i18n-panel-footer button {
      flex: 1; padding: 5px 0; border: 1px solid rgba(255,255,255,0.1);
      border-radius: 5px; background: rgba(255,255,255,0.05);
      color: #94a3b8; cursor: pointer; font-size: 10px;
      font-family: monospace; transition: all 0.15s;
    }
    #i18n-panel-footer button:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }
    #i18n-panel-copy:hover { border-color: rgba(34,197,94,0.4); color: #86efac !important; }
    #i18n-panel-clear:hover { border-color: rgba(239,68,68,0.4); color: #fca5a5 !important; }
    #i18n-selector-chooser {
      position: fixed; z-index: 2147483648; min-width: 240px; max-width: 420px;
      background: rgba(15, 23, 42, 0.97); border: 1px solid rgba(249,115,22,0.5);
      border-radius: 6px; box-shadow: 0 8px 24px rgba(0,0,0,0.6);
      font-family: monospace; font-size: 11px; overflow: hidden; display: none;
    }
    #i18n-chooser-title {
      padding: 6px 10px; color: #64748b; font-size: 10px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      word-break: break-all;
    }
    .i18n-chooser-item {
      padding: 6px 10px; color: #cbd5e1; cursor: pointer;
      border-bottom: 1px solid rgba(255,255,255,0.04); word-break: break-all;
    }
    .i18n-chooser-item:last-child { border-bottom: none; }
    .i18n-chooser-item:hover { background: rgba(249,115,22,0.15); color: #fdba74; }
    .i18n-chooser-item-best::before { content: "▶ "; color: #f97316; }
    #i18n-pick-toast {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: #16a34a; color: #fff; font: bold 12px/1 monospace;
      padding: 7px 18px; border-radius: 20px; z-index: 2147483647;
      pointer-events: none; opacity: 0; transition: opacity 0.25s;
    }
  `;
  ```

---

## 任务 2：模块级状态 + 修改 `isExcluded`

**文件：** 修改 `packages/core/src/translator-engine.js`

- [ ] **步骤 1：找到 `SKIP_SELECTORS` 的定义行（约第 21 行）**

  定位：
  ```js
  const SKIP_SELECTORS = CONFIG.skip?.selectors || [];
  ```

- [ ] **步骤 2：在该行之后追加两个 Set**

  替换为：
  ```js
  const SKIP_SELECTORS = CONFIG.skip?.selectors || [];
  const panelBypassSelectors = new Set();
  const panelSkipSelectors = new Set();
  ```

- [ ] **步骤 3：找到 `isExcluded` 函数体（约第 393 行）**

  定位：
  ```js
  function isExcluded(node) {
    if (!node) return false;
    const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!el) return false;

    for (const selector of SKIP_SELECTORS) {
      if (!selector || typeof selector !== 'string') continue;
      try {
        if (el.closest(selector)) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            console.warn(`[Live-Translator] 屏蔽区域匹配成功: ${selector}`, node);
          }
          return true;
        }
      } catch (e) { }
    }
    return false;
  }
  ```

- [ ] **步骤 4：修改 `isExcluded` 加入面板旁路和附加屏蔽逻辑**

  替换为：
  ```js
  function isExcluded(node) {
    if (!node) return false;
    const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!el) return false;

    for (const selector of SKIP_SELECTORS) {
      if (!selector || typeof selector !== 'string') continue;
      try {
        if (el.closest(selector)) {
          if (panelBypassSelectors.has(selector)) continue;
          if (node.nodeType === Node.ELEMENT_NODE) {
            console.warn(`[Live-Translator] 屏蔽区域匹配成功: ${selector}`, node);
          }
          return true;
        }
      } catch (e) { }
    }
    for (const selector of panelSkipSelectors) {
      try { if (el.closest(selector)) return true; } catch (e) {}
    }
    return false;
  }
  ```

---

## 任务 3：帮助函数

**文件：** 修改 `packages/core/src/translator-engine.js`，插入在 `observer` 与 `function init()` 之间（约第 481 行）

- [ ] **步骤 1：找到插入位置**

  定位：
  ```js
    if (hasAct && !rafId) rafId = requestAnimationFrame(handleMutations);
  });

  function init() {
  ```

- [ ] **步骤 2：在 `function init()` 前插入全部帮助函数**

  替换为：
  ```js
    if (hasAct && !rafId) rafId = requestAnimationFrame(handleMutations);
  });

  function getPickSelectors(el) {
    const results = [];
    for (const attr of el.attributes) {
      if (attr.name.startsWith('data-') && !attr.name.startsWith('data-i18n') &&
          attr.value && attr.value.length < 60)
        results.push(`[${attr.name}="${attr.value}"]`);
    }
    if (el.id) results.push(`#${el.id}`);
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.length < 40) results.push(`[aria-label="${ariaLabel}"]`);
    const role = el.getAttribute('role');
    if (role) results.push(`[role="${role}"]`);
    const stableClasses = [...el.classList].filter(c =>
      !c.startsWith('i18n-') && c.length > 3 &&
      !/^(flex|grid|block|inline|hidden|relative|absolute|fixed|static|sticky)$/.test(c)
    );
    if (stableClasses.length) results.push('.' + stableClasses.slice(0, 3).join('.'));
    return results;
  }

  function getAncestorChain(el) {
    const parts = [];
    let cur = el.parentElement;
    let depth = 0;
    while (cur && cur !== document.body && depth < 3) {
      const tag = cur.tagName.toLowerCase();
      const cls = [...cur.classList]
        .filter(c => !c.startsWith('i18n-') && c.length > 3).slice(0, 2).join('.');
      parts.unshift(cls ? `${tag}.${cls}` : tag);
      cur = cur.parentElement;
      depth++;
    }
    return parts.join(' > ');
  }

  function applyRedOverlay(selector) {
    try {
      document.querySelectorAll(selector).forEach(el => {
        el.classList.add('i18n-skip-preview');
      });
    } catch (e) {}
  }

  function removeRedOverlay(selector) {
    try {
      document.querySelectorAll(selector).forEach(el => {
        el.classList.remove('i18n-skip-preview');
      });
    } catch (e) {}
  }

  function restoreElementText(el) {
    const original = el.getAttribute('data-i18n-original');
    if (!original) return;
    const trans = getTranslation(original);
    if (!trans) return;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent.includes(trans)) {
        node.textContent = node.textContent.replace(trans, original);
      }
    }
  }

  function restoreOriginalInArea(selector) {
    try {
      document.querySelectorAll(selector).forEach(root => {
        restoreElementText(root);
        root.querySelectorAll('[data-i18n-original]').forEach(el => restoreElementText(el));
        root.querySelectorAll('[data-i18n-original-title]').forEach(el => {
          el.setAttribute('title', el.getAttribute('data-i18n-original-title'));
        });
      });
    } catch (e) {}
  }

  function retranslateArea(selector) {
    try {
      document.querySelectorAll(selector).forEach(el => walkAndTranslate(el));
    } catch (e) {}
  }

  function init() {
  ```

---

## 任务 4：面板 DOM 初始化

**文件：** 修改 `packages/core/src/translator-engine.js`，在 `init()` 内部

- [ ] **步骤 1：找到插入位置**

  在 `init()` 内定位 `document.body.appendChild(tooltip);`（约第 499 行）

- [ ] **步骤 2：在该行之后创建面板和相关状态**

  在 `document.body.appendChild(tooltip);` 后插入：
  ```js

    // === Pick Panel ===
    const skipPanel = document.createElement('div');
    skipPanel.id = 'i18n-skip-panel';
    skipPanel.style.display = 'none';
    skipPanel.innerHTML = `
      <div id="i18n-panel-header">
        <span>⛔ 屏蔽规则预览</span>
        <button id="i18n-panel-close">✕</button>
      </div>
      <div id="i18n-panel-body">
        <div class="i18n-panel-section">当前配置</div>
        <ul id="i18n-panel-inherited" style="list-style:none;margin:0;padding:0"></ul>
        <div class="i18n-panel-section" style="margin-top:4px">已拾取</div>
        <ul id="i18n-panel-picked" style="list-style:none;margin:0;padding:0"></ul>
      </div>
      <div id="i18n-panel-footer">
        <button id="i18n-panel-copy">复制已选</button>
        <button id="i18n-panel-clear">清除已拾取</button>
      </div>
    `;
    document.body.appendChild(skipPanel);

    const pickToast = document.createElement('div');
    pickToast.id = 'i18n-pick-toast';
    document.body.appendChild(pickToast);

    let toastTimer = null;
    const pickedRules = new Map(); // selector → { active: boolean }

    function showPickToast(text) {
      pickToast.textContent = text;
      pickToast.style.opacity = '1';
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { pickToast.style.opacity = '0'; }, 2500);
    }

    function makePanelRuleItem(selector, type) {
      const li = document.createElement('li');
      li.className = 'i18n-rule-item';
      li.dataset.selector = selector;
      li.dataset.type = type;

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'i18n-rule-checkbox';
      cb.checked = true;

      const label = document.createElement('span');
      label.className = 'i18n-rule-label' + (type === 'inherited' ? ' inherited' : '');
      label.textContent = selector;
      label.title = selector;

      li.appendChild(cb);
      li.appendChild(label);

      if (type === 'picked') {
        const del = document.createElement('button');
        del.className = 'i18n-rule-delete';
        del.textContent = '✕';
        del.title = '删除此规则';
        li.appendChild(del);
      } else {
        const lock = document.createElement('span');
        lock.className = 'i18n-rule-lock';
        lock.textContent = '🔒';
        li.appendChild(lock);
      }

      return li;
    }

    function populateInheritedRules() {
      const ul = document.getElementById('i18n-panel-inherited');
      if (!ul) return;
      ul.innerHTML = '';
      SKIP_SELECTORS.forEach(selector => {
        if (!selector) return;
        ul.appendChild(makePanelRuleItem(selector, 'inherited'));
      });
    }

    function addPickedRule(selector) {
      if (pickedRules.has(selector)) return;
      pickedRules.set(selector, { active: true });
      panelSkipSelectors.add(selector);
      applyRedOverlay(selector);
      restoreOriginalInArea(selector);
      const ul = document.getElementById('i18n-panel-picked');
      if (ul) ul.appendChild(makePanelRuleItem(selector, 'picked'));
    }

    function removePickedRule(selector) {
      if (!pickedRules.has(selector)) return;
      pickedRules.delete(selector);
      panelSkipSelectors.delete(selector);
      removeRedOverlay(selector);
      retranslateArea(selector);
      const ul = document.getElementById('i18n-panel-picked');
      if (ul) {
        const li = ul.querySelector(`[data-selector="${CSS.escape(selector)}"]`);
        if (li) li.remove();
      }
    }

    function onRuleCheckboxChange(li, checked) {
      const selector = li.dataset.selector;
      const type = li.dataset.type;
      if (type === 'inherited') {
        if (checked) {
          panelBypassSelectors.delete(selector);
          applyRedOverlay(selector);
          restoreOriginalInArea(selector);
        } else {
          panelBypassSelectors.add(selector);
          removeRedOverlay(selector);
          retranslateArea(selector);
        }
      } else {
        if (checked) {
          pickedRules.set(selector, { active: true });
          panelSkipSelectors.add(selector);
          applyRedOverlay(selector);
          restoreOriginalInArea(selector);
        } else {
          pickedRules.set(selector, { active: false });
          panelSkipSelectors.delete(selector);
          removeRedOverlay(selector);
          retranslateArea(selector);
        }
      }
    }

    // 面板事件委托
    skipPanel.addEventListener('change', (e) => {
      if (e.target.classList.contains('i18n-rule-checkbox')) {
        const li = e.target.closest('.i18n-rule-item');
        if (li) onRuleCheckboxChange(li, e.target.checked);
      }
    });

    skipPanel.addEventListener('click', (e) => {
      if (e.target.id === 'i18n-panel-close') {
        skipPanel.style.display = 'none';
      } else if (e.target.id === 'i18n-panel-copy') {
        const lines = [];
        skipPanel.querySelectorAll('.i18n-rule-item').forEach(li => {
          const cb = li.querySelector('.i18n-rule-checkbox');
          if (cb && cb.checked) lines.push(li.dataset.selector);
        });
        const text = lines.join('\n');
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text)
            .then(() => showPickToast(`已复制 ${lines.length} 条规则`))
            .catch(() => showPickToast('复制失败'));
        } else {
          try {
            const ta = document.createElement('textarea');
            Object.assign(ta.style, { position: 'fixed', opacity: '0' });
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showPickToast(`已复制 ${lines.length} 条规则`);
          } catch (_) { showPickToast('复制失败'); }
        }
      } else if (e.target.id === 'i18n-panel-clear') {
        [...pickedRules.keys()].forEach(s => removePickedRule(s));
        showPickToast('已清除所有已拾取规则');
      } else if (e.target.classList.contains('i18n-rule-delete')) {
        const li = e.target.closest('.i18n-rule-item');
        if (li) removePickedRule(li.dataset.selector);
      }
    });
  ```

---

## 任务 5：调试模式开关时联动面板显隐

**文件：** 修改 `packages/core/src/translator-engine.js`

- [ ] **步骤 1：找到 keydown 监听器中的 debug toggle 部分**

  定位（约第 503–515 行）：
  ```js
      const isToggle = (e.metaKey || e.ctrlKey) && e.altKey && e.shiftKey && e.code === 'KeyB';
      if (isToggle) {
        const newState = !document.body.classList.contains('i18n-debug-active');
        document.body.classList.toggle('i18n-debug-active', newState);
        if (FEATURES.enableTranslationBridge) {
          if (IS_WORKBENCH) {
            broadcastMessage({ type: 'I18N_DEBUG_SYNC', state: newState });
          } else if (window.top && window.top !== window.self) {
            window.top.postMessage({ type: 'I18N_DEBUG_SYNC', state: newState }, '*');
          }
        }
        console.log('[I18N] 调试模式已同步切换:', newState);
      }
  ```

- [ ] **步骤 2：在 `console.log` 行后追加面板显隐逻辑**

  替换为：
  ```js
      const isToggle = (e.metaKey || e.ctrlKey) && e.altKey && e.shiftKey && e.code === 'KeyB';
      if (isToggle) {
        const newState = !document.body.classList.contains('i18n-debug-active');
        document.body.classList.toggle('i18n-debug-active', newState);
        if (FEATURES.enableTranslationBridge) {
          if (IS_WORKBENCH) {
            broadcastMessage({ type: 'I18N_DEBUG_SYNC', state: newState });
          } else if (window.top && window.top !== window.self) {
            window.top.postMessage({ type: 'I18N_DEBUG_SYNC', state: newState }, '*');
          }
        }
        console.log('[I18N] 调试模式已同步切换:', newState);
        if (newState) {
          skipPanel.style.display = 'flex';
          populateInheritedRules();
          SKIP_SELECTORS.forEach(s => { if (s) applyRedOverlay(s); });
        } else {
          skipPanel.style.display = 'none';
          document.querySelectorAll('.i18n-skip-preview').forEach(el => el.classList.remove('i18n-skip-preview'));
          panelBypassSelectors.clear();
          panelSkipSelectors.clear();
        }
      }
  ```

---

## 任务 6：选择器候选浮窗 + Alt+Click 拦截

**文件：** 修改 `packages/core/src/translator-engine.js`，在 `init()` 内，任务 5 之后

- [ ] **步骤 1：找到 `document.body.addEventListener('mouseover', ...)` debug 工具提示部分**

  定位（约第 531 行）：
  ```js
    document.body.addEventListener('mouseover', (e) => {
      if (!document.body.classList.contains('i18n-debug-active') || !e.altKey) return;
  ```

- [ ] **步骤 2：在该 `mouseover` 监听器之前插入候选浮窗 DOM 和 Alt+Click 处理器**

  在 `document.body.addEventListener('mouseover', ...` 之前插入：
  ```js

    // === Selector Chooser ===
    const chooser = document.createElement('div');
    chooser.id = 'i18n-selector-chooser';
    document.body.appendChild(chooser);

    function showChooser(el, cx, cy) {
      const selectors = getPickSelectors(el);
      if (!selectors.length) return;
      const ancestor = getAncestorChain(el);
      chooser.innerHTML = '';
      const title = document.createElement('div');
      title.id = 'i18n-chooser-title';
      title.textContent = ancestor ? `祖先: ${ancestor}` : `<${el.tagName.toLowerCase()}>`;
      chooser.appendChild(title);
      selectors.slice(0, 5).forEach((s, i) => {
        const item = document.createElement('div');
        item.className = 'i18n-chooser-item' + (i === 0 ? ' i18n-chooser-item-best' : '');
        item.textContent = s;
        item.addEventListener('click', (ev) => {
          ev.stopPropagation();
          chooser.style.display = 'none';
          addPickedRule(s);
          showPickToast(`已添加: ${s}`);
        });
        chooser.appendChild(item);
      });
      chooser.style.display = 'block';
      const x = Math.min(cx + 8, window.innerWidth - chooser.offsetWidth - 8);
      const y = Math.min(cy + 8, window.innerHeight - chooser.offsetHeight - 8);
      chooser.style.left = x + 'px';
      chooser.style.top = y + 'px';
    }

    document.body.addEventListener('click', (e) => {
      if (!document.body.classList.contains('i18n-debug-active') || !e.altKey) return;
      if (e.target === chooser || chooser.contains(e.target)) return;
      if (e.target === skipPanel || skipPanel.contains(e.target)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (chooser.style.display !== 'none') {
        chooser.style.display = 'none';
        return;
      }
      showChooser(e.target, e.clientX, e.clientY);
    }, true);

    document.addEventListener('click', (e) => {
      if (chooser.style.display === 'none') return;
      if (!chooser.contains(e.target)) chooser.style.display = 'none';
    }, true);

  ```

---

## 任务 7：手动验证

- [ ] **步骤 1：在 Hub 中对 Cursor 执行"重新部署"**

- [ ] **步骤 2：打开 Cursor，按 `Cmd+Alt+Shift+B`（Mac）/ `Ctrl+Alt+Shift+B`（Win）激活调试模式**

  预期：
  - 右上角出现红色边框面板"⛔ 屏蔽规则预览"
  - 面板"当前配置"区域列出所有 SKIP_SELECTORS（如 `.monaco-list-row` 等）
  - 当前已配置规则覆盖的 DOM 区域出现红色虚线高亮

- [ ] **步骤 3：验证 Alt+Click 选择器拾取**

  按住 `Alt/Option`，点击页面中任意元素（非面板区域）：
  - 预期：浮窗出现，显示候选选择器（第一条有 `▶` 标记）
  - 再次 Alt+Click 同元素或点击其他地方：浮窗关闭
  - 点击浮窗中某个选择器：浮窗关闭，面板"已拾取"区域新增该规则，Toast 确认，该规则覆盖区域出现红色高亮

- [ ] **步骤 4：验证 Alt+Click 拦截链接跳转**

  在调试模式下，`Alt+Click` 一个超链接元素：
  - 预期：页面不跳转，浮窗出现显示候选选择器

- [ ] **步骤 5：验证 checkbox 还原/重译**

  在面板中取消勾选一条继承规则（如 `.monaco-list-row`）：
  - 预期：该区域红色高亮消失，匹配元素被翻译（出现蓝色调试边框）

  重新勾选该规则：
  - 预期：区域恢复红色高亮，已翻译文本还原为原文

  取消勾选一条已拾取规则：
  - 预期：红色高亮消失，匹配的已翻译元素重新被翻译

- [ ] **步骤 6：验证复制格式**

  在面板中勾选若干规则，点击"复制已选"：
  - 打开任意文本编辑器粘贴，确认格式为每行一个选择器
  - 在 Hub 的 SkipChipInput 中粘贴，确认每个选择器变成一个 chip，无重复

- [ ] **步骤 7：验证面板关闭和调试模式关闭**

  点击面板 ✕ 按钮：面板隐藏，红色高亮消失，调试模式仍然开启（蓝色边框还在）

  按 `Cmd+Alt+Shift+B` 关闭调试模式：面板消失，所有红色和蓝色高亮清除，旁路 Set 重置

---

## 任务 8：Commit

- [ ] **步骤 1：确认改动只涉及一个文件**

  ```bash
  git diff --name-only
  ```
  预期输出：`packages/core/src/translator-engine.js`

- [ ] **步骤 2：提交**

  ```bash
  git add packages/core/src/translator-engine.js
  git commit -m "feat(core): add visual skip rule picker panel with Alt+Click"
  ```

---

## 边界与注意事项

| 场景 | 处理方式 |
|------|----------|
| 元素无任何特征属性 | 浮窗不显示，Alt+Click 无响应（`getPickSelectors` 返回空数组） |
| 已拾取的选择器重复 | `pickedRules.has(selector)` 判断去重，忽略重复 |
| `CSS.escape` 不可用 | 理论上 Cursor（Electron 34）支持，无需兜底 |
| 调试模式关闭时清理 | `panelBypassSelectors.clear()` + `panelSkipSelectors.clear()` + 移除所有 `.i18n-skip-preview` |
| Alt+Click 误触面板/浮窗内部 | `skipPanel.contains(e.target)` / `chooser.contains(e.target)` 提前 return |
| `navigator.clipboard` 不可用 | `execCommand('copy')` 兜底 |
| 选择器语法非法（querySelectorAll 抛错） | 所有 querySelectorAll 调用均 try/catch 包裹 |
| 继承规则取消勾选后元素被翻译，再重新勾选 | `restoreOriginalInArea` 通过 `data-i18n-original` + `getTranslation` 逆向还原译文 |
| `retranslateArea` 调 `walkAndTranslate`，但 `isExcluded` 仍拦截 | 修改后的 `isExcluded` 先查 `panelBypassSelectors`，绕过原始 SKIP_SELECTORS 检查 |
