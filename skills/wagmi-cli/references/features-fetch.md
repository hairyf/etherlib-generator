---
title: Fetch plugin
description: fetch() config — request, parse, getCacheKey, cache, timeout; getCacheDir.
source: https://github.com/wevm/wagmi/blob/main/packages/cli/src/plugins/fetch.ts
---

# Fetch plugin

Fetches ABIs from any URL via `fetch`. Implements `contracts()` only (no `run`). Cache is on disk; on fetch failure the plugin falls back to cached ABI if present.

## Config

```ts
import { fetch, getCacheDir } from '@wagmi/cli/plugins'

fetch({
  name: 'MySource',
  contracts: [{ name: 'Counter', address: '0x...' }],
  request: ({ name, address }) => ({
    url: `https://api.example.com/abi/${address}`,
    init: { headers: { 'X-API-Key': process.env.API_KEY } },
  }),
  parse: async ({ response }) => (await response.json()).abi,
  getCacheKey: ({ contract }) => `${contract.name}:${contract.address}`,
  cacheDuration: 1_800_000,
  timeoutDuration: 5_000,
})
```

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| **contracts** | yes | — | List of `{ name, address? }` (no `abi`). |
| **request** | yes | — | `(config: { name, address? }) => { url, init? } \| Promise<...>`. |
| **parse** | no | `({ response }) => response.json()` | `(config: { response }) => Abi \| Promise<Abi>`. |
| **getCacheKey** | no | `({ contract }) => JSON.stringify(contract)` | Key for cache file per contract. |
| **name** | no | `'Fetch'` | Plugin name. |
| **cacheDuration** | no | `1_800_000` (30m ms) | How long cache is valid. |
| **timeoutDuration** | no | `5_000` (5s ms) | Request timeout; aborts with AbortController. |

## getCacheDir()

Returns cache directory: `~/.wagmi-cli/plugins/fetch/cache`. Cache files are `{cacheKey}.json` with `{ abi, timestamp }`. Used by etherscan/routescan plugins; export for custom tooling.

## Behavior

- For each contract, compute cache key; if cache file exists and `timestamp > Date.now()`, use cached ABI.
- Otherwise `request(contract)` → `fetch(url, init)` with `timeoutDuration`; then `parse({ response })`; write cache.
- On fetch/parse error, try to read existing cache; if no ABI, rethrow.
