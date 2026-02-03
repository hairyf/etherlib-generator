---
title: Sourcify and Routescan plugins
description: sourcify() and routescan() config — chainId, contracts, API key.
source: https://github.com/wevm/wagmi/blob/main/packages/cli/src/plugins/sourcify.ts, routescan.ts
---

# Sourcify and Routescan plugins

Both fetch ABIs from remote APIs; contracts are `{ name, address }` (no `abi`). Built on the fetch plugin.

## Sourcify

Fetches from Sourcify server: `https://sourcify.dev/server/v2/contract/{chainId}/{address}?fields=abi`.

```ts
import { sourcify } from '@wagmi/cli/plugins'

sourcify({
  chainId: 1,
  contracts: [{ name: 'Counter', address: '0x...' }],
  cacheDuration: 1_800_000,
})
```

| Option | Required | Description |
|--------|----------|-------------|
| **chainId** | yes | Chain ID (see [Sourcify chains](https://docs.sourcify.dev/docs/chains)). |
| **contracts** | yes | `{ name, address }` or `{ name, address: Record<chainId, address> }`. |
| **cacheDuration** | no | Default 30m ms. |

No API key. Single address is normalized to `{ [chainId]: address }`. Response must have `abi`; 404 throws “Contract not found in Sourcify repository.”

## Routescan

Fetches from Routescan API (Etherscan-compatible). Requires API key.

```ts
import { routescan } from '@wagmi/cli/plugins'

routescan({
  apiKey: process.env.ROUTESCAN_API_KEY!,
  chainId: 1,
  contracts: [{ name: 'Counter', address: '0x...' }],
  cacheDuration: 1_800_000,
  tryFetchProxyImplementation: false,
})
```

| Option | Required | Description |
|--------|----------|-------------|
| **apiKey** | yes | Routescan API key. |
| **chainId** | yes | Chain ID for the API. |
| **contracts** | yes | Same as Sourcify. |
| **cacheDuration** | no | Default 30m ms. |
| **tryFetchProxyImplementation** | no | Default `false`; try to resolve proxy ABI. |

Use `loadEnv()` in config if reading API key from `.env`.
