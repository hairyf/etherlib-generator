---
title: blockExplorer plugin
description: Generic block explorer plugin — baseUrl, getabi, apiKey, getAddress.
source: https://github.com/wevm/wagmi/blob/main/packages/cli/src/plugins/blockExplorer.ts
---

# blockExplorer plugin

Fetches ABIs from any block explorer that supports the Etherscan-style `?module=contract&action=getabi&address=...` API. Built on the fetch plugin (cache, request, parse).

## Config

```ts
import { blockExplorer } from '@wagmi/cli/plugins'

blockExplorer({
  baseUrl: 'https://api.etherscan.io',
  chainId: 1,
  apiKey: process.env.ETHERSCAN_API_KEY,
  contracts: [{ name: 'Counter', address: '0x...' }],
  getAddress: ({ address }) => (typeof address === 'string' ? address : address[1]),
  name: 'Etherscan',
  cacheDuration: 1_800_000,
})
```

| Option | Required | Description |
|--------|----------|-------------|
| **baseUrl** | yes | Base URL for the API (e.g. `https://api.etherscan.io`). |
| **contracts** | yes | List of `{ name, address }` (no `abi`). |
| **apiKey** | no | Appended as `&apikey=...`. |
| **chainId** | no | Appended as `&chainId=...`. |
| **getAddress** | no | From contract config to single address; default: string or first value of record. |
| **name** | no | Default `'Block Explorer'`. |
| **cacheDuration** | no | Default `1_800_000` (30m ms). |

## Response format

Expects JSON: either `{ status: '1', message: 'OK', result: string }` (result is JSON-stringified ABI) or `{ status: '0', message: 'NOTOK', result: string }` (error message). Invalid or `status === '0'` throws.

Use for custom Etherscan-compatible explorers; for Etherscan/Routescan specifically use the dedicated `etherscan` / `routescan` plugins.
