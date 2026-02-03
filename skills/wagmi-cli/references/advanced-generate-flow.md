---
title: Generate flow (internal)
description: getContract, writeContracts, plugin order, watch debounce, contract uniqueness.
source: https://github.com/wevm/wagmi/blob/main/packages/cli/src/commands/generate.ts
---

# Generate flow (internal)

How `wagmi generate` runs; not part of the public API. Use when debugging or extending the CLI.

## Order of operations

1. **findConfig** → resolve config path.
2. **resolveConfig** → load config (single or array); each entry must have unique `out`.
3. For each config:
   - **Validate** each plugin (`plugin.validate?.()`).
   - **Resolve contracts**: config `contracts` plus each plugin’s `contracts()`; merge into one list. Contract **names must be unique** across config + all plugins.
   - **getContract** for each: validate ABI (abitype/zod), optionally address; produce `content` and `meta` (abiName, addressName?, configName?). Contracts sorted by name (asc).
   - **Run plugins**: call `plugin.run({ contracts, isTypeScript, outputs })` in order; collect `imports`, `prepend`, `content`.
   - **writeContracts**: assemble imports, prepend, per-contract content, then plugin content; **format** (Prettier) and write to `config.out`.
4. If `--watch`: set up chokidar on each plugin’s `watch.paths`; on change/add/remove, update contract map, re-run plugins, debounce writes (100 ms), write to same `out`.

## getContract (conceptual)

- Input: `ContractConfig` + `isTypeScript`.
- ABI: parsed with AbiSchema (abitype/zod); invalid ABI throws with “Invalid ABI for contract …”.
- Address: optional; if present, validated (single or Record<chainId, address>), then exports `addressName`, `configName` in generated file.
- Output: `Contract` with `content` (string for this contract) and `meta` (abiName, addressName?, configName?).

## writeContracts

- Concatenates: `imports` → `prepend` → each contract’s `content` → plugin `content` (with banner per plugin).
- Banner format: `// ... // PluginName // ...`
- Then `format(code)` and `writeFile(outPath, formatted)`.

## Watch

- Each plugin’s `watch.paths` (or result of `paths()`) are watched; on `change`/`add`, `onChange`/`onAdd` can return a new ContractConfig to merge; on `unlink`, `onRemove` can return contract name to remove.
- Config file itself is watched; change only logs “Restart process for changes to take effect.”
- On SIGINT/SIGTERM, `onClose` is called and watchers are closed.

## Contract name uniqueness

Duplicate contract names (from config or any plugin) throw: `Contract name "X" must be unique.` Same for duplicate `out` across configs: `out "path" must be unique.`
