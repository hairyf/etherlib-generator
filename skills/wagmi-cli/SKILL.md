# wagmi-cli

Use this skill when working with **@wagmi/cli**: managing and generating code from Ethereum ABIs (config, commands, plugins, programmatic API).

**Source**: [wevm/wagmi](https://github.com/wevm/wagmi) — scope: `packages/cli` only.

---

## Core

| Topic | Description | Reference |
|-------|--------------|-----------|
| **CLI commands** | `wagmi generate` / `wagmi init` and options | [core-commands](references/core-commands.md) |
| **Config** | `defineConfig`, `Config`, `ContractConfig`, default config | [core-config](references/core-config.md) |
| **Plugin API** | Plugin and Watch types; contracts, run, validate, watch | [core-plugin-api](references/core-plugin-api.md) |
| **Logger** | success, info, log, warn, error, spinner | [core-logger](references/core-logger.md) |
| **Validation errors** | fromZodError, ValidationError (internal) | [core-errors](references/core-errors.md) |
| **Internal types** | Compute, MaybeArray, MaybePromise, RequiredBy | [core-types](references/core-types.md) |

---

## Features

| Topic | Description | Reference |
|-------|--------------|-----------|
| **Config resolution** | How `findConfig` and `--config` / `--root` work | [features-config-resolution](references/features-config-resolution.md) |
| **Built-in plugins** | fetch, foundry, hardhat, react, etherscan, sourcify, routescan, blockExplorer, actions | [features-plugins](references/features-plugins.md) |
| **Foundry / Hardhat** | foundry(), hardhat() options — artifacts, deployments, watch, commands | [features-foundry-hardhat](references/features-foundry-hardhat.md) |
| **Etherscan & env** | API keys, loadEnv, .env files | [features-etherscan-env](references/features-etherscan-env.md) |
| **Fetch plugin** | request, parse, getCacheKey, cache, timeout, getCacheDir | [features-fetch](references/features-fetch.md) |
| **blockExplorer** | baseUrl, apiKey, chainId, getAddress, getabi API | [features-block-explorer](references/features-block-explorer.md) |
| **Sourcify / Routescan** | sourcify(), routescan() — chainId, contracts, API key | [features-sourcify-routescan](references/features-sourcify-routescan.md) |
| **React / Actions options** | getHookName, abiItemHooks, getActionName, overridePackageName | [features-react-actions](references/features-react-actions.md) |

---

## Advanced

| Topic | Description | Reference |
|-------|--------------|-----------|
| **Programmatic usage** | Exports from `@wagmi/cli`, `@wagmi/cli/config`, `@wagmi/cli/plugins` | [advanced-programmatic](references/advanced-programmatic.md) |
| **Config resolution & bundling** | resolveConfig, bundle-require, async config export | [advanced-resolve-config](references/advanced-resolve-config.md) |
| **Internal utils** | format, getAddressDocString, getIsUsingTypeScript, packages | [advanced-utils](references/advanced-utils.md) |
| **Generate flow** | getContract, writeContracts, watch, contract uniqueness | [advanced-generate-flow](references/advanced-generate-flow.md) |

---

## Quick reference

- **Binary**: `wagmi` (after `pnpm add @wagmi/cli`).
- **Config file**: `wagmi.config.ts` or `wagmi.config.js` (or path via `-c`).
- **Default out**: `src/generated.ts`.
- **Docs**: [wagmi.sh](https://wagmi.sh).
