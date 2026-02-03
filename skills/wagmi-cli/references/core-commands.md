---
title: CLI Commands
description: wagmi CLI subcommands — generate and init.
source: https://github.com/wevm/wagmi/blob/main/packages/cli/src/cli.ts
---

# CLI Commands

Binary: `wagmi`. Built with [cac](https://github.com/cacjs/cac).

## Commands

### `wagmi generate`

Generate code from config (ABIs + plugins). Writes to `config.out`.

| Option | Alias | Type | Description |
|--------|--------|------|-------------|
| `--config <path>` | `-c` | string | Path to config file |
| `--root <path>` | `-r` | string | Root directory to resolve config from |
| `--watch` | `-w` | boolean | Watch config/plugins and re-run on change |

```bash
wagmi generate
wagmi generate -c wagmi.config.ts
wagmi generate --watch
```

- If no config is found and `--config` was not passed, throws "Config not found".
- With `--watch`, process stays alive; config file changes require restart.

### `wagmi init`

Create a config file. Skips if one already exists.

| Option | Alias | Type | Description |
|--------|--------|------|-------------|
| `--config <path>` | `-c` | string | Path for the new config file |
| `--root <path>` | `-r` | string | Directory to create config in |

- Default output: `wagmi.config.ts` or `wagmi.config.js` based on TypeScript detection in the project.
- If config already exists, logs path and returns without writing.

## Help and version

```bash
wagmi --help
wagmi --version
```

Unknown commands (e.g. `wagmi foo`) throw: `Unknown command: foo`.
