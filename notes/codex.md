# Codex build notes

Implemented the requested secret checks and hook installer using Node built-ins only.

- `scripts/check-keys.mjs` scans tracked and non-ignored untracked files returned by Git, with NUL-delimited filenames. It detects all seven requested pattern families, reports each match as `path:line: first-six-characters***`, and exits 1 on findings or scan errors.
- `--staged` reads changed index content using `git diff --cached --name-only` and `git show :path`. Deleted entries and submodules are skipped. Binary files and files larger than 2 MiB are skipped; files exactly at the limit are scanned. Working-tree symlinks are not followed.
- `scripts/install-hooks.mjs` creates executable pre-commit and pre-push hooks, refreshes hooks bearing its ownership header, and warns while preserving other hooks and symlinks.
- `test/keys.test.mjs` contains 27 passing tests covering every pattern, masking, line numbers, clean cases, ignored/tracked files, unusual filenames, binary and size limits, staged versus working content, error exits, and hook ownership/permissions.
- Every key-shaped fixture is assembled at runtime. All fixtures and hook-installation tests use `fs.mkdtempSync` repositories under `os.tmpdir()`. Staged fixtures use temporary Git blobs/index files written with Node; the only state-changing Git command run is `git init` in those temporary directories.

Read SPEC.md sections 1, 12, and 13 before implementation. The task's explicit authorization for read-only Git commands takes precedence over the spec's general restriction on Codex running Git.

Only the three requested implementation/test files and this notes file were written in the project. The installer was exercised only in temporary repositories. No network calls, package installs, git add, git commit, or git push were used.

## Verification

Run from the repo root, using absolute paths to the scripts.

`node --test test/keys.test.mjs` — exit 0. TAP summary:

```text
1..27
# tests 27
# suites 0
# pass 27
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 2396.209041
```

`node scripts/check-keys.mjs` — exit 0:

```text
check-keys: clean
```

