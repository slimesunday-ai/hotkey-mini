#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { isUtf8 } from 'node:buffer';
import { lstatSync, readFileSync } from 'node:fs';
import path from 'node:path';

const MAX_BYTES = 2 * 1024 * 1024;
const SECRET = /sk-or-v1-\w{20,}|sk-ant-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{32,}|AKIA[A-Z0-9]{16}|ghp_[A-Za-z0-9]{36}|xox[baprs]-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*|-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/g;

function git(root, args, maxBuffer = 64 * 1024 * 1024) {
  try {
    return execFileSync('git', ['-C', root, ...args], {
      maxBuffer,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    // Child-process errors can include captured file content. Never print them.
    throw new Error(`git ${args[0]} failed`);
  }
}

function workingContent(root, file) {
  try {
    const absolute = path.join(root, file);
    const stat = lstatSync(absolute);
    // Do not follow symlinks into ignored files or outside the repository.
    if (!stat.isFile() || stat.size > MAX_BYTES) return null;
    return readFileSync(absolute);
  } catch (error) {
    // Tracked files can have been deleted from the working tree.
    if (error.code === 'ENOENT') return null;
    throw new Error(`cannot read ${file}`);
  }
}

function stagedContent(root, file) {
  const object = `:${file}`;
  if (Number(git(root, ['cat-file', '-s', object]).toString()) > MAX_BYTES) return null;
  return git(root, ['show', object], MAX_BYTES + 1);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== '--staged')) {
    throw new Error('usage: node scripts/check-keys.mjs [--staged]');
  }
  const staged = args.includes('--staged');
  const root = git(process.cwd(), ['rev-parse', '--show-toplevel']).toString().replace(/\r?\n$/, '');
  const listing = staged
    ? ['diff', '--cached', '--name-only', '--diff-filter=d', '-z']
    : ['ls-files', '-co', '--exclude-standard', '-z'];
  const files = new Set(git(root, listing).toString().split('\0').filter(Boolean));

  // Gitlinks represent submodules, not files in this repository.
  const gitlinks = new Set();
  if (staged && files.size) {
    for (const entry of git(root, ['ls-files', '--stage', '-z']).toString().split('\0')) {
      if (entry.startsWith('160000 ')) gitlinks.add(entry.slice(entry.indexOf('\t') + 1));
    }
  }

  let found = false;
  for (const file of files) {
    if (gitlinks.has(file)) continue;
    const content = staged ? stagedContent(root, file) : workingContent(root, file);
    if (!content || content.length > MAX_BYTES || !isUtf8(content)) continue;
    // NUL and non-text control bytes identify binary data, including UTF-16.
    if (content.some(byte => byte < 32 && ![9, 10, 12, 13].includes(byte))) continue;
    const lines = content.toString('utf8').split(/\r\n|\n|\r/);
    for (const [index, line] of lines.entries()) {
      for (const match of line.matchAll(SECRET)) {
        console.log(`${file}:${index + 1}: ${match[0].slice(0, 6)}***`);
        found = true;
      }
    }
  }
  if (!found) console.log('check-keys: clean');
  return found ? 1 : 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`check-keys: ${error.message}`);
  process.exitCode = 1;
}
