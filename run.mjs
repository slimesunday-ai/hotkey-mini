#!/usr/bin/env node
// hotkey mini: run bot or AI seasons and write out/<run>/ (SPEC §10, §12). See src/cli.mjs for the options.
import { main } from './src/cli.mjs';

main(process.argv.slice(2)).catch(err => {
  console.error(`run.mjs: ${err.message}`);
  process.exitCode = 1;
});
