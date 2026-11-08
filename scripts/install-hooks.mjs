#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { chmodSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const HEADER = '#!/bin/sh\n# hotkey-mini managed hook (scripts/install-hooks.mjs)\n';

try {
  const hooksPath = execFileSync('git', ['-C', process.cwd(), 'rev-parse', '--git-path', 'hooks'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).replace(/\r?\n$/, '');
  const hooksDir = path.resolve(process.cwd(), hooksPath);
  mkdirSync(hooksDir, { recursive: true });

  for (const [name, args] of [['pre-commit', ' --staged'], ['pre-push', '']]) {
    const target = path.join(hooksDir, name);
    let exists = false;
    try {
      const stat = lstatSync(target);
      exists = true;
      if (!stat.isFile() || !readFileSync(target, 'utf8').startsWith(HEADER)) {
        console.warn(`install-hooks: warning: keeping existing ${name}; it is not ours`);
        continue;
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    writeFileSync(target, `${HEADER}exec node scripts/check-keys.mjs${args}\n`, {
      flag: exists ? 'w' : 'wx',
      mode: 0o755,
    });
    chmodSync(target, 0o755);
    console.log(`install-hooks: installed ${name}`);
  }
} catch {
  console.error('install-hooks: could not install hooks');
  process.exitCode = 1;
}
