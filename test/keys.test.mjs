import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const scanner = fileURLToPath(new URL('../scripts/check-keys.mjs', import.meta.url));
const installer = fileURLToPath(new URL('../scripts/install-hooks.mjs', import.meta.url));
const MAX_BYTES = 2 * 1024 * 1024;
const openrouter = () => 'sk' + '-or-' + 'v1-' + 'A_2'.repeat(7);
const anthropic = () => 'sk' + '-ant-' + 'api03-' + 'a_B-1'.repeat(8);
const generic = () => 'sk' + '-' + 'aB12'.repeat(8);
const aws = () => 'AK' + 'IA' + 'A1'.repeat(8);
const github = () => 'gh' + 'p_' + 'a1'.repeat(18);
const slack = kind => 'xo' + 'x' + kind + '-' + '1'.repeat(12) + '-' + 'aB2'.repeat(12);
const pem = type => '-'.repeat(5) + 'BEGIN ' + type + 'PRIVATE' + ' KEY' + '-'.repeat(5);
const masked = value => value.slice(0, 6) + '***';

function repo(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hkmini-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  // init is the only Git command in these tests that changes state.
  execFileSync('git', ['-C', root, 'init', '--quiet', '--object-format=sha1'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return root;
}

function write(root, name, content) {
  const target = path.join(root, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function run(root, args = [], script = scanner) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  return result;
}

function clean(result) {
  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'check-keys: clean\n');
  assert.equal(result.stderr, '');
}

// Build a minimal v2 Git index and loose blobs as temporary fixtures, without
// git add, update-index, hash-object, commit, or any other mutating Git command.
function index(root, files) {
  const entries = Object.entries(files).sort(([a], [b]) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
  const header = Buffer.alloc(12);
  header.write('DIRC');
  header.writeUInt32BE(2, 4);
  header.writeUInt32BE(entries.length, 8);
  const chunks = [header];
  for (const [name, value] of entries) {
    const content = Buffer.from(value);
    const blob = Buffer.concat([Buffer.from(`blob ${content.length}\0`), content]);
    const oid = createHash('sha1').update(blob).digest();
    const hex = oid.toString('hex');
    write(root, path.join('.git', 'objects', hex.slice(0, 2), hex.slice(2)), deflateSync(blob));
    const filename = Buffer.from(name);
    const entry = Buffer.alloc(Math.ceil((62 + filename.length + 1) / 8) * 8);
    entry.writeUInt32BE(0o100644, 24);
    entry.writeUInt32BE(content.length, 36);
    oid.copy(entry, 40);
    entry.writeUInt16BE(Math.min(filename.length, 0xfff), 60);
    filename.copy(entry, 62);
    chunks.push(entry);
  }
  const body = Buffer.concat(chunks);
  write(root, '.git/index', Buffer.concat([body, createHash('sha1').update(body).digest()]));
}

for (const [name, make] of [
  ['OpenRouter', openrouter],
  ['Anthropic', anthropic],
  ['generic', generic],
  ['AWS', aws],
  ['GitHub', github],
  ...[...'baprs'].map(kind => [`Slack ${kind}`, () => slack(kind)]),
  ...['', 'RSA ', 'EC ', 'DSA ', 'OPENSSH ', 'ENCRYPTED '].map(type => [`PEM ${type || 'PKCS8'}`, () => pem(type)]),
]) {
  test(`detects and masks ${name}`, t => {
    const root = repo(t);
    const key = make();
    write(root, 'sample.txt', `safe\ncredential=${key}\n`);
    const result = run(root);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, `sample.txt:2: ${masked(key)}\n`);
    assert.equal(result.stderr, '');
    assert.equal(result.stdout.includes(key), false);
  });
}

test('clean repository, ignored files, and short lookalikes exit zero', t => {
  const root = repo(t);
  write(root, '.gitignore', 'ignored.txt\n');
  write(root, 'ignored.txt', generic());
  write(root, 'safe.txt', [
    'ordinary text',
    'sk' + '-or-' + 'v1-' + 'a'.repeat(19),
    'sk' + '-ant-' + 'a'.repeat(19),
    'sk' + '-' + 'a'.repeat(31),
    'AK' + 'IA' + 'A'.repeat(15),
    'gh' + 'p_' + 'a'.repeat(35),
  ].join('\n'));
  clean(run(root));
});

test('reports every match, correct line numbers, and unusual filenames from a subdirectory', t => {
  const root = repo(t);
  const name = 'nested/space and\ttab.txt';
  const keys = [generic(), aws(), github()];
  write(root, name, `safe\r\n${keys[0]} ${keys[1]}\r${keys[2]}\n`);
  const result = run(path.join(root, 'nested'));
  assert.equal(result.status, 1);
  assert.equal(result.stdout, `${name}:2: ${masked(keys[0])}\n${name}:2: ${masked(keys[1])}\n${name}:3: ${masked(keys[2])}\n`);
  assert.equal(result.stderr, '');
});

test('skips NUL, other binary control bytes, and invalid UTF-8', t => {
  const root = repo(t);
  const key = Buffer.from(generic());
  write(root, 'nul.bin', Buffer.concat([key, Buffer.from([0])]));
  write(root, 'control.bin', Buffer.concat([Buffer.from([1]), key]));
  write(root, 'invalid.bin', Buffer.concat([key, Buffer.from([0xff])]));
  clean(run(root));
});

test('skips files over 2 MiB but scans files exactly at the limit', t => {
  const root = repo(t);
  const key = generic();
  write(root, 'large.txt', key + '.'.repeat(MAX_BYTES + 1 - key.length));
  clean(run(root));
  write(root, 'limit.txt', key + '.'.repeat(MAX_BYTES - key.length));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, `limit.txt:1: ${masked(key)}\n`);
});

test('scans tracked ignored files, skips missing files, and does not follow symlinks', t => {
  const root = repo(t);
  const key = generic();
  write(root, '.gitignore', 'ignored.txt\n');
  write(root, 'ignored.txt', key);
  fs.symlinkSync('ignored.txt', path.join(root, 'link.txt'));
  clean(run(root));
  index(root, { 'ignored.txt': 'old safe content', 'missing.txt': 'safe' });
  const result = run(root);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, `ignored.txt:1: ${masked(key)}\n`);
});

