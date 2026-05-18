#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOCK_PATH = path.join(ROOT, 'package-lock.json');

const WORKSPACES = {
  root: { label: 'root', packagePath: 'package.json', lockKey: '' },
  'desktop-app': { label: 'desktop-app', packagePath: 'packages/desktop-app/package.json', lockKey: 'packages/desktop-app' },
  desktop: { aliasFor: 'desktop-app' },
  app: { aliasFor: 'desktop-app' },
  core: { label: '@live-translator/core', packagePath: 'packages/core/package.json', lockKey: 'packages/core' },
  'dict-generator': { label: '@live-translator/dict-generator', packagePath: 'packages/dict-generator/package.json', lockKey: 'packages/dict-generator' },
  dict: { aliasFor: 'dict-generator' },
  'patcher-claude': { label: '@live-translator/patcher-claude', packagePath: 'packages/patcher-claude/package.json', lockKey: 'packages/patcher-claude' },
  claude: { aliasFor: 'patcher-claude' },
  'patcher-cursor': { label: '@live-translator/patcher-cursor', packagePath: 'packages/patcher-cursor/package.json', lockKey: 'packages/patcher-cursor' },
  cursor: { aliasFor: 'patcher-cursor' },
};

const GROUPS = {
  patchers: ['patcher-claude', 'patcher-cursor'],
  internal: ['core', 'patcher-claude', 'patcher-cursor', 'dict-generator'],
  all: ['desktop-app', 'core', 'patcher-claude', 'patcher-cursor', 'dict-generator'],
  everything: ['root', 'desktop-app', 'core', 'patcher-claude', 'patcher-cursor', 'dict-generator'],
};

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function writeJson(relativePath, data) {
  fs.writeFileSync(path.join(ROOT, relativePath), `${JSON.stringify(data, null, 2)}\n`);
}

function usage(exitCode = 1) {
  const targets = [
    'core',
    'patchers',
    'dict-generator',
    'patcher-claude',
    'patcher-cursor',
    'desktop-app',
    'internal',
    'all',
  ].join(', ');

  console.log(`Usage: node scripts/bump-workspace-version.js <target> <major|minor|patch|x.y.z>

Targets: ${targets}

Examples:
  node scripts/bump-workspace-version.js core patch
  node scripts/bump-workspace-version.js patchers minor
  node scripts/bump-workspace-version.js dict-generator 1.1.0
  node scripts/bump-workspace-version.js internal patch`);
  process.exit(exitCode);
}

function resolveTarget(target) {
  const key = String(target || '').trim();
  if (!key) usage();
  if (GROUPS[key]) return GROUPS[key].map(resolveWorkspaceKey);
  return [resolveWorkspaceKey(key)];
}

function resolveWorkspaceKey(key) {
  const entry = WORKSPACES[key];
  if (!entry) {
    console.error(`Unknown workspace target: ${key}`);
    usage();
  }
  return entry.aliasFor || key;
}

function bumpVersion(version, spec) {
  if (/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(spec)) return spec;

  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(version);
  if (!match) throw new Error(`Cannot bump non-semver version: ${version}`);

  let major = Number(match[1]);
  let minor = Number(match[2]);
  let patch = Number(match[3]);

  if (spec === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (spec === 'minor') {
    minor += 1;
    patch = 0;
  } else if (spec === 'patch') {
    patch += 1;
  } else {
    throw new Error(`Unknown version bump: ${spec}`);
  }

  return `${major}.${minor}.${patch}`;
}

function main() {
  const [, , targetArg, versionArg] = process.argv;
  if (!targetArg || !versionArg || targetArg === '--help' || targetArg === '-h') usage(targetArg ? 0 : 1);

  const workspaceKeys = [...new Set(resolveTarget(targetArg))];
  const lock = readJson('package-lock.json');
  const changes = [];

  for (const key of workspaceKeys) {
    const workspace = WORKSPACES[key];
    const pkg = readJson(workspace.packagePath);
    const oldVersion = pkg.version;
    const nextVersion = bumpVersion(oldVersion, versionArg);

    pkg.version = nextVersion;
    writeJson(workspace.packagePath, pkg);

    const lockPackage = lock.packages?.[workspace.lockKey];
    if (lockPackage && lockPackage.version !== undefined) {
      lockPackage.version = nextVersion;
    }

    changes.push(`${workspace.label}: ${oldVersion} -> ${nextVersion}`);
  }

  writeJson('package-lock.json', lock);

  console.log('Updated workspace versions:');
  for (const change of changes) console.log(`  ${change}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
