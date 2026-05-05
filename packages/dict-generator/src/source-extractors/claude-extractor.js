/**
 * Claude 字典提取器
 *
 * 策略：
 *  1. 优先：从 Claude.app 的 app.asar 内提取 en-US.json
 *     （路径通过 ClaudePatcher.resolveResourcesPath 跨平台探测）
 *  2. 降级：使用 packages/patcher-claude/i18n/en-US.seed.json 种子文件
 *
 * 提取结果：{ hash → englishText } 映射
 */

'use strict';

const fs = require('fs');
const path = require('path');

const { resolveResourcesPath, detectVersion } = require('@live-translator/patcher-claude');

const ASAR_INNER_PATH = 'Contents/Resources/en-US.json';
const PATCHER_CLAUDE_DIR = path.dirname(require.resolve('@live-translator/patcher-claude'));
const SEED_FILE_PATH  = path.join(PATCHER_CLAUDE_DIR, 'i18n/en-US.seed.json');
const CLAUDE_ZH_PATH  = path.join(PATCHER_CLAUDE_DIR, 'zh-CN.json');

/**
 * 尝试从 asar 中提取 en-US.json
 * @param {string} asarPath  app.asar 的完整路径
 * @returns {object|null}  hash → englishText 映射，失败返回 null
 */
function tryExtractFromAsar(asarPath) {
  try {
    const originalFs = require('original-fs');
    const asar = require('@electron/asar');
    const content = asar.extractFile(asarPath, ASAR_INNER_PATH, { fs: originalFs });
    return JSON.parse(content.toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * 尝试从种子文件加载
 */
function tryLoadSeed() {
  if (fs.existsSync(SEED_FILE_PATH)) {
    return JSON.parse(fs.readFileSync(SEED_FILE_PATH, 'utf8'));
  }
  return null;
}

/**
 * 提取 Claude 字典的 hash → englishText 映射
 * @param {string} [customRoot]  可选：自定义 Claude 安装路径（.app 目录、Resources 目录或其任意祖先）
 * @returns {{ enMap: object, zhMap: object, sourceKeys: Set<string>, source: string }}
 */
function extract(customRoot) {
  const resourcesPath = resolveResourcesPath(customRoot || null);

  // Step 1: 优先从版本匹配的备份 asar 提取（干净官方原文）
  //         无备份则从当前 asar 提取（未打过补丁的原始版本）
  let enMap = null;
  let source = 'asar';

  if (resourcesPath) {
    const version = detectVersion(resourcesPath);
    const currentAsar = path.join(resourcesPath, 'app.asar');
    const backupAsar = path.join(resourcesPath, `app.asar.${version}.bak`);

    // 优先使用备份 asar（补丁前的干净原文）
    if (fs.existsSync(backupAsar)) {
      enMap = tryExtractFromAsar(backupAsar);
      if (enMap) source = 'backup';
    }

    // 没有备份则从当前 asar 提取
    if (!enMap) {
      enMap = tryExtractFromAsar(currentAsar);
      if (enMap) source = 'asar';
    }

    // en-US.json 在 asar 外部（独立文件）时直接读取
    if (!enMap) {
      const directEnUs = path.join(resourcesPath, 'en-US.json');
      if (fs.existsSync(directEnUs)) {
        try {
          enMap = JSON.parse(fs.readFileSync(directEnUs, 'utf8'));
          source = 'direct';
        } catch { enMap = null; }
      }
    }
  }

  if (!enMap) {
    enMap = tryLoadSeed();
    source = 'seed';
  }

  if (!enMap) {
    throw new Error(
      'Cannot find Claude en-US strings. ' +
      'Claude.app is not installed and no seed file found at: ' + SEED_FILE_PATH
    );
  }

  // Step 2: 加载现有 zh-CN 作为参考（可选）
  let zhMap = {};
  if (fs.existsSync(CLAUDE_ZH_PATH)) {
    zhMap = JSON.parse(fs.readFileSync(CLAUDE_ZH_PATH, 'utf8'));
  }

  const sourceKeys = new Set(Object.keys(enMap));

  console.log(`[claude-extractor] Loaded ${sourceKeys.size} keys from ${source}`);

  return { enMap, zhMap, sourceKeys, source };
}

module.exports = { extract, tryExtractFromAsar, tryLoadSeed, SEED_FILE_PATH };
