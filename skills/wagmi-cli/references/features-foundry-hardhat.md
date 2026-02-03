---
title: Foundry and Hardhat plugins
description: Config options for foundry() and hardhat() — artifacts, deployments, watch, commands.
source: https://github.com/wevm/wagmi/blob/main/packages/cli/src/plugins/foundry.ts, hardhat.ts
---

# Foundry and Hardhat plugins

Use when contracts come from local Solidity builds. Both plugins implement `contracts` and `watch`; they run build/compile when needed and watch source/artifact dirs.

## Foundry

```ts
import { foundry, foundryDefaultExcludes } from '@wagmi/cli/plugins'

foundry({
  project: '.',
  artifacts: 'out', // same as forge -o
  deployments: { Counter: '0x...' },
  exclude: foundryDefaultExcludes,
  includeBroadcasts: false,
  forge: {
    clean: false,
    build: true,
  },
})
```

| Option | Default | Description |
|--------|---------|-------------|
| **project** | — | Path to Foundry project (directory with foundry.toml). |
| **artifacts** | from foundry config or `'out'` | Artifacts directory. |
| **deployments** | `{}` | Map contract name → address (single or per-chain). |
| **exclude** | `foundryDefaultExcludes` | Glob patterns to skip (e.g. test/script contracts). |
| **includeBroadcasts** | `false` | Use addresses from broadcast/ run-latest.json as deployments. |
| **forge.clean** | `false` | Run forge clean before build. |
| **forge.build** | `true` | Run forge build before reading artifacts. |

## Hardhat

```ts
import { hardhat, hardhatDefaultExcludes } from '@wagmi/cli/plugins'

hardhat({
  project: '.',
  artifacts: 'artifacts',
  sources: 'contracts',
  deployments: { Counter: '0x...' },
  exclude: hardhatDefaultExcludes,
  include: ['*.json'],
  namePrefix: '',
  commands: {
    clean: true, // or string, e.g. 'pnpm hardhat clean'
    build: true, // or string, e.g. 'pnpm hardhat compile'
    rebuild: true,
  },
})
```

| Option | Default | Description |
|--------|---------|-------------|
| **project** | — | Path to Hardhat project. |
| **artifacts** | `'artifacts'` | Artifacts directory. |
| **sources** | `'contracts'` | Source directory (for watch). |
| **deployments** | `{}` | Map contract name → address. |
| **exclude** | `hardhatDefaultExcludes` | Glob patterns (e.g. build-info, *.dbg.json). |
| **include** | `['*.json']` | Glob for artifact files. |
| **namePrefix** | `''` | Prepended to contract names. |
| **commands.clean** | packageManager + `hardhat clean` | Run before build. |
| **commands.build** | packageManager + `hardhat compile` | Build before reading artifacts. |
| **commands.rebuild** | packageManager + `hardhat compile` | Run on watch file change. |

Default excludes avoid test/script and std lib artifacts; override `exclude` / `include` as needed.
