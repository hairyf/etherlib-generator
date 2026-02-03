---
title: React and Actions plugin options
description: react() and actions() config — getHookName, abiItemHooks, getActionName, overridePackageName.
source: https://github.com/wevm/wagmi/blob/main/packages/cli/src/plugins/react.ts, actions.ts
---

# React and Actions plugin options

Code-generation plugins that implement `run()` and emit hooks/actions from ABIs.

## React plugin

Generates React hooks (e.g. `useReadContract`, `useWriteContract`, `useWatchContractEvent`).

```ts
import { react } from '@wagmi/cli/plugins'

react({
  abiItemHooks: true,
  getHookName: ({ contractName, itemName, type }) =>
    `use${pascalCase(contractName)}${pascalCase(itemName ?? '')}${pascalCase(type)}`,
})
```

| Option | Default | Description |
|--------|---------|-------------|
| **abiItemHooks** | `true` | Generate per-function/event hooks (e.g. `useCounterBalance`) in addition to generic hooks. |
| **getHookName** | (default naming) | Custom name: `(options: { contractName, itemName?, type: 'read' \| 'simulate' \| 'watch' \| 'write' }) => \`use${string}\``. Use `'legacy'` for deprecated legacy naming. |

Hook names must start with `use`. Default naming uses contract name and item name (e.g. `useCounterBalance` for `balanceOf` on contract `Counter`).

## Actions plugin

Generates wagmi/viem-style actions (e.g. `readContract`, `writeContract`, `watchContractEvent`). Uses `@wagmi/core` or `wagmi` depending on what’s installed and `overridePackageName`.

```ts
import { actions } from '@wagmi/cli/plugins'

actions({
  getActionName: ({ contractName, itemName, type }) =>
    `${camelCase(contractName)}${pascalCase(itemName ?? '')}${pascalCase(type)}`,
  overridePackageName: 'wagmi',
})
```

| Option | Default | Description |
|--------|---------|-------------|
| **getActionName** | (default naming) | Custom name: `(options: { contractName, itemName?, type: 'read' \| 'simulate' \| 'watch' \| 'write' }) => string`. Use `'legacy'` for deprecated naming. |
| **overridePackageName** | auto-detect | `'@wagmi/core'` or `'wagmi'` — which package to import actions from. |

Default: detects installed package; use `overridePackageName` when both are present or to force one.
