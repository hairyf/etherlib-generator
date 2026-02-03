import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { fromZodError } from '../src/errors'

describe('fromZodError', () => {
  it('creates ValidationError with default prefix', () => {
    const schema = z.object({ foo: z.string() })
    const result = schema.safeParse({ foo: 123 })
    if (result.success)
      throw new Error('expected failure')
    const err = fromZodError(result.error)
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toContain('Validation Error')
    expect(err.message).toContain('Expected string')
    expect(err.details).toEqual(result.error.errors)
  })

  it('formats path for nested fields', () => {
    const schema = z.object({
      user: z.object({
        name: z.string(),
        age: z.number(),
      }),
    })
    const result = schema.safeParse({ user: { name: 1, age: 'x' } })
    if (result.success)
      throw new Error('expected failure')
    const err = fromZodError(result.error)
    expect(err.message).toContain('user.name')
    expect(err.message).toContain('user.age')
  })

  it('respects custom prefix', () => {
    const schema = z.object({ x: z.number() })
    const result = schema.safeParse({ x: 'not a number' })
    if (result.success)
      throw new Error('expected failure')
    const err = fromZodError(result.error, { prefix: 'Invalid option' })
    expect(err.message).toContain('Invalid option')
  })

  it('limits issues with maxIssuesInMessage', () => {
    const schema = z.object({
      a: z.string(),
      b: z.string(),
      c: z.string(),
    })
    const result = schema.safeParse({ a: 1, b: 2, c: 3 })
    if (result.success)
      throw new Error('expected failure')
    const err = fromZodError(result.error, { maxIssuesInMessage: 2 })
    const issueCount = (err.message.match(/at `/g) ?? []).length
    expect(issueCount).toBeLessThanOrEqual(2)
  })

  it('uses custom issueSeparator', () => {
    const schema = z.object({ a: z.string(), b: z.number() })
    const result = schema.safeParse({ a: 1, b: 'x' })
    if (result.success)
      throw new Error('expected failure')
    const err = fromZodError(result.error, { issueSeparator: ' | ' })
    expect(err.message).toContain(' | ')
  })
})
