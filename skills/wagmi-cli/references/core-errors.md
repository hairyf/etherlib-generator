---
title: Validation errors
description: fromZodError and ValidationError for CLI option/config validation.
source: https://github.com/wevm/wagmi/blob/main/packages/cli/src/errors.ts
---

# Validation errors

Used internally when parsing CLI options and config (Zod). **Not exported** from `@wagmi/cli`; documented for plugin authors who validate with Zod and want similar error formatting.

## fromZodError

```ts
// Internal usage; signature for reference
fromZodError(zError, {
  prefix: 'Invalid option',
  maxIssuesInMessage: 99,
  issueSeparator: '\n- ',
  prefixSeparator: '\n- ',
})

const err = fromZodError(zError, {
  prefix: 'Invalid option',
  maxIssuesInMessage: 99,
  issueSeparator: '\n- ',
  prefixSeparator: '\n- ',
})
// err is ValidationError with .message and .details (zod issues)
```

Builds a single message from Zod issues: each issue is formatted as `message at \`path\``, joined by `issueSeparator`. Throwing this in `init`/`generate` yields a clean CLI error.

## ValidationError

```ts
class ValidationError extends Error {
  details: z.core.$ZodIssue[]
}
```

Use when you need to surface Zod validation failures in a CLI-friendly way (e.g. custom plugin `validate()` that uses Zod).
