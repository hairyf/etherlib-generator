---
title: Logger API
description: CLI logger — success, info, log, warn, error, spinner.
source: https://github.com/wevm/wagmi/blob/main/packages/cli/src/logger.ts
---

# Logger API

Exported as `logger` from `@wagmi/cli`. Uses picocolors and nanospinner.

## Functions

| Function | Effect |
|----------|--------|
| `logger.success(...args)` | Green console.log |
| `logger.info(...args)` | Blue console.info |
| `logger.log(...args)` | White console.log |
| `logger.warn(...args)` | Yellow console.warn |
| `logger.error(...args)` | Red console.error |
| `logger.spinner(text)` | Returns nanospinner instance (`.start()`, `.success()`, `.error()`, `.start('new text')`) |

## Usage

```ts
import * as logger from '@wagmi/cli'

logger.success('Config created at wagmi.config.ts')
logger.info('Using config wagmi.config.ts')
logger.warn('No contracts found.')
logger.error(`\n${(err as Error).message}`)

const spinner = logger.spinner('Resolving contracts')
spinner.start()
// ... async work
spinner.success()
// or on failure: spinner.error()
```

Arguments are passed through Node's `util.format`, so you can use `%s`, `%d`, etc. Newlines are preserved.
