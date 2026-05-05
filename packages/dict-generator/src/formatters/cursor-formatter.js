/**
 * Cursor 字典格式化器
 * 将翻译结果回填进与 dictionary.json 完全相同的嵌套 JSON 结构
 */

'use strict';

/**
 * 将 resultMap (pathKey → translatedValue) 回填进新 JSON 树
 * @param {object}   rawDict   原始 dictionary.json 对象（用于确定结构）
 * @param {object}   resultMap  { 'path|joined|key' → 译文字符串 }
 * @returns {object}           新字典对象（嵌套 JSON）
 */
function format(rawDict, resultMap) {
  return rebuildTree(rawDict, [], resultMap);
}

/**
 * 递归重建 JSON 树
 */
function rebuildTree(obj, parentPath, resultMap) {
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    const currentPath = [...parentPath, k];
    if (typeof v === 'string') {
      const pathKey = currentPath.join('|');
      // 使用译文；若缺失，保留原值（并标记）
      result[k] = resultMap[pathKey] ?? v;
    } else if (v && typeof v === 'object') {
      result[k] = rebuildTree(v, currentPath, resultMap);
    } else {
      result[k] = v;
    }
  }
  return result;
}

/**
 * 序列化为格式化 JSON 字符串
 * @param {object} dict
 * @returns {string}
 */
function serialize(dict) {
  return JSON.stringify(dict, null, 2) + '\n';
}

module.exports = { format, rebuildTree, serialize };
