---
title: Programmatic usage and exports
description: Using @wagmi/cli as a library — config, plugins, logger, loadEnv.
source: https://github.com/wevm/wagmi/blob/main/packages/cli/package.json
---

# Programmatic usage and exports

The CLI package exposes entrypoints for use in config files and scripts.

## Entrypoints

| Import | Purpose |
|--------|---------|
| `@wagmi/cli` | Config types, defineConfig, logger, loadEnv, version |
| `@wagmi/cli/config` | Config, ContractConfig, Plugin, defineConfig, defaultConfig |
| `@wagmi/cli/plugins` | All built-in plugins (fetch, foundry, hardhat, react, etherscan, etc.) |

## Main module (`@wagmi/cli`)

```ts
import type { Config, ContractConfig, Plugin } from '@wagmi/cli'
import {

  defineConfig,
  loadEnv,
  logger,

  version
} from '@wagmi/cli'
```

- **logger**: Spinner and log helpers used by the CLI (e.g. logger.spinner, logger.success, logger.error).
- **loadEnv**: Load env files (e.g. for Etherscan API key) before resolving config. Used internally when loading config.
- **version**: CLI version string.

## Config module (`@wagmi/cli/config`)

Use when you only need types and defineConfig:

```ts
import type { Config, Plugin } from '@wagmi/cli/config'
import { defineConfig } from '@wagmi/cli/config'
```

## Plugins module (`@wagmi/cli/plugins`)

Use in `wagmi.config.ts` to register plugins without pulling the full CLI:

```ts
import { fetch, foundry, react } from '@wagmi/cli/plugins'
```

## Running generate/init from Node

Commands are not exported as callable functions in the public API. To run the CLI programmatically, spawn the binary or require the built CLI entry (e.g. `dist/esm/cli.js`). The public API is intended for config files and custom tooling that needs types and plugins.
