---
title: Internal types
description: Compute, MaybeArray, MaybePromise, RequiredBy — used in config and plugins.
source: https://github.com/wevm/wagmi/blob/main/packages/cli/src/types.ts
---

# Internal types

Not exported from `@wagmi/cli`; used in config and plugin typings.

| Type | Purpose |
|------|---------|
| **Compute\<T\>** | Flatten intersection for better inference: `{ [key in keyof T]: T[key] } & unknown` |
| **MaybeArray\<T\>** | `T \| T[]` — config can be single or array |
| **MaybePromise\<T\>** | `T \| Promise<T>` — plugin/contract callbacks can be sync or async |
| **RequiredBy\<T, K\>** | Make keys `K` required on `T`; e.g. `RequiredBy<Plugin, 'run'>` for plugins that implement `run` |

Used in: `Config`, `Plugin`, `ContractConfig`, `Watch`, and plugin return types (e.g. `Compute<RequiredBy<Plugin, 'contracts'>>`).
