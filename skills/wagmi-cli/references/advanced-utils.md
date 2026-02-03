---
title: Internal utils
description: format, getAddressDocString, getIsUsingTypeScript, packages — not exported.
source: https://github.com/wevm/wagmi/blob/main/packages/cli/src/utils/
---

# Internal utils

Used by the CLI; **not** exported from `@wagmi/cli`. Documented for understanding behavior and for custom tooling that mirrors the CLI.

## format(content: string)

Uses Prettier to format generated code. Resolves config from `process.cwd()` and merges with:

- `parser: 'typescript'`, `semi: false`, `singleQuote: true`, `tabWidth: 2`, `trailingComma: 'all'`, `printWidth: 80`, `endOfLine: 'lf'`, `arrowParens: 'always'`
- `plugins: []` (overrides user plugins to avoid side effects)

Called after assembling the output file in `generate`.

## getAddressDocString({ address })

Returns a JSDoc-style string for multi-chain addresses: bullet list of “View Contract on ChainName Explorer” links using viem/chains blockExplorers. Single address or unknown chain returns `''`. Used in generated contract blocks for address/config exports.

## getIsUsingTypeScript()

Returns `true` if the project is considered TypeScript: finds (upward from cwd) any of `tsconfig.json`, `tsconfig.base.json`, `tsconfig.lib.json`, `tsconfig.node.json`, or `wagmi.config.ts` / `wagmi.config.mts`. Otherwise `false`. Used by `init` (config extension) and `generate` (e.g. `as const` in output).

## getIsPackageInstalled({ packageName, cwd? })

Runs package-manager-specific “list” (e.g. `pnpm ls packageName`) and returns whether the package is installed. Used by foundry/hardhat plugins to decide build commands.

## getPackageManager(executable?: boolean)

Detects package manager from `npm_config_user_agent` or lockfile (yarn.lock, package-lock.json, pnpm-lock.yaml, bun.lockb) and optional global fallback. Returns `'npm' | 'yarn' | 'pnpm' | 'bun'`; if `executable === true`, returns `'npx'` for npm. Used by foundry/hardhat for `clean` / `build` / `rebuild` commands.