test('staged scan reads indexed content even when the working file is clean or missing', t => {
  const root = repo(t);
  const key = anthropic();
  const name = 'nested/staged file.txt';
  index(root, { [name]: `safe\n${key}\n` });
  write(root, name, 'clean working content');
  clean(run(root));
  for (const remove of [false, true]) {
    if (remove) fs.unlinkSync(path.join(root, name));
    const result = run(root, ['--staged']);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, `${name}:2: ${masked(key)}\n`);
    assert.equal(result.stderr, '');
  }
});

test('staged scan excludes unstaged and untracked secrets', t => {
  const root = repo(t);
  clean(run(root, ['--staged']));
  index(root, { 'staged.txt': 'clean staged content' });
  write(root, 'staged.txt', generic());
  write(root, 'untracked.txt', github());
  clean(run(root, ['--staged']));
  assert.equal(run(root).status, 1);
});

test('staged scan skips indexed binary and oversized files', t => {
  const root = repo(t);
  index(root, {
    'binary.bin': Buffer.concat([Buffer.from(generic()), Buffer.from([0])]),
    'large.txt': generic() + '.'.repeat(MAX_BYTES),
  });
  clean(run(root, ['--staged']));
});

test('invalid arguments and Git failures exit nonzero without a clean message', t => {
  const root = repo(t);
  const badArgs = run(root, ['--unknown']);
  assert.equal(badArgs.status, 1);
  assert.equal(badArgs.stdout, '');
  assert.match(badArgs.stderr, /usage:/);
  fs.rmSync(path.join(root, '.git'), { recursive: true, force: true });
  const noRepo = run(root);
  assert.equal(noRepo.status, 1);
  assert.equal(noRepo.stdout, '');
  assert.equal(noRepo.stderr, 'check-keys: git rev-parse failed\n');
});

test('installs executable hooks, refreshes owned hooks, and preserves foreign hooks', t => {
  const root = repo(t);
  const commitHook = path.join(root, '.git/hooks/pre-commit');
  const pushHook = path.join(root, '.git/hooks/pre-push');
  let result = run(root, [], installer);
  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  const installed = fs.readFileSync(commitHook, 'utf8');
  assert.match(installed, /exec node scripts\/check-keys\.mjs --staged\n$/);
  assert.match(fs.readFileSync(pushHook, 'utf8'), /exec node scripts\/check-keys\.mjs\n$/);
  assert.equal(fs.statSync(commitHook).mode & 0o777, 0o755);
  assert.equal(fs.statSync(pushHook).mode & 0o777, 0o755);
  fs.appendFileSync(commitHook, '# old version\n');
  fs.chmodSync(commitHook, 0o644);
  result = run(root, [], installer);
  assert.equal(result.status, 0);
  assert.equal(fs.readFileSync(commitHook, 'utf8'), installed);
  assert.equal(fs.statSync(commitHook).mode & 0o777, 0o755);
  const foreign = '#!/bin/sh\n# custom hook\nexit 0\n';
  fs.writeFileSync(commitHook, foreign);
  fs.chmodSync(commitHook, 0o700);
  result = run(root, [], installer);
  assert.equal(result.status, 0);
  assert.match(result.stderr, /warning: keeping existing pre-commit/);
  assert.equal(fs.readFileSync(commitHook, 'utf8'), foreign);
  assert.equal(fs.statSync(commitHook).mode & 0o777, 0o700);
});

test('hook installer preserves a pre-existing symlink', t => {
  const root = repo(t);
  const target = path.join(root, 'custom-hook');
  write(root, 'custom-hook', '#!/bin/sh\nexit 0\n');
  const hook = path.join(root, '.git/hooks/pre-push');
  fs.symlinkSync(target, hook);
  const result = run(root, [], installer);
  assert.equal(result.status, 0);
  assert.match(result.stderr, /warning: keeping existing pre-push/);
  assert.equal(fs.readlinkSync(hook), target);
  assert.equal(fs.readFileSync(target, 'utf8'), '#!/bin/sh\nexit 0\n');
});
