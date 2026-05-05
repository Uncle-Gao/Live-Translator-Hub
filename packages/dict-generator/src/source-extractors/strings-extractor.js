/**
 * Apple .strings 格式提取器
 * 从 Localizable.strings.zh-CN（或 .en 源文件）提取所有翻译条目
 * 
 * 格式：
 *   "English original" = "Translation";
 *   (空行)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const CLAUDE_STRINGS_ZH = path.join(
  path.dirname(require.resolve('@live-translator/patcher-claude')),
  'Localizable.strings.zh-CN'
);

/**
 * 解析 .strings 文件，提取所有 key-value 条目
 * @param {string} content   文件内容字符串
 * @returns {Array<{ key: string, value: string, rawLine: string, lineIndex: number }>}
 */
function parseStrings(content) {
  const lines = content.split('\n');
  const entries = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 匹配 "key" = "value"; 格式
    const match = line.match(/^"((?:[^"\\]|\\.)*)"\s*=\s*"((?:[^"\\]|\\.)*)"\s*;/);
    if (match) {
      entries.push({
        key: match[1],
        value: match[2],
        rawLine: line,
        lineIndex: i,
      });
    }
  }

  return entries;
}

/**
 * 提取 strings 文件结构
 * @param {string} [stringsPath]  可选：覆盖默认路径
 * @returns {{
 *   entries: Array<{ key, value, rawLine, lineIndex }>,
 *   lines: string[],
 *   sourceKeys: Set<string>
 * }}
 */
function extract(stringsPath = CLAUDE_STRINGS_ZH) {
  if (!fs.existsSync(stringsPath)) {
    throw new Error(`Localizable.strings not found: ${stringsPath}`);
  }

  const content = fs.readFileSync(stringsPath, 'utf8');
  const lines = content.split('\n');
  const entries = parseStrings(content);
  const sourceKeys = new Set(entries.map(e => e.key));

  console.log(`[strings-extractor] Loaded ${sourceKeys.size} entries from ${path.basename(stringsPath)}`);

  return { entries, lines, sourceKeys };
}

module.exports = { extract, parseStrings, CLAUDE_STRINGS_ZH };
