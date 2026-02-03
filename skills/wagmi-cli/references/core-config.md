---
title: Config and defineConfig
description: Configuration shape, ContractConfig, and defineConfig helper.
source: https://github.com/wevm/wagmi/blob/main/packages/cli/src/config.ts
---

# Config and defineConfig

Config is resolved from `wagmi.config.ts` / `wagmi.config.js` (or path from `--config`). Can be a single config object or an array of configs (multiple outputs).

## Config type

```ts
interface Config {
  contracts?: ContractConfig[]
  out: string
  plugins?: Plugin[]
}
```

- **contracts**: Optional list of contracts (ABI + optional address + name). Merged with contracts from plugins.
- **out**: **Required.** Output file path for generated code.
- **plugins**: Optional list of plugins. Order matters; plugins can contribute contracts and/or run to produce content.

## ContractConfig

```ts
interface ContractConfig<chainId = number, requiredChainId = number | undefined> {
  abi: Abi
  address?: Address | Record<chainId, Address>
  name: string
}
```

- **abi**: Contract ABI (viem `Abi`).
- **address**: Optional. Single address or `{ [chainId]: address }` for multi-chain.
- **name**: Unique contract name (used for generated symbols and deduplication).

Example:

```ts
{
  name: 'Counter',
  abi: [...],
  address: {
    1: '0x...',
    5: '0x...',
  },
}
```

## defineConfig

```ts
defineConfig(config: Config | Config[] | (() => MaybePromise<Config | Config[]>))
```

Use in config file for type safety. Accepts object, array, or async function.

```ts
// wagmi.config.ts
import { defineConfig } from '@wagmi/cli'

export default defineConfig({
  out: 'src/generated.ts',
  contracts: [],
  plugins: [],
})
```

Default config (used by `wagmi init`): `{ out: 'src/generated.ts', contracts: [], plugins: [] }`.
