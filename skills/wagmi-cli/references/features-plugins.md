---
title: Built-in plugins
description: Plugins exported from @wagmi/cli/plugins and typical usage.
source: https://github.com/wevm/wagmi/blob/main/packages/cli/src/exports/plugins.ts
---

# Built-in plugins

All plugins are exported from `@wagmi/cli/plugins`. Use in `wagmi.config.ts`:

```ts
import { defineConfig } from '@wagmi/cli'
import { fetch, foundry, hardhat, react, etherscan, sourcify, routescan, blockExplorer, actions } from '@wagmi/cli/plugins'

export default defineConfig({
  out: 'src/generated.ts',
  plugins: [
    // contract sources
    foundry(),
    hardhat(),
    fetch({ ... }),
    etherscan({ ... }),
    sourcify({ ... }),
    routescan({ ... }),
    blockExplorer({ ... }),
    // code generation
    react(),
    actions(),
  ],
})
```

## Contract source plugins

Provide contracts via `contracts()` (and often `watch` for file-based sources).

| Plugin | Purpose |
|--------|---------|
| **fetch** | Fetch ABIs from URLs (custom request/parse, cache, timeout). |
| **foundry** | Contracts from Foundry artifacts dir; optional deployments, broadcasts, forge build. |
| **hardhat** | Contracts from Hardhat artifacts; optional deployments. |
| **etherscan** | ABIs from Etherscan API (by address). |
| **sourcify** | ABIs from Sourcify. |
| **routescan** | ABIs from Routescan. |
| **blockExplorer** | Generic block explorer API abstraction. |

## Code generation plugins

Implement `run()` to emit imports/prepend/content.

| Plugin | Purpose |
|--------|---------|
| **react** | Generates React hooks (e.g. useReadContract, useWriteContract) from ABIs. |
| **actions** | Generates wagmi/viem action helpers from ABIs. |

## Fetch plugin example

```ts
import { fetch } from '@wagmi/cli/plugins'

fetch({
  name: 'MySource',
  contracts: [
    { name: 'Counter', address: '0x...' },
  ],
  request: ({ name, address }) => ({ url: `https://api.example.com/abi/${address}` }),
  parse: ({ response }) => response.json(),
  cacheDuration: 1_800_000,
  timeoutDuration: 5_000,
})
```

## Foundry / Hardhat

- **foundry**: `artifacts`, `deployments`, `exclude`, `includeBroadcasts`, `forge` options; default excludes (e.g. test/script contracts) via `foundryDefaultExcludes`.
- **hardhat**: `artifacts`, `deployments`, `exclude`; default excludes via `hardhatDefaultExcludes`.

Use one of these when contracts come from local Solidity builds; use fetch/etherscan/sourcify/routescan when ABIs come from remote APIs.
