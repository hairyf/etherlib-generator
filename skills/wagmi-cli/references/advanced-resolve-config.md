---
title: Config resolution and bundling
description: resolveConfig, bundle-require, and async config functions.
source: https://github.com/wevm/wagmi/blob/main/packages/cli/src/utils/resolveConfig.ts
---

# Config resolution and bundling

## resolveConfig

Used internally by `generate` after `findConfig`. Not exported from `@wagmi/cli`; documented for understanding behavior.

```ts
// Pseudocode: how config is loaded
const configPath = await findConfig({ config: options.config, root: options.root })
const resolved = await resolveConfig({ configPath })
// resolved: Config | Config[]
```

**Behavior**:

1. Bundle the config file with `bundle-require` (esbuild). This runs TypeScript/ESM and resolves `@wagmi/cli` imports.
2. Read `res.mod.default`. If it has a `.default` (re-export), use that.
3. If the value is a **function**, call it and await the result.
4. Return a single `Config` or an array of `Config`. Each config in the array must have a unique `out`.

So the config file can export:

```ts
export default { out: 'src/generated.ts', plugins: [] }
// or
export default () => ({ out: 'src/generated.ts', plugins: [] })
// or
export default async () => ({ out: 'src/generated.ts', plugins: [] })
// or
export default [{ out: 'src/a.ts', plugins: [] }, { out: 'src/b.ts', plugins: [] }]
```

## loadEnv timing

Env is loaded when the config module is evaluated. If your config uses `process.env`, ensure `.env` exists or variables are set before running `wagmi generate` / `wagmi init`. Calling `loadEnv()` at the top of the config file ensures `.env` is loaded before you read `process.env.ETHERSCAN_API_KEY` etc.
