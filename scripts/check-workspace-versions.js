#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const WORKSPACES = [
  { label: 'root', packagePath: 'package.json', lockKey: '' },
  { label: 'desktop-app', packagePath: 'packages/desktop-app/package.json', lockKey: 'packages/desktop-app' },
  { label: '@live-translator/core', packagePath: 'packages/core/package.json', lockKey: 'packages/core' },
  { label: '@live-translator/dict-generator', packagePath: 'packages/dict-generator/package.json', lockKey: 'packages/dict-generator' },
  { label: '@live-translator/patcher-claude', packagePath: 'packages/patcher-claude/package.json', lockKey: 'packages/patcher-claude' },
  { label: '@live-translator/patcher-cursor', packagePath: 'packages/patcher-cursor/package.json', lockKey: 'packages/patcher-cursor' },
];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function main() {
  const lock = readJson('package-lock.json');
  const issues = [];

  for (const workspace of WORKSPACES) {
    const pkg = readJson(workspace.packagePath);
    const lockPackage = lock.packages?.[workspace.lockKey];

    if (!lockPackage) {
      issues.push(`${workspace.label}: missing package-lock entry "${workspace.lockKey}"`);
      continue;
    }

    if (pkg.name && lockPackage.name && pkg.name !== lockPackage.name) {
      issues.push(`${workspace.label}: package name mismatch (${pkg.name} != ${lockPackage.name})`);
    }

    if (pkg.version !== lockPackage.version) {
      issues.push(`${workspace.label}: version mismatch (${pkg.version} != ${lockPackage.version || 'missing in lockfile'})`);
    }
  }

  if (issues.length > 0) {
    console.error('Workspace version check failed:');
    for (const issue of issues) console.error(`  - ${issue}`);
    process.exit(1);
  }

  console.log('Workspace versions are in sync.');
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
