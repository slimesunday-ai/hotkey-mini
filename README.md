# hotkey mini

A small, headless playtest sim of the AI City attention game, for tuning rules fast. It is a tuning tool, not the
product; the full game lives in a separate repo (the trunk) and is not touched from here.

- What to build: `SPEC.md`
- How it's tuned: `TUNING.md`
- Free bot seasons: `node run.mjs --bots --seeds 50`
- Tests: `npm test`

No API keys live in this repo. The AI path reads keys from `~/.config/openrouter/key` and `~/.config/anthropic/key`
(outside the repo), a pre-commit hook (`scripts/check-keys.mjs`) blocks key-shaped strings, and every paid run needs
slime's go.
