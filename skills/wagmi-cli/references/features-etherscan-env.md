---
title: Etherscan / API keys and loadEnv
description: Using API keys for Etherscan/Routescan; loadEnv behavior.
source: https://github.com/wevm/wagmi/blob/main/packages/cli/src/plugins/etherscan.ts, utils/loadEnv.ts
---

# Etherscan / API keys and loadEnv

Etherscan and Routescan plugins require an API key. Load keys from env so they are not committed.

## loadEnv

Config is loaded with `bundle-require`; the CLI loads env **before** resolving config. Use `loadEnv` in your config file if you need env in the config itself (e.g. to pass `apiKey`).

```ts
import { defineConfig, loadEnv } from '@wagmi/cli'
import { etherscan } from '@wagmi/cli/plugins'

loadEnv({ mode: process.env.NODE_ENV, envDir: process.cwd() })
// Or just load .env: loadEnv()

export default defineConfig({
  out: 'src/generated.ts',
  plugins: [
    etherscan({
      apiKey: process.env.ETHERSCAN_API_KEY!,
      chainId: 1,
      contracts: [{ name: 'EnsRegistry', address: '0x...' }],
    }),
  ],
})
```

**Files read** (in order, later overrides): `.env`, `.env.local`, and if `mode` is set: `.env.${mode}`, `.env.${mode}.local`. `mode: 'local'` is disallowed. `envDir` defaults to `process.cwd()`.

## Etherscan

- **apiKey**: From https://etherscan.io/myapikey
- **chainId**: Chain for the Etherscan API (see Etherscan supported chains)
- **contracts**: List of `{ name, address }` (no `abi`; fetched from API)
- **tryFetchProxyImplementation**: Optional; try to resolve proxy ABI

Use `process.env.ETHERSCAN_API_KEY` after calling `loadEnv()` in config, or set the variable in the shell.

## Routescan / other explorers

Same idea: pass API key from env after `loadEnv()`, or rely on env already set when the CLI runs.
