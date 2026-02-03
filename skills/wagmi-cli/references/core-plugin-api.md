---
title: Plugin API
description: Plugin interface — contracts, run, validate, watch.
source: https://github.com/wevm/wagmi/blob/main/packages/cli/src/config.ts
---

# Plugin API

Plugins extend the CLI with contract sources and/or generated code. Types live in `@wagmi/cli` (re-exported from `config`).

## Plugin type

```ts
interface Plugin {
  name: string
  contracts?: () => MaybePromise<ContractConfig[]>
  run?: (config: {
    contracts: Contract[]
    isTypeScript: boolean
    outputs: readonly { plugin: { name: string }, imports?: string, prepend?: string, content: string }[]
  }) => MaybePromise<{ imports?: string, prepend?: string, content: string }>
  validate?: () => MaybePromise<void>
  watch?: Watch
}
```

- **name**: Required. Used in banners and errors.
- **contracts**: Optional. Returns contract configs (abi/address/name) that are merged with config contracts. Resolved before any `run`.
- **run**: Optional. Receives all resolved contracts and previous plugin outputs; returns `{ imports?, prepend?, content }` to be appended to the output file.
- **validate**: Optional. Called once before resolving contracts; throw to fail the run.
- **watch**: Optional. Enables `wagmi generate --watch` for this plugin (paths, onChange/onAdd/onRemove, etc.).

## Watch type

```ts
interface Watch {
  paths: string[] | (() => MaybePromise<string[]>)
  onChange: (path: string) => MaybePromise<ContractConfig | undefined>
  onAdd?: (path: string) => MaybePromise<ContractConfig | undefined>
  onRemove?: (path: string) => MaybePromise<string | undefined>
  command?: () => MaybePromise<void>
  onClose?: () => MaybePromise<void>
}
```

- **paths**: Files/dirs to watch (array or async function returning array).
- **onChange**: File changed; return a new/updated ContractConfig to merge, or undefined to ignore.
- **onAdd**: File added; same return semantics.
- **onRemove**: File removed; return contract name to remove from the set.
- **command**: Optional. Run once when watcher is ready.
- **onClose**: Optional. Run when watch process is shutting down.

## Contract (resolved)

After resolution, each contract has the shape of `ContractConfig` plus:

- **content**: Generated string for this contract (ABI/address/config exports).
- **meta**: `{ abiName, addressName?, configName? }` for use in plugin `run`.

Plugins that only provide contracts (e.g. fetch/foundry/hardhat) implement `contracts()` and optionally `validate`/`watch`; plugins that generate hooks/code (e.g. react) implement `run` and receive the full `contracts` array.
