/**
 * Cursor 字典提取器
 * 从 patcher-cursor/i18n/dictionary.json 提取所有叶子条目
 */

'use strict';

const fs = require('fs');
const path = require('path');

const PATCHER_CURSOR_DIR = path.dirname(require.resolve('@live-translator/patcher-cursor'));
const CURSOR_DICT_PATH = path.join(PATCHER_CURSOR_DIR, 'i18n/dictionary.json');

/**
 * 叶子条目：{ path: string[], en: string }
 * path  — 嵌套键路径（如 ['file', 'openFile']）
 * en    — 叶子的 key（即英文原文，用作翻译源）
 *
 * 注意：dictionary.json 的结构是 嵌套 JSON，
 *   key = 英文原文，value = 中文译文（或子对象）
 */

/**
 * 递归提取所有叶子条目
 * @param {object} obj
 * @param {string[]} parentPath
 * @returns {{ path: string[], en: string, currentValue: string }[]}
 */
function extractLeaves(obj, parentPath = []) {
  const leaves = [];
  for (const [k, v] of Object.entries(obj)) {
    const currentPath = [...parentPath, k];
    if (typeof v === 'string') {
      leaves.push({ path: currentPath, en: k, currentValue: v });
    } else if (v && typeof v === 'object') {
      leaves.push(...extractLeaves(v, currentPath));
    }
  }
  return leaves;
}

/**
 * 加载并提取 Cursor 字典的所有叶子条目
 * @param {string} [dictPath]  可选：覆盖默认 dictionary.json 路径
 * @returns {{ leaves: Array, rawDict: object, sourceKeys: Set<string> }}
 */
function extract(dictPath = CURSOR_DICT_PATH) {
  if (!fs.existsSync(dictPath)) {
    throw new Error(`Cursor dictionary not found: ${dictPath}`);
  }

  const rawDict = JSON.parse(fs.readFileSync(dictPath, 'utf8'));
  const leaves = extractLeaves(rawDict);

  // sourceKeys: 每个叶子用其 path.join('|') 唯一标识
  const sourceKeys = new Set(leaves.map(l => l.path.join('|')));

  return { leaves, rawDict, sourceKeys };
}

module.exports = { extract, extractLeaves, CURSOR_DICT_PATH };
