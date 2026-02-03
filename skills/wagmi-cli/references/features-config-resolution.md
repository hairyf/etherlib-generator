---
title: Config file resolution
description: How the CLI finds wagmi.config and resolves root.
source: https://github.com/wevm/wagmi/blob/main/packages/cli/src/utils/findConfig.ts
---

# Config file resolution

## findConfig behavior

Config path is resolved in this order:

1. If **`--config`** is passed: resolve from **`--root`** (or cwd) and use that path. If file does not exist, return undefined (init) or throw (generate).
2. Otherwise: search **upward** from **`--root`** (or cwd) for the first existing file among:
   - `wagmi.config.ts`
   - `wagmi.config.js`
   - `wagmi.config.mjs`
   - `wagmi.config.mts`

So `-r` / `--root` is the directory to start from; `-c` / `--config` is the explicit config file path.

## Example

```bash
# Use cwd and find wagmi.config.ts in current or parent dir
wagmi generate

# Start search from ./app
wagmi generate --root ./app

# Explicit file (no search)
wagmi generate --config ./app/wagmi.config.ts
wagmi generate -c wagmi.config.mts -r /project
```

## Config loading

The CLI uses `resolveConfig({ configPath })` to load the file (bundled with esbuild). Config can export a single `Config`, an array of `Config`, or a function returning either (sync or async). Multiple configs produce multiple outputs; each must have a unique `out`.
